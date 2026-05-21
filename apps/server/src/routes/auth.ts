import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  hashRefreshToken,
  verifyAccessToken,
} from "../lib/jwt.js";
import { sendError } from "../lib/errors.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validateBody, getBody } from "../middleware/validate.js";
import { issueSession } from "../services/authSession.js";

/** Brute-force'u zorlaştırmak için IP+path başına dakikada 10 giriş/kayıt/refresh isteği. */
const authLimiter = rateLimit({ windowMs: 60_000, max: 10 });

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum(["customer", "operator"]),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerSchema), async (req, res) => {
  const { email, password, role } = getBody<typeof registerSchema>(req);
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return sendError(res, 409, "DUPLICATE_EMAIL", "Bu e-posta zaten kayıtlı");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      ...(role === "operator"
        ? {
            operatorProfile: {
              create: {
                businessName: "Yeni işletme",
                vehicleInfo: "—",
                serviceCenterLat: 41.0082,
                serviceCenterLng: 28.9784,
                serviceRadiusKm: 25,
                isActive: false,
                tariff: { create: { baseFee: "0", perKmFee: "0" } },
              },
            },
          }
        : {}),
    },
  });

  const { accessToken, refreshToken } = await issueSession(user.id, user.role);

  return res.status(201).json({
    user: { id: user.id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

authRouter.post("/login", authLimiter, validateBody(loginSchema), async (req, res) => {
  const { email, password } = getBody<typeof loginSchema>(req);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return sendError(res, 401, "UNAUTHORIZED", "E-posta veya parola hatalı");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return sendError(res, 401, "UNAUTHORIZED", "E-posta veya parola hatalı");

  const { accessToken, refreshToken } = await issueSession(user.id, user.role);

  return res.json({
    user: { id: user.id, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  });
});

authRouter.post("/refresh", authLimiter, validateBody(refreshSchema), async (req, res) => {
  const { refreshToken } = getBody<typeof refreshSchema>(req);
  const tokenHash = hashRefreshToken(refreshToken);
  const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!row || row.expiresAt < new Date()) {
    return sendError(res, 401, "UNAUTHORIZED", "Geçersiz yenileme belirteci");
  }
  const user = await prisma.user.findUnique({ where: { id: row.userId } });
  if (!user) return sendError(res, 401, "UNAUTHORIZED", "Kullanıcı bulunamadı");

  await prisma.refreshToken.delete({ where: { id: row.id } });

  const nextRole = user.role as "customer" | "operator";
  const { accessToken, refreshToken: nextRefreshToken } = await issueSession(user.id, nextRole);

  return res.json({ accessToken, refreshToken: nextRefreshToken });
});

/** İstemci access süresi dolduğunda doğrulama (FR-12). */
authRouter.get("/verify", (req, res) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHORIZED", "Bearer token gerekli");
  }
  try {
    verifyAccessToken(h.slice("Bearer ".length));
    return res.json({ ok: true });
  } catch {
    return sendError(res, 401, "UNAUTHORIZED", "Geçersiz veya süresi dolmuş oturum");
  }
});
