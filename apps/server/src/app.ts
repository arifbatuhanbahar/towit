import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { citiesRouter } from "./routes/cities.js";
import { placesRouter } from "./routes/places.js";
import { operatorsRouter } from "./routes/operators.js";
import { jobsRouter } from "./routes/jobs.js";
import { directionsRouter } from "./routes/directions.js";
import { reviewsRouter } from "./routes/reviews.js";
import { logger } from "./lib/logger.js";
import { sendError } from "./lib/errors.js";

function isDatabaseUnavailable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string };
  if (e.code === "P1000" || e.code === "P1001") return true;
  if (String(e.name ?? "").includes("PrismaClientInitializationError")) return true;
  return /can't reach database server|database server.*running/i.test(String(e.message ?? ""));
}

function isDatabaseNotReady(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; name?: string; message?: string };
  if (e.code === "P2021" || e.code === "P2022") return true;
  if (String(e.name ?? "").includes("PrismaClientKnownRequestError")) {
    const msg = String(e.message ?? "").toLowerCase();
    return msg.includes("table") || msg.includes("column") || msg.includes("does not exist");
  }
  return false;
}

export function createApp() {
  const app = express();
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN?.split(",") ?? true,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRouter);
  app.use("/me", meRouter);
  app.use("/cities", citiesRouter);
  app.use("/places", placesRouter);
  app.use("/operators", operatorsRouter);
  app.use("/jobs", jobsRouter);
  app.use("/directions", directionsRouter);
  app.use(reviewsRouter);

  app.use((_req, res) => {
    return sendError(res, 404, "NOT_FOUND", "Kaynak bulunamadı");
  });

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    logger.error("Unhandled error", {
      method: req.method,
      path: req.path,
      err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    });

    if (isDatabaseUnavailable(err)) {
      return sendError(
        res,
        503,
        "DB_UNAVAILABLE",
        "Veritabani baglantisi kurulamadi. Lutfen PostgreSQL servisini baslatin."
      );
    }
    if (isDatabaseNotReady(err)) {
      return sendError(
        res,
        503,
        "DB_NOT_READY",
        "Veritabani hazir degil. Migrasyonlari calistirin: npm run db:migrate"
      );
    }

    return sendError(res, 500, "INTERNAL", "Beklenmeyen bir hata oluştu");
  });

  return app;
}
