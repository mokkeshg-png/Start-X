import rateLimit from "express-rate-limit";

/**
 * General API rate limiter.
 * 200 requests per 15-minute window per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

/**
 * Stricter limiter for authentication endpoints.
 * 20 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
});

/**
 * Very strict limiter for sensitive operations.
 * 5 requests per 15-minute window per IP.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded, please try again later",
  },
});
