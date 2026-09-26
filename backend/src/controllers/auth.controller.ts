import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { usersService } from "../services/users.service";
import { sendSuccess } from "../utils";
import { AppError } from "../utils";

/**
 * Auth controller — delegates to authService and returns standardized responses.
 */
export const authController = {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.signup(req.body);
      sendSuccess(res, result, "Signup successful", 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, "Login successful");
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.logout();
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await authService.refresh(refreshToken);
      sendSuccess(res, result, "Token refreshed");
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   *
   * Returns the full user profile including role, department, skills, etc.
   * The frontend's mapBackendUser() relies on this response shape.
   *
   * If the user's email is not in authorized_emails, returns 403.
   */
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw AppError.unauthorized("Not authenticated");
      }

      // Try to get the full profile from DB
      try {
        const fullProfile = await usersService.getFullProfile(req.user.id);
        sendSuccess(res, fullProfile);
      } catch (profileErr) {
        // If user exists in auth but not yet in public.users table,
        // return a minimal profile so the frontend can still function
        if (profileErr instanceof AppError && profileErr.statusCode === 404) {
          // Provision a minimal response from the JWT data
          const minimal = {
            id: req.user.id,
            email: req.user.email,
            name: req.user.fullName || req.user.email.split("@")[0],
            role: mapAuthRoleToFrontend(String(req.user.role || "")),
            department: "",
            year: "",
            bio: "",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(req.user.email)}`,
            skills: [],
            github: undefined,
            linkedin: undefined,
            studentId: undefined,
            profileComplete: false,
            createdAt: req.user.createdAt || new Date().toISOString(),
          };
          sendSuccess(res, minimal);
        } else {
          throw profileErr;
        }
      }
    } catch (err) {
      next(err);
    }
  },
};

function mapAuthRoleToFrontend(role: string): string {
  switch ((role || "").toUpperCase()) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "ADMIN";
    case "STAFF":
    case "DEPARTMENT_HEAD":
      return "TEACHER";
    case "STUDENT":
    default:
      return "STUDENT";
  }
}
