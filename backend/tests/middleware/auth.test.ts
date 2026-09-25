import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Auth Middleware — requireAuth", () => {
  describe("Missing Authorization", () => {
    it("should return 401 for request with no Authorization header", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("Authorization");
    });

    it("should return 401 for non-Bearer authorization", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Basic dXNlcjpwYXNz");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 for empty Bearer token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer ");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 for Bearer with no token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Invalid Token", () => {
    it("should reject an invalid JWT token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer invalid.jwt.token");
      // 401 if Supabase rejects the token, 503 if Supabase is not configured
      expect([401, 503]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it("should reject a random string token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", "Bearer randomstringnotajwt");
      expect([401, 503]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Protected Endpoints", () => {
    it("POST /api/v1/auth/logout requires authentication", async () => {
      const res = await request(app).post("/api/v1/auth/logout");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe("RBAC — requireRole", () => {
  it("should deny access to unimplemented module routes regardless of auth", async () => {
    // Even with a valid-looking token, module routes return 501
    // because RBAC checks happen after module routing
    const res = await request(app).get("/api/v1/users/profile");
    expect(res.status).toBe(501);
    expect(res.body.success).toBe(false);
  });
});
