import { Router, Request, Response } from "express";
import { env } from "../config/env";

const router = Router();

/**
 * GET /api/v1/system/info
 * Returns safe, non-secret system information.
 */
router.get("/info", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      service: "Start-X Backend",
      version: "1.0.0",
      environment: env.NODE_ENV,
    },
  });
});

export default router;
