import { Request, Response, NextFunction } from "express";
import { supabaseClient, supabaseAdmin } from "../config/supabase";
import { AuthUser } from "../types";
import { AppError } from "../utils";

/**
 * Middleware: Require authentication via Supabase JWT access token.
 *
 * Extracts the Bearer token from the Authorization header, verifies it
 * against Supabase Auth (server-side verification), and attaches
 * the authenticated user to req.user.
 *
 * Expected header:
 *   Authorization: Bearer <supabase_access_token>
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.trim().length === 0) {
      throw AppError.unauthorized("Token not provided");
    }

    // Use whichever Supabase client is available
    const client = supabaseClient ?? supabaseAdmin;
    if (!client) {
      throw new AppError(
        "Authentication service is not configured",
        503
      );
    }

    // Server-side token verification via Supabase Auth
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      throw AppError.unauthorized("Invalid or expired token");
    }

    // Build the AuthUser from the verified Supabase user.
    // Role comes from app_metadata (set via admin API or DB trigger).
    // It will be undefined until the user_roles table is implemented.
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email ?? "",
      role: (data.user.app_metadata?.role as string) ?? undefined,
      fullName: (data.user.user_metadata?.full_name as string) ?? null,
      emailConfirmedAt: data.user.email_confirmed_at ?? null,
      createdAt: data.user.created_at,
      updatedAt: data.user.updated_at ?? data.user.created_at,
    };

    // Always trust the token-derived user ID, never the request body
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(AppError.unauthorized("Authentication failed"));
  }
}

/**
 * Middleware factory: Require one or more specific roles.
 *
 * Must be used AFTER requireAuth so that req.user is populated.
 *
 * Usage:
 *   router.get("/admin", requireAuth, requireRole(UserRole.SUPER_ADMIN), handler);
 *   router.get("/staff", requireAuth, requireRole(UserRole.STAFF, UserRole.SUPER_ADMIN), handler);
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized("Authentication required"));
      return;
    }

    const userRole = String(req.user.role || "").toLowerCase();
    const normalizedRoles = roles.map((r) => r.toLowerCase());

    if (!userRole || !normalizedRoles.includes(userRole)) {
      next(
        AppError.forbidden(
          `Access denied. Required role(s): ${roles.join(", ")}`
        )
      );
      return;
    }

    next();
  };
}
