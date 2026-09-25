import { Router, Request, Response } from "express";

const router = Router();

/**
 * Collaboration Gaps routes — not yet implemented.
 */
router.all("*", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Not Implemented",
    error: "Gaps module is not yet implemented",
  });
});

export default router;
