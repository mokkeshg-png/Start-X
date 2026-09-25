import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * Supabase client for server-side operations.
 * Uses the service role key which has full access — NEVER expose to frontend.
 *
 * Returns null if Supabase credentials are not configured.
 */
let supabaseAdmin: SupabaseClient | null = null;

/**
 * Supabase client using the anon key.
 * Suitable for operations that respect Row Level Security.
 *
 * Returns null if Supabase credentials are not configured.
 */
let supabaseClient: SupabaseClient | null = null;

if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
  supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get the admin Supabase client (service role).
 * Throws if Supabase is not configured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase admin client is not configured. " +
        "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }
  return supabaseAdmin;
}

/**
 * Get the public Supabase client (anon key).
 * Throws if Supabase is not configured.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      "Supabase client is not configured. " +
        "Set SUPABASE_URL and SUPABASE_ANON_KEY in .env"
    );
  }
  return supabaseClient;
}

/**
 * Test the Supabase connection by running a lightweight query.
 * Returns true if connected, false otherwise.
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    if (!supabaseAdmin && !supabaseClient) {
      return false;
    }

    const client = supabaseAdmin ?? supabaseClient;
    if (!client) {
      return false;
    }

    // Use a simple RPC or query to test the connection
    // This will fail if credentials are invalid
    const { error } = await client.from("_health_check_dummy").select("*").limit(0);

    // We expect a "relation does not exist" error — that's fine, it means the connection works.
    // A network/auth error would be different.
    if (error) {
      const msg = error.message.toLowerCase();
      // These errors indicate the connection itself works, the table just doesn't exist
      if (
        msg.includes("does not exist") ||
        msg.includes("relation") ||
        msg.includes("permission denied") ||
        msg.includes("not found")
      ) {
        return true;
      }
      // Check the error code — 42P01 means "undefined table", which is fine
      if (error.code === "42P01") {
        return true;
      }
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export { supabaseAdmin, supabaseClient };
