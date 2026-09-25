import { Request, Response } from "express";

/**
 * Catch-all handler for routes that don't exist.
 * Returns a 404 JSON response.
 */
export function notFoundMiddleware(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: "Not Found",
    error: `Route ${_req.method} ${_req.originalUrl} does not exist`,
  });
}
