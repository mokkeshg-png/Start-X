import { AuthUser } from "./auth.types";

/**
 * Extend Express Request to include the authenticated user.
 */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
