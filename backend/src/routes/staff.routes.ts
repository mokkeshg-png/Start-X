import { Router, Request, Response } from "express";

const router = Router();

/**
 * Staff routes — not yet implemented.
 */
router.all("*", (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: "Not Implemented",
    error: "Staff module is not yet implemented",
  });
});

export default router;
