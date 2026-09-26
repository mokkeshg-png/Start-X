/**
 * Users service — resolves a full user profile from Supabase DB.
 * Used by the /api/v1/auth/me endpoint to return complete user data
 * including role, department, year, skills, etc.
 */

import { getSupabaseAdmin } from "../config/supabase";
import { AppError } from "../utils";

export interface FullUserDto {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  year: string;
  bio: string;
  avatar: string;
  skills: string[];
  github?: string;
  linkedin?: string;
  studentId?: string;
  profileComplete: boolean;
  createdAt: string;
}

export const usersService = {
  /**
   * Get the full user profile for a given Supabase auth user ID.
   * Joins: users → students (if applicable) → student_profiles → skills
   *        users → staff (if applicable)
   *
   * Falls back gracefully if profile rows don't exist yet.
   */
  async getFullProfile(userId: string): Promise<FullUserDto> {
    const db = getSupabaseAdmin();

    // Fetch the user row
    const { data: userRow, error: userErr } = await db
      .from("users")
      .select("user_id, email, full_name, avatar_url, role, created_at, is_active")
      .eq("user_id", userId)
      .maybeSingle();

    if (userErr) throw new AppError(`User lookup failed: ${userErr.message}`, 503);

    if (!userRow) {
      // User exists in auth.users but not yet provisioned in public.users
      // This can happen on the very first login before the trigger runs.
      throw AppError.notFound("User profile not found. Please complete registration.");
    }

    const role = (userRow.role || "student").toUpperCase();
    let department = "";
    let year = "";
    let bio = "";
    let github: string | undefined;
    let linkedin: string | undefined;
    let skills: string[] = [];
    let studentId: string | undefined;
    let profileComplete = false;

    if (role === "STUDENT" || role === "STAFF" || role === "DEPARTMENT_HEAD") {
      // Try to fetch student profile
      if (role === "STUDENT") {
        const { data: stuRow } = await db
          .from("students")
          .select(`
            student_id, student_number, program, year_of_study,
            student_profiles (
              bio, github_url, linkedin_url, availability,
              skills (skill_name)
            )
          `)
          .eq("user_id", userId)
          .maybeSingle();

        if (stuRow) {
          department = stuRow.program || "";
          year = stuRow.year_of_study
            ? `${stuRow.year_of_study}${ordinalSuffix(stuRow.year_of_study)} Year`
            : "";
          studentId = stuRow.student_number || undefined;

          const sp = (stuRow.student_profiles as any)?.[0] || null;
          if (sp) {
            bio = sp.bio || "";
            github = sp.github_url || undefined;
            linkedin = sp.linkedin_url || undefined;
            skills = (sp.skills || []).map((s: any) => s.skill_name as string);
            profileComplete = !!(bio || github || linkedin || skills.length > 0);
          }
        }
      } else {
        // Staff / department_head
        const { data: staffRow } = await db
          .from("staff")
          .select("specialization, title, departments(name)")
          .eq("user_id", userId)
          .maybeSingle();

        if (staffRow) {
          department = (staffRow.departments as any)?.name || "";
        }
        profileComplete = true;
      }
    } else if (role === "ADMIN") {
      profileComplete = true;
    }

    // Map DB role string → frontend role string
    const frontendRole = mapDbRoleToFrontend(role);

    return {
      id: userRow.user_id,
      email: userRow.email,
      name: userRow.full_name || userRow.email.split("@")[0],
      role: frontendRole,
      department,
      year,
      bio,
      avatar:
        userRow.avatar_url ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userRow.full_name || userRow.email)}`,
      skills,
      github,
      linkedin,
      studentId,
      profileComplete,
      createdAt: userRow.created_at,
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ordinalSuffix(n: number): string {
  if (n === 1) return "st";
  if (n === 2) return "nd";
  if (n === 3) return "rd";
  return "th";
}

/**
 * Map Supabase DB role (lowercase enum) → frontend role string (uppercase).
 * Frontend expects: ADMIN | TEACHER | STUDENT
 */
function mapDbRoleToFrontend(dbRole: string): string {
  switch (dbRole.toLowerCase()) {
    case "admin":
      return "ADMIN";
    case "staff":
    case "department_head":
      return "TEACHER";
    case "student":
    default:
      return "STUDENT";
  }
}
