import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, z } from "zod";
import { sendError } from "../lib/errors.js";

/**
 * İstek gövdesini verilen Zod şeması ile doğrular. Başarısızlıkta
 * tek satırda 400 döner; başarılıysa `req.validatedBody` üzerinden
 * tip-güvenli erişim sağlar.
 */
export function validateBody<S extends ZodTypeAny>(schema: S) {
  return function validateBodyMiddleware(req: Request, res: Response, next: NextFunction) {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "VALIDATION_ERROR", "Geçersiz istek gövdesi", parsed.error.flatten());
    }
    (req as Request & { validatedBody: z.infer<S> }).validatedBody = parsed.data;
    return next();
  };
}

/**
 * Tip-güvenli erişim yardımcısı — rota içinde:
 *   `const { email } = getBody<typeof loginSchema>(req);`
 */
export function getBody<S extends ZodTypeAny>(req: Request): z.infer<S> {
  return (req as Request & { validatedBody: z.infer<S> }).validatedBody;
}
