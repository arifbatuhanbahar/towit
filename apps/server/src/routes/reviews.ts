import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { validateBody, getBody } from "../middleware/validate.js";
import { sendError } from "../lib/errors.js";
import { routeParamId } from "../lib/params.js";

export const reviewsRouter = Router();

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
});

/**
 * POST /jobs/:id/review — müşteri tamamlanmış iş için puan bırakır.
 * - Yalnızca işin müşterisi yazabilir.
 * - Sadece `completed` durumundaki işler için.
 * - Aynı iş için tek review (unique jobId).
 */
reviewsRouter.post(
  "/jobs/:id/review",
  requireAuth,
  validateBody(createSchema),
  async (req: AuthedRequest, res) => {
    if (req.user!.role !== "customer") {
      return sendError(res, 403, "FORBIDDEN", "Yalnızca müşteri değerlendirme yazabilir");
    }
    const jobId = routeParamId(req.params.id);
    if (!jobId) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz talep kimliği");

    const job = await prisma.job.findUnique({ where: { id: jobId }, include: { review: true } });
    if (!job || job.customerId !== req.user!.id) {
      return sendError(res, 404, "NOT_FOUND", "Talep bulunamadı");
    }
    if (job.status !== "completed") {
      return sendError(res, 409, "INVALID_STATE_TRANSITION", "Yalnızca tamamlanmış işler değerlendirilebilir");
    }
    if (job.review) {
      return sendError(res, 409, "ALREADY_REVIEWED", "Bu iş zaten değerlendirildi");
    }

    const { rating, comment } = getBody<typeof createSchema>(req);
    const review = await prisma.review.create({
      data: {
        jobId,
        operatorId: job.operatorId,
        customerId: req.user!.id,
        rating,
        comment: comment?.trim() || null,
      },
    });

    return res.status(201).json({
      id: review.id,
      jobId: review.jobId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
  }
);

/** GET /operators/:id/reviews — public özet (ortalama + son 10 yorum). */
reviewsRouter.get("/operators/:id/reviews", async (req, res) => {
  const id = routeParamId(req.params.id);
  if (!id) return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz operatör kimliği");

  const [agg, recent] = await Promise.all([
    prisma.review.aggregate({
      where: { operatorId: id },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { operatorId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, rating: true, comment: true, createdAt: true },
    }),
  ]);

  return res.json({
    average: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : null,
    count: agg._count._all,
    recent,
  });
});
