import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

type Options = {
  /** Pencere süresi (ms). */
  windowMs: number;
  /** Aynı anahtar için pencere içinde izin verilen en fazla istek sayısı. */
  max: number;
  /** İstemci anahtarı (varsayılan: IP + path). */
  keyBy?: (req: Request) => string;
};

type Bucket = { count: number; resetAt: number };

/**
 * Bağımlılıksız, process-başına in-memory rate limiter. Production'da
 * dağıtık bir sistem için Redis tabanlıya çıkarılmalıdır; MVP için yeterli.
 */
export function rateLimit({ windowMs, max, keyBy }: Options) {
  const buckets = new Map<string, Bucket>();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = (keyBy ? keyBy(req) : defaultKey(req));
    const now = Date.now();
    let b = buckets.get(key);
    if (!b || b.resetAt <= now) {
      b = { count: 0, resetAt: now + windowMs };
      buckets.set(key, b);
    }
    b.count += 1;

    const remaining = Math.max(0, max - b.count);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(b.resetAt / 1000)));

    if (b.count > max) {
      const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      logger.warn("Rate limit exceeded", { key, path: req.path, count: b.count });
      return res.status(429).json({
        error: { code: "RATE_LIMITED", message: "Çok fazla istek. Lütfen biraz bekleyin." },
      });
    }

    // Periyodik olarak eski anahtarları temizle
    if (buckets.size > 10_000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }

    return next();
  };
}

function defaultKey(req: Request): string {
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  return `${ip}:${req.baseUrl}${req.path}`;
}
