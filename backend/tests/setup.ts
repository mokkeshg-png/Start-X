/**
 * Test environment setup.
 *
 * Sets safe default env vars BEFORE any module is imported.
 * dotenv.config() in env.ts will NOT overwrite these because
 * dotenv respects existing process.env values by default.
 */
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.FRONTEND_URL = "http://localhost:5173";

// Supabase and JWT credentials are intentionally left unset.
// Unit tests should work without a live Supabase connection.
// Auth middleware tests will receive 503 (service not configured)
// or 401 (invalid token) depending on the test scenario.
