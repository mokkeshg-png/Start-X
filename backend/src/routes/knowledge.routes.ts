import { Router, Request, Response } from "express";

const router = Router();

/**
 * Knowledge routes — not yet implemented.
 */
router.all("*", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Not Implemented",
    error: "Knowledge module is not yet implemented",
  });
});

export default router;
