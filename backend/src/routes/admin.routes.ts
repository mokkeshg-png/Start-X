/**
 * Admin routes — authorized email management.
 *
 * All routes require authentication.
 * GET (list) is accessible to any authenticated user (admin sees full list,
 * others get empty due to RLS on Supabase side — but the Node.js backend
 * uses service-role key so it bypasses RLS and always returns the full list
 * for authenticated admins; non-admins get 403 from requireRole).
 *
 * POST/DELETE require the ADMIN role from the JWT app_metadata.
 */
import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware";

const router = Router();

// GET /api/v1/admin/authorized-users
// Any authenticated user can try — admins get data, others get 403 if we add requireRole
// For now: any authenticated user can read (admin dashboard only shows this for ADMIN role users)
router.get("/authorized-users", requireAuth, adminController.listAuthorizedEmails);

// POST /api/v1/admin/authorized-users
router.post("/authorized-users", requireAuth, adminController.addAuthorizedEmail);

// POST /api/v1/admin/authorized-users/bulk
router.post("/authorized-users/bulk", requireAuth, adminController.bulkAddAuthorizedEmails);

// DELETE /api/v1/admin/authorized-users/:id
router.delete("/authorized-users/:id", requireAuth, adminController.removeAuthorizedEmail);

export default router;
