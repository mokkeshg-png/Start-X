import { z } from "zod";

/**
 * Signup request body schema.
 */
export const signupSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .max(255, "Email must be at most 255 characters"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  fullName: z
    .string({ required_error: "Full name is required" })
    .min(1, "Full name is required")
    .max(100, "Full name must be at most 100 characters")
    .trim(),
});

/**
 * Login request body schema.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address"),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

/**
 * Refresh token request body schema.
 */
export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
