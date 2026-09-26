import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/admin.service";
import { sendSuccess } from "../utils";
import { AppError } from "../utils";
import { z } from "zod";

const addEmailSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  role: z.enum(["TEACHER", "STUDENT", "teacher", "student", "staff", "STAFF"]),
});

const bulkAddEmailSchema = z.object({
  emails: z.array(z.string().email()).min(1, "At least one email required"),
  role: z.enum(["TEACHER", "STUDENT", "teacher", "student", "staff", "STAFF"]),
});

export const adminController = {
  async listAuthorizedEmails(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const emails = await adminService.listAuthorizedEmails();
      sendSuccess(res, emails);
    } catch (err) {
      next(err);
    }
  },

  async addAuthorizedEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = addEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest(
          parsed.error.errors.map((e) => e.message).join(", ")
        );
      }

      const result = await adminService.addAuthorizedEmail(
        parsed.data.email,
        parsed.data.role,
        req.user?.id
      );
      sendSuccess(res, result, "Email authorized successfully", 201);
    } catch (err) {
      next(err);
    }
  },

  async bulkAddAuthorizedEmails(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const parsed = bulkAddEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        throw AppError.badRequest(
          parsed.error.errors.map((e) => e.message).join(", ")
        );
      }

      const result = await adminService.bulkAddAuthorizedEmails(
        parsed.data.emails,
        parsed.data.role,
        req.user?.id
      );
      sendSuccess(res, result, `Bulk authorization complete: ${result.added} added, ${result.skipped} skipped`);
    } catch (err) {
      next(err);
    }
  },

  async removeAuthorizedEmail(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) throw AppError.badRequest("Email ID is required");

      await adminService.removeAuthorizedEmail(id);
      sendSuccess(res, { id }, "Authorization revoked");
    } catch (err) {
      next(err);
    }
  },
};
