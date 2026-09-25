import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Transform empty strings to undefined so optional fields work correctly
 * when .env has KEY= with no value.
 */
const optionalString = z
  .string()
  .optional()
  .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined));

/**
 * Environment variable schema with strict validation.
 * Supabase and JWT variables are optional — the server will start without them
 * but will warn and disable related features.
 */
const envSchema = z.object({
  PORT: z
    .string()
    .default("5000")
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive()),

  FRONTEND_URL: z.string().default("http://localhost:5173"),

  SUPABASE_URL: optionalString,
  SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  JWT_SECRET: optionalString,
  JWT_REFRESH_SECRET: optionalString,

  SUPABASE_STORAGE_BUCKET: optionalString,

  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables.
 * Throws a descriptive error if validation fails.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    const messages = Object.entries(formatted)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => {
        const errors = (value as { _errors: string[] })._errors;
        return `  ${key}: ${errors.join(", ")}`;
      })
      .join("\n");

    console.error("❌ Environment validation failed:\n" + messages);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
