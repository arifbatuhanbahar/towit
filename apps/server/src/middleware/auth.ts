import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";
import { sendError } from "../lib/errors.js";

export type AuthedRequest = Request & {
  user?: { id: string; role: "customer" | "operator" };
};

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) {
    return sendError(res, 401, "UNAUTHORIZED", "Bearer token gerekli");
  }
  const token = h.slice("Bearer ".length);
  try {
    const p = verifyAccessToken(token);
    req.user = { id: p.sub, role: p.role };
    next();
  } catch {
    return sendError(res, 401, "UNAUTHORIZED", "Geçersiz veya süresi dolmuş oturum");
  }
}

export function requireRole(role: "customer" | "operator") {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 401, "UNAUTHORIZED", "Oturum gerekli");
    if (req.user.role !== role) {
      return sendError(res, 403, "FORBIDDEN", "Bu işlem için yetkiniz yok");
    }
    next();
  };
}
