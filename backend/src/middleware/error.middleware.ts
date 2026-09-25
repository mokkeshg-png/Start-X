import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils";
import { env } from "../config/env";

/**
 * Global error handling middleware.
 *
 * Catches all errors and returns a consistent JSON error response.
 * Must be registered LAST in the middleware chain.
 */
export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500 Internal Server Error
  let statusCode = 500;
  let message = "Internal Server Error";
  let errorDetail: string | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof SyntaxError && "body" in err) {
    // JSON parse error from express.json()
    statusCode = 400;
    message = "Invalid JSON in request body";
  } else {
    // Unexpected error — log full details but don't expose to client
    console.error("Unhandled error:", err);

    if (env.NODE_ENV === "development") {
      errorDetail = err.message;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetail && { error: errorDetail }),
  });
}
