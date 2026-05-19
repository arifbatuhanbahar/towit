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
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Kaynak bulunamadı" } });
  });

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    logger.error("Unhandled error", {
      method: req.method,
      path: req.path,
      err: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    });
    return res.status(500).json({
      error: { code: "INTERNAL", message: "Beklenmeyen bir hata oluştu" },
    });
  });

  return app;
}
