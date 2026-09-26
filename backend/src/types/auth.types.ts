/**
 * User roles supported by the Start-X platform.
 * These match the Supabase DB user_role_type enum values.
 */
export enum UserRole {
  ADMIN = "admin",
  STAFF = "staff",
  DEPARTMENT_HEAD = "department_head",
  STUDENT = "student",
  // Legacy aliases kept for backward compatibility
  SUPER_ADMIN = "SUPER_ADMIN",
  TEAM_LEADER = "TEAM_LEADER",
  TEAM_MEMBER = "TEAM_MEMBER",
}

/**
 * Authenticated user data attached to Express req.user by the auth middleware.
 * Role comes from Supabase JWT app_metadata.role field.
 */
export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole | string;
  fullName: string | null;
  emailConfirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
