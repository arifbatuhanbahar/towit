import { Router } from "express";
import { z } from "zod";
import { JobStatus, BreakdownType, CustomerVehicleCategory } from "@prisma/client";
import { prisma } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { sendError } from "../lib/errors.js";
import { routeParamId } from "../lib/params.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { isValidLatLng, haversineKm } from "../services/geo.js";
import { resolveDrivingOrHaversineKm } from "../services/distance.js";
import { routeBetween } from "../services/directions.js";
import { previewPrice } from "../services/pricing.js";
import { COMPAT } from "../services/compatibility.js";
import {
  toDbBreakdown,
  toUiBreakdown,
  serializeCustomerJobSummary,
  serializeOperatorJobSummary,
  serializeJobDetail,
} from "../services/jobPresentation.js";
import { parseOptionalOrigin } from "../services/jobRouting.js";
import { resolveTransition } from "../services/jobStateMachine.js";

export const jobsRouter = Router();

const point = z.object({ lat: z.number(), lng: z.number() });

const createJobSchema = z.object({
  cityCode: z.string().length(2),
  operatorProfileId: z.string().min(1),
  pickup: point,
  destination: point,
  // Vehicle details (optional)
  customerVehicleBrand: z.string().max(50).optional(),
  customerVehicleModel: z.string().max(80).optional(),
  customerVehiclePlate: z.string().max(15).optional(),
  // UI 'yakıt' ve DB 'yakit' her ikisini de kabul et
  breakdownType: z
    .enum(["lastik", "motor", "aku", "yakıt", "yakit", "kaza", "diger"])
    .default("diger"),
  customerPhone: z.string().max(20).optional(),
  customerVehicleCategory: z
    .enum(["otomobil", "motorsiklet", "hafif_ticari", "agir_vasita"])
    .default("otomobil"),
});

const patchJobSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("accept") }),
  z.object({ action: z.literal("reject") }),
  z.object({ action: z.literal("en_route") }),
  z.object({ action: z.literal("complete") }),
]);

async function customerHasBlockingJob(customerId: string) {
  const blocking = await prisma.job.findFirst({
    where: {
      customerId,
      status: { in: [JobStatus.open, JobStatus.accepted, JobStatus.en_route] },
    },
  });
  return !!blocking;
}

jobsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "customer") {
    return sendError(res, 403, "FORBIDDEN", "Yalnızca müşteri talep oluşturabilir");
  }
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
  }
  const { cityCode, operatorProfileId, pickup, destination,
          customerVehicleBrand, customerVehicleModel, customerVehiclePlate,
          breakdownType, customerPhone, customerVehicleCategory } = parsed.data;
  if (!isValidLatLng(pickup.lat, pickup.lng) || !isValidLatLng(destination.lat, destination.lng)) {
    return sendError(res, 400, "INVALID_COORDINATES", "Koordinatlar geçersiz");
  }

  if (await customerHasBlockingJob(req.user!.id)) {
    return sendError(
      res,
      409,
      "CONFLICT_OPEN_JOB",
      "Devam eden bir talebiniz varken yeni talep oluşturamazsınız"
    );
  }

  const op = await prisma.operatorProfile.findFirst({
    where: { id: operatorProfileId, isActive: true, tariff: { isNot: null } },
    include: { tariff: true },
  });
  if (!op?.tariff) return sendError(res, 404, "NOT_FOUND", "Çekici bulunamadı veya pasif");

  // Uyumluluk kontrolü: seçilen çekici türü müşteri aracıyla uyumlu mu?
  const compatibleTypes = COMPAT[customerVehicleCategory] ?? [];
  if (!compatibleTypes.includes(op.vehicleType)) {
    return sendError(
      res,
      400,
      "INCOMPATIBLE_VEHICLE",
      "Seçilen çekici bu araç kategorisiyle uyumlu değil"
    );
  }

  const distToPickup = haversineKm(
    { lat: op.serviceCenterLat, lng: op.serviceCenterLng },
    pickup
  );
  if (distToPickup > op.serviceRadiusKm) {
    return sendError(res, 400, "INVALID_COORDINATES", "Seçilen çekici bu çekim noktasını kapsamıyor");
  }

  const { km: jobDistanceKm } = await resolveDrivingOrHaversineKm(pickup, destination);
  const price = previewPrice(op.tariff.baseFee, op.tariff.perKmFee, jobDistanceKm);

  const job = await prisma.job.create({
    data: {
      customerId: req.user!.id,
      operatorId: op.id,
      cityCode,
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      destLat: destination.lat,
      destLng: destination.lng,
      distanceKm: jobDistanceKm,
      priceSnapshot: price,
      status: JobStatus.open,
      customerVehicleBrand: customerVehicleBrand ?? null,
      customerVehicleModel: customerVehicleModel ?? null,
      customerVehiclePlate: customerVehiclePlate ?? null,
      breakdownType: toDbBreakdown(breakdownType) as BreakdownType,
      customerPhone: customerPhone ?? null,
      customerVehicleCategory: customerVehicleCategory as CustomerVehicleCategory,
    },
  });

  return res.status(201).json({
    id: job.id,
    status: job.status,
    priceSnapshot: job.priceSnapshot.toString(),
    distanceKm: job.distanceKm,
    operatorProfileId: op.id,
  });
});

jobsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role === "customer") {
    const list = await prisma.job.findMany({
      where: { customerId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: { operator: true },
    });
    return res.json({
      jobs: list.map((j) => serializeCustomerJobSummary(j)),
    });
  }

  const list = await prisma.job.findMany({
    where: { operator: { userId: req.user!.id } },
    orderBy: { createdAt: "desc" },
    include: { customer: true },
  });
  return res.json({
    jobs: list.map((j) =>
      serializeOperatorJobSummary({
        id: j.id,
        status: j.status,
        priceSnapshot: j.priceSnapshot,
        distanceKm: j.distanceKm,
        createdAt: j.createdAt,
        breakdownType: j.breakdownType,
        customerEmail: j.customer.email,
        customerVehicleBrand: j.customerVehicleBrand,
        customerVehicleModel: j.customerVehicleModel,
        customerVehiclePlate: j.customerVehiclePlate,
        pickup: { lat: j.pickupLat, lng: j.pickupLng },
        destination: { lat: j.destLat, lng: j.destLng },
      })
    ),
  });
});

/** Çekici: çekim noktasına gidiş rotası (Google Directions + trafik, ORS yol ağı, yedek düz hat). */
jobsRouter.get("/:id/route", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "operator") {
    return sendError(res, 403, "FORBIDDEN", "Rota yalnızca çekici hesabıyla görüntülenebilir");
  }
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");

  const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!op || job.operatorId !== op.id) {
    return sendError(res, 403, "FORBIDDEN", "Bu talep size ait değil");
  }
  if (job.status !== JobStatus.accepted && job.status !== JobStatus.en_route) {
    return sendError(
      res,
      409,
      "INVALID_STATE_TRANSITION",
      "Rota yalnızca talep kabul edildikten veya yolda iken kullanılabilir"
    );
  }

  const parsedOrigin = parseOptionalOrigin(req.query, { lat: op.serviceCenterLat, lng: op.serviceCenterLng });
  if (parsedOrigin.error) {
    return sendError(res, 400, "INVALID_COORDINATES", parsedOrigin.error);
  }
  const { origin } = parsedOrigin;

  const pickup = { lat: job.pickupLat, lng: job.pickupLng };
  const route = await routeBetween(origin, pickup);

  return res.json({
    jobId: job.id,
    jobStatus: job.status,
    origin,
    pickup,
    points: route.points,
    distanceMeters: route.distanceMeters,
    distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
    durationSeconds: route.durationSeconds,
    durationMinutes: Math.max(1, Math.ceil(route.durationSeconds / 60)),
    source: route.source,
  });
});

/** Çekici: müşteri alındıktan sonra varışa gidiş rotası (çekim → varış). */
jobsRouter.get("/:id/route-to-destination", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "operator") {
    return sendError(res, 403, "FORBIDDEN", "Rota yalnızca çekici hesabıyla görüntülenebilir");
  }
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");

  const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!op || job.operatorId !== op.id) {
    return sendError(res, 403, "FORBIDDEN", "Bu talep size ait değil");
  }
  if (job.status !== JobStatus.en_route) {
    return sendError(res, 409, "INVALID_STATE_TRANSITION", "Bu rota yalnızca yolda durumunda kullanılabilir");
  }

  const parsedOrigin = parseOptionalOrigin(req.query, { lat: job.pickupLat, lng: job.pickupLng });
  if (parsedOrigin.error) {
    return sendError(res, 400, "INVALID_COORDINATES", parsedOrigin.error);
  }
  const { origin } = parsedOrigin;

  const destination = { lat: job.destLat, lng: job.destLng };
  const route = await routeBetween(origin, destination);

  return res.json({
    jobId: job.id,
    jobStatus: job.status,
    origin,
    destination,
    points: route.points,
    distanceMeters: route.distanceMeters,
    distanceKm: Number((route.distanceMeters / 1000).toFixed(2)),
    durationSeconds: route.durationSeconds,
    durationMinutes: Math.max(1, Math.ceil(route.durationSeconds / 60)),
    source: route.source,
  });
});

jobsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      operator: { include: { user: true } },
      customer: true,
    },
  });
  if (!job) return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");

  let requestingOp: { id: string } | null = null;
  if (req.user!.role === "customer" && job.customerId !== req.user!.id) {
    return sendError(res, 403, "FORBIDDEN", "Bu talebe erişemezsiniz");
  }
  if (req.user!.role === "operator") {
    requestingOp = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });
    if (!requestingOp || job.operatorId !== requestingOp.id) {
      return sendError(res, 403, "FORBIDDEN", "Bu talebe erişemezsiniz");
    }
  }

  const phoneVisible = ["accepted", "en_route"].includes(job.status);
  const canSeeCustomerPhone = req.user!.role === "operator" && phoneVisible;
  const canSeeOperatorPhone = req.user!.role === "customer" && phoneVisible;

  const operatorLocation =
    job.operatorLat != null && job.operatorLng != null
      ? { lat: job.operatorLat, lng: job.operatorLng, updatedAt: job.operatorLocAt }
      : null;

  return res.json(
    serializeJobDetail({
      id: job.id,
      status: job.status,
      priceSnapshot: job.priceSnapshot,
      distanceKm: job.distanceKm,
      cityCode: job.cityCode,
      pickup: { lat: job.pickupLat, lng: job.pickupLng },
      destination: { lat: job.destLat, lng: job.destLng },
      operator: {
        businessName: job.operator.businessName,
        vehicleType: job.operator.vehicleType,
        vehicleModel: job.operator.vehicleModel,
        vehicleYear: job.operator.vehicleYear,
        phone: canSeeOperatorPhone ? job.operator.phone : null,
      },
      customerEmail: job.customer.email,
      customerVehicleBrand: job.customerVehicleBrand,
      customerVehicleModel: job.customerVehicleModel,
      customerVehiclePlate: job.customerVehiclePlate,
      breakdownType: job.breakdownType,
      customerPhone: canSeeCustomerPhone ? job.customerPhone : null,
      customerVehicleCategory: job.customerVehicleCategory,
      operatorLocation,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })
  );
});

/**
 * SSE: Job değişikliklerini canlı aktarır (polling yerine/yanında).
 * - Yetki: müşteri kendi job'ı; operatör kendi job'ı.
 * - Event türleri:
 *   - job: job snapshot (GET /jobs/:id ile aynı şekil)
 *   - ping: bağlantı canlı tutma
 */
