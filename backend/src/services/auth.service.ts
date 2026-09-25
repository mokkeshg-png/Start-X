import type { User, Session } from "@supabase/supabase-js";
import { supabaseAdmin, supabaseClient } from "../config/supabase";
import { AppError } from "../utils";
import type { SignupInput, LoginInput } from "../validations/auth.validation";

/**
 * Sanitized user data returned to clients.
 * Never contains internal Supabase fields, keys, or secrets.
 */
interface SanitizedUser {
  id: string;
  email: string;
  fullName: string | null;
  emailConfirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sanitized session data returned to clients.
 */
interface SanitizedSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Get a usable Supabase client, throwing 503 if none is configured.
 */
function getClient() {
  const client = supabaseClient ?? supabaseAdmin;
  if (!client) {
    throw new AppError(
      "Supabase is not configured. Set SUPABASE_URL and credentials in .env",
      503
    );
  }
  return client;
}

/**
 * Strip a Supabase User to safe fields only.
 */
function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    email: user.email ?? "",
    fullName: (user.user_metadata?.full_name as string) ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    createdAt: user.created_at,
    updatedAt: user.updated_at ?? user.created_at,
  };
}

/**
 * Strip a Supabase Session to safe fields only.
 */
function sanitizeSession(session: Session): SanitizedSession {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    tokenType: session.token_type ?? "bearer",
    expiresIn: session.expires_in ?? 0,
    expiresAt: session.expires_at ?? 0,
  };
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

/**
 * Authentication service backed by Supabase Auth.
 * No custom password tables — delegates entirely to Supabase.
 */
export const authService = {
  /**
   * Sign up a new user with email and password.
   */
  async signup(input: SignupInput) {
    const client = getClient();

    const { data, error } = await client.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already been registered")) {
        throw AppError.conflict("A user with this email already exists");
      }
      throw AppError.badRequest(error.message);
    }

    if (!data.user) {
      throw AppError.internal("Signup succeeded but no user was returned");
    }

    return {
      user: sanitizeUser(data.user),
      session: data.session ? sanitizeSession(data.session) : null,
    };
  },

  /**
   * Log in with email and password.
   */
  async login(input: LoginInput) {
    const client = getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (error) {
      // Don't leak whether the email exists
      throw AppError.unauthorized("Invalid email or password");
    }

    if (!data.user || !data.session) {
      throw AppError.internal("Login succeeded but session was not created");
    }

    return {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session),
    };
  },

  /**
   * Log out the current user.
   *
   * Supabase JWTs are stateless — the server cannot invalidate individual
   * tokens.  The client should discard the access and refresh tokens.
   */
  async logout(): Promise<{ message: string }> {
    return { message: "Logged out successfully" };
  },

  /**
   * Refresh an expired session using a refresh token.
   */
  async refresh(refreshToken: string) {
    const client = getClient();

    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    if (!data.user || !data.session) {
      throw AppError.internal("Token refresh succeeded but no session was returned");
    }

    return {
      user: sanitizeUser(data.user),
      session: sanitizeSession(data.session),
    };
  },

  /**
   * Get the authenticated user by their access token.
   * Used internally by the auth middleware and the /me endpoint.
   */
  async getMe(accessToken: string) {
    const client = getClient();

    const { data, error } = await client.auth.getUser(accessToken);

    if (error) {
      throw AppError.unauthorized("Invalid or expired access token");
    }

    if (!data.user) {
      throw AppError.unauthorized("User not found");
    }

    return {
      user: sanitizeUser(data.user),
    };
  },
};
