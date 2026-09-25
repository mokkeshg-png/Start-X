import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import v1Routes from "./routes";
import { errorMiddleware, notFoundMiddleware, generalLimiter } from "./middleware";

/**
 * Create and configure the Express application.
 * Exported separately from server startup for testing.
 */
export function createApp(): express.Application {
  const app = express();

  // ── Security ──────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ──────────────────────────────────────────────────────────────
  const corsOptions: cors.CorsOptions = {
    origin: env.FRONTEND_URL || false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  app.use(cors(corsOptions));

  // ── Body Parsing ──────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // ── Rate Limiting ─────────────────────────────────────────────────────
  app.use(generalLimiter);

  // ── Logging (safe format — no auth headers or request bodies) ─────────
  const morganFormat = env.NODE_ENV === "production"
    ? ":remote-addr :method :url :status :response-time ms"
    : "dev";
  app.use(morgan(morganFormat));

  // ── Unversioned Health ────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      service: "Start-X Backend",
    });
  });

  // ── API v1 Routes ─────────────────────────────────────────────────────
  app.use("/api/v1", v1Routes);

  // ── 404 & Error Handling ──────────────────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
