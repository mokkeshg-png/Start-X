import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { validateBody } from "../utils";
import { signupSchema, loginSchema, refreshSchema } from "../validations";
import { requireAuth } from "../middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Apply stricter rate limiting to all auth routes
router.use(authLimiter);

/**
 * POST /api/v1/auth/signup
 * Register a new user via Supabase Auth.
 */
router.post("/signup", validateBody(signupSchema), authController.signup);

/**
 * POST /api/v1/auth/login
 * Authenticate with email and password.
 */
router.post("/login", validateBody(loginSchema), authController.login);

/**
 * POST /api/v1/auth/logout
 * Log out the currently authenticated user.
 */
router.post("/logout", requireAuth, authController.logout);

/**
 * POST /api/v1/auth/refresh
 * Refresh an expired access token.
 */
router.post("/refresh", validateBody(refreshSchema), authController.refresh);

/**
 * GET /api/v1/auth/me
 * Get the currently authenticated user's profile.
 */
router.get("/me", requireAuth, authController.me);

export default router;
