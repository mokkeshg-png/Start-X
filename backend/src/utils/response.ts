import { Response } from "express";
import { ApiSuccessResponse, ApiErrorResponse } from "../types";

/**
 * Send a standardized success response.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  res.status(statusCode).json(response);
}

/**
 * Send a standardized error response.
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  error?: string
): void {
  const response: ApiErrorResponse = {
    success: false,
    message,
    ...(error && { error }),
  };

  res.status(statusCode).json(response);
}
