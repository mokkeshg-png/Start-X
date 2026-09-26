/**
 * Admin service — manages authorized_emails table.
 * Uses service-role client to bypass RLS for admin operations.
 */

import { getSupabaseAdmin } from "../config/supabase";
import { AppError } from "../utils";

export interface AuthorizedEmailDto {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  linkedUserId: string | null;
}

function mapRow(row: Record<string, unknown>): AuthorizedEmailDto {
  return {
    id: row.id as string,
    email: row.email as string,
    role: ((row.role as string) || "student").toUpperCase(),
    status: (row.status as string) || "pending",
    createdAt: (row.created_at as string) || new Date().toISOString(),
    linkedUserId: (row.linked_user_id as string) || null,
  };
}

export const adminService = {
  async listAuthorizedEmails(): Promise<AuthorizedEmailDto[]> {
    const db = getSupabaseAdmin();
    const { data, error } = await db
      .from("authorized_emails")
      .select("id, email, role, status, created_at, linked_user_id")
      .order("created_at", { ascending: false });

    if (error) throw new AppError(`Failed to list authorized emails: ${error.message}`, 500);
    return (data || []).map(mapRow);
  },

  async addAuthorizedEmail(
    email: string,
    role: string,
    addedByUserId?: string
  ): Promise<AuthorizedEmailDto> {
    const db = getSupabaseAdmin();
    const cleanEmail = email.trim().toLowerCase();
    const dbRole = mapFrontendRoleToDb(role);

    // Check duplicate
    const { data: existing } = await db
      .from("authorized_emails")
      .select("id, status")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existing) {
      throw AppError.conflict(`Email ${cleanEmail} is already authorized.`);
    }

    const { data, error } = await db
      .from("authorized_emails")
      .insert({
        email: cleanEmail,
        role: dbRole,
        status: "pending",
        added_by: addedByUserId || null,
      })
      .select("id, email, role, status, created_at, linked_user_id")
      .single();

    if (error) throw new AppError(`Failed to add email: ${error.message}`, 500);
    return mapRow(data as Record<string, unknown>);
  },

  async bulkAddAuthorizedEmails(
    emails: string[],
    role: string,
    addedByUserId?: string
  ): Promise<{ added: number; skipped: number }> {
    const db = getSupabaseAdmin();
    const dbRole = mapFrontendRoleToDb(role);

    // Get existing emails
    const { data: existing } = await db
      .from("authorized_emails")
      .select("email");

    const existingEmails = new Set((existing || []).map((e: any) => e.email as string));

    const toInsert = emails
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && !existingEmails.has(e));

    let added = 0;
    const skipped = emails.length - toInsert.length;

    if (toInsert.length > 0) {
      const rows = toInsert.map((email) => ({
        email,
        role: dbRole,
        status: "pending",
        added_by: addedByUserId || null,
      }));

      const { error } = await db.from("authorized_emails").insert(rows);
      if (error) throw new AppError(`Bulk insert failed: ${error.message}`, 500);
      added = toInsert.length;
    }

    return { added, skipped };
  },

  async removeAuthorizedEmail(id: string): Promise<void> {
    const db = getSupabaseAdmin();
    const { error } = await db
      .from("authorized_emails")
      .delete()
      .eq("id", id);

    if (error) throw new AppError(`Failed to remove email: ${error.message}`, 500);
  },

  /**
   * Check if an email is authorized. Returns null if not found.
   * Used during login/registration to enforce the allow-list.
   */
  async checkEmailAuthorization(email: string): Promise<AuthorizedEmailDto | null> {
    const db = getSupabaseAdmin();
    const { data } = await db
      .from("authorized_emails")
      .select("id, email, role, status, created_at, linked_user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (!data) return null;
    return mapRow(data as Record<string, unknown>);
  },

  /**
   * Mark an authorized email as registered/active after the user signs up.
   * Called automatically after a successful registration.
   */
  async markEmailRegistered(email: string, userId: string): Promise<void> {
    const db = getSupabaseAdmin();
    await db
      .from("authorized_emails")
      .update({ status: "active", linked_user_id: userId })
      .eq("email", email.trim().toLowerCase());
  },
};

function mapFrontendRoleToDb(role: string): string {
  switch ((role || "").toUpperCase()) {
    case "TEACHER":
    case "STAFF":
      return "staff";
    case "ADMIN":
      return "admin";
    case "STUDENT":
    default:
      return "student";
  }
}
