import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "./response";

/**
 * Creates Express middleware that validates the request body against a Zod schema.
 * Returns 422 with details on validation failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(422).json({
          success: false,
          message: "Validation Error",
          error: "Invalid request body",
          details,
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Creates Express middleware that validates query parameters against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(422).json({
          success: false,
          message: "Validation Error",
          error: "Invalid query parameters",
          details,
        });
        return;
      }
      next(err);
    }
  };
}

/**
 * Creates Express middleware that validates route parameters against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));

        res.status(422).json({
          success: false,
          message: "Validation Error",
          error: "Invalid route parameters",
          details,
        });
        return;
      }
      next(err);
    }
  };
}

// Re-export for convenience
export { sendSuccess, sendError } from "./response";
