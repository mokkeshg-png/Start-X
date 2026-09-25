import { Router, Request, Response } from "express";

const router = Router();

/**
 * Teams routes — not yet implemented.
 */
router.all("*", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Not Implemented",
    error: "Teams module is not yet implemented",
  });
});

export default router;
