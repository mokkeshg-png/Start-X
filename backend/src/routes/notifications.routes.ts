import { Router, Request, Response } from "express";

const router = Router();

/**
 * Notifications routes — not yet implemented.
 */
router.all("*", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Not Implemented",
    error: "Notifications module is not yet implemented",
  });
});

export default router;
