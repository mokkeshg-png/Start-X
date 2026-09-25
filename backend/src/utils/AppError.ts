/**
 * Custom application error class for consistent error handling.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Preserve proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** 400 Bad Request */
  static badRequest(message = "Bad Request"): AppError {
    return new AppError(message, 400);
  }

  /** 401 Unauthorized */
  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, 401);
  }

  /** 403 Forbidden */
  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, 403);
  }

  /** 404 Not Found */
  static notFound(message = "Not Found"): AppError {
    return new AppError(message, 404);
  }

  /** 409 Conflict */
  static conflict(message = "Conflict"): AppError {
    return new AppError(message, 409);
  }

  /** 422 Validation Error */
  static validation(message = "Validation Error"): AppError {
    return new AppError(message, 422);
  }

  /** 500 Internal Server Error */
  static internal(message = "Internal Server Error"): AppError {
    return new AppError(message, 500, false);
  }

  /** 501 Not Implemented */
  static notImplemented(message = "Not Implemented"): AppError {
    return new AppError(message, 501);
  }
}
