/**
 * User roles supported by the Start-X platform.
 */
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  STAFF = "STAFF",
  STUDENT = "STUDENT",
  TEAM_LEADER = "TEAM_LEADER",
  TEAM_MEMBER = "TEAM_MEMBER",
}

/**
 * Authenticated user data attached to Express req.user by the auth middleware.
 * Role is optional because the user_roles table hasn't been created yet.
 */
export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
  fullName: string | null;
  emailConfirmedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