jobsRouter.get("/:id/stream", async (req, res) => {
  // EventSource header'a Authorization ekleyemediği için token query ile de alınabilir:
  //   /jobs/:id/stream?access=...
  const h = req.headers.authorization;
  const qAccess = req.query.access;
  const accessFromQuery = Array.isArray(qAccess) ? qAccess[0] : qAccess;
  const token =
    typeof h === "string" && h.startsWith("Bearer ")
      ? h.slice("Bearer ".length)
      : typeof accessFromQuery === "string"
        ? accessFromQuery
        : null;

  if (!token) {
    return sendError(res, 401, "UNAUTHORIZED", "Bearer token gerekli");
  }

  let user: { id: string; role: "customer" | "operator" };
  try {
    const p = verifyAccessToken(token);
    user = { id: p.sub, role: p.role };
  } catch {
    return sendError(res, 401, "UNAUTHORIZED", "Geçersiz veya süresi dolmuş oturum");
  }

  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");

  // SSE header'ları
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  const send = (event: string, data: unknown) => {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // İlk snapshot'ı hemen gönder ve yetki kontrolü yap
  const loadSnapshot = async () => {
    const job = await prisma.job.findUnique({
      where: { id },
      include: { operator: { include: { user: true } }, customer: true },
    });
    if (!job) {
      send("job", { error: { code: "NOT_FOUND", message: "Talep bulunamadı" } });
      return null;
    }
    if (user.role === "customer" && job.customerId !== user.id) {
      send("job", { error: { code: "FORBIDDEN", message: "Bu talebe erişemezsiniz" } });
      return null;
    }
    if (user.role === "operator") {
      const op = await prisma.operatorProfile.findUnique({ where: { userId: user.id } });
      if (!op || job.operatorId !== op.id) {
        send("job", { error: { code: "FORBIDDEN", message: "Bu talebe erişemezsiniz" } });
        return null;
      }
    }

    const phoneVisible = ["accepted", "en_route"].includes(job.status);
    const canSeeCustomerPhone = user.role === "operator" && phoneVisible;
    const canSeeOperatorPhone = user.role === "customer" && phoneVisible;

    const operatorLocation =
      job.operatorLat != null && job.operatorLng != null
        ? { lat: job.operatorLat, lng: job.operatorLng, updatedAt: job.operatorLocAt }
        : null;

    return serializeJobDetail({
      id: job.id,
      status: job.status,
      priceSnapshot: job.priceSnapshot,
      distanceKm: job.distanceKm,
      cityCode: job.cityCode,
      pickup: { lat: job.pickupLat, lng: job.pickupLng },
      destination: { lat: job.destLat, lng: job.destLng },
      operator: {
        businessName: job.operator.businessName,
        vehicleType: job.operator.vehicleType,
        vehicleModel: job.operator.vehicleModel,
        vehicleYear: job.operator.vehicleYear,
        phone: canSeeOperatorPhone ? job.operator.phone : null,
      },
      customerEmail: job.customer.email,
      customerVehicleBrand: job.customerVehicleBrand,
      customerVehicleModel: job.customerVehicleModel,
      customerVehiclePlate: job.customerVehiclePlate,
      breakdownType: job.breakdownType,
      customerPhone: canSeeCustomerPhone ? job.customerPhone : null,
      customerVehicleCategory: job.customerVehicleCategory,
      operatorLocation,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  };

  let lastSig: string | null = null;

  const first = await loadSnapshot();
  if (first) {
    lastSig = `${first.updatedAt}-${first.operatorLocation?.updatedAt ?? ""}-${first.status}`;
    send("job", first);
  } else {
    // erişim yoksa bağlantıyı kapat
    res.end();
    return;
  }

  // 2 sn’de bir DB'den oku; değişiklik varsa gönder
  const pollMs = 2000;
  const interval = setInterval(async () => {
    if (closed) return;
    try {
      const snap = await loadSnapshot();
      if (!snap) {
        clearInterval(interval);
        if (!closed) res.end();
        return;
      }
      const sig = `${snap.updatedAt}-${snap.operatorLocation?.updatedAt ?? ""}-${snap.status}`;
      if (sig !== lastSig) {
        lastSig = sig;
        send("job", snap);
      } else {
        send("ping", { t: Date.now() });
      }
    } catch {
      // geçici DB hatalarında bağlantıyı tamamen koparmak yerine ping at
      send("ping", { t: Date.now() });
    }
  }, pollMs);

  // açık bağlantıda node süreçleri sızmasın
  req.on("close", () => {
    clearInterval(interval);
  });
});

/** Operatör canlı konum güncellemesi (müşteri polling ile alır). */
jobsRouter.patch("/:id/location", requireAuth, async (req: AuthedRequest, res) => {
  if (req.user!.role !== "operator") {
    return sendError(res, 403, "FORBIDDEN", "Konum güncellemesi yalnızca çekici hesabıyla yapılabilir");
  }
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");

  const locSchema = z.object({ lat: z.number(), lng: z.number() });
  const parsed = locSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "lat ve lng sayısal olmalıdır");
  }
  const { lat, lng } = parsed.data;
  if (!isValidLatLng(lat, lng)) {
    return sendError(res, 400, "INVALID_COORDINATES", "Koordinatlar geçersiz");
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");

  const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!op || job.operatorId !== op.id) {
    return sendError(res, 403, "FORBIDDEN", "Bu talep size ait değil");
  }
  if (job.status !== "accepted" && job.status !== "en_route") {
    return sendError(res, 409, "INVALID_STATE_TRANSITION", "Konum yalnızca kabul veya yolda durumunda güncellenebilir");
  }

  await prisma.job.update({
    where: { id },
    data: { operatorLat: lat, operatorLng: lng, operatorLocAt: new Date() },
  });

  return res.json({ ok: true });
});

jobsRouter.patch("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = patchJobSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
  }
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");
  const job = await prisma.job.findUnique({ where: { id }, include: { operator: true } });
  if (!job) return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");

  const action = parsed.data.action;

  if (action === "cancel") {
    if (req.user!.role !== "customer" || job.customerId !== req.user!.id) {
      return sendError(res, 403, "FORBIDDEN", "İptal yalnızca müşteri tarafından yapılabilir");
    }
    const transition = resolveTransition(action, job.status);
    if (!transition.ok) {
      return sendError(res, 409, "INVALID_STATE_TRANSITION", transition.message);
    }
    const updated = await prisma.job.update({ where: { id }, data: { status: transition.nextStatus } });
    return res.json({ id: updated.id, status: updated.status });
  }

  if (req.user!.role !== "operator") {
    return sendError(res, 403, "FORBIDDEN", "Bu işlem için çekici hesabı gerekli");
  }
  const op = await prisma.operatorProfile.findUnique({ where: { userId: req.user!.id } });
  if (!op || job.operatorId !== op.id) {
    return sendError(res, 403, "FORBIDDEN", "Bu talep size ait değil");
  }

  const transition = resolveTransition(action, job.status);
  if (!transition.ok) {
    return sendError(res, 409, "INVALID_STATE_TRANSITION", transition.message);
  }
  const updated = await prisma.job.update({ where: { id }, data: { status: transition.nextStatus } });
  return res.json({ id: updated.id, status: updated.status });
});
