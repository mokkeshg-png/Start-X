import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
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

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is already populated and verified by requireAuth middleware
      if (!req.user) {
        throw AppError.unauthorized("Not authenticated");
      }
      sendSuccess(res, { user: req.user });
    } catch (err) {
      next(err);
    }
  },
};
