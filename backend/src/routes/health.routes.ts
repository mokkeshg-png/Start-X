import { Router, Request, Response } from "express";
import { testSupabaseConnection } from "../config/supabase";

const router = Router();

/**
 * GET /api/v1/health
 * Versioned health check.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Start-X Backend",
    version: "v1",
  });
});

/**
 * GET /api/v1/database/health
 * Test actual Supabase connection — no fake responses.
 */
router.get("/database/health", async (_req: Request, res: Response) => {
  const connected = await testSupabaseConnection();

  if (connected) {
    res.status(200).json({
      status: "connected",
      database: "supabase",
    });
  } else {
    res.status(503).json({
      status: "disconnected",
      database: "supabase",
    });
  }
});

export default router;
