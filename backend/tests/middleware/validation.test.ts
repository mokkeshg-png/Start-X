import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Auth Validation (Zod)", () => {
  describe("POST /api/v1/auth/signup", () => {
    it("should reject empty body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation Error");
    });

    it("should reject missing email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ password: "password123", fullName: "Test User" });
      expect(res.status).toBe(422);
      expect(res.body.details).toBeDefined();
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "not-an-email", password: "password123", fullName: "Test" });
      expect(res.status).toBe(422);
    });

    it("should reject password shorter than 8 characters", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "test@example.com", password: "short", fullName: "Test" });
      expect(res.status).toBe(422);
    });

    it("should reject password longer than 128 characters", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          email: "test@example.com",
          password: "a".repeat(129),
          fullName: "Test",
        });
      expect(res.status).toBe(422);
    });

    it("should reject missing fullName", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "test@example.com", password: "password123" });
      expect(res.status).toBe(422);
    });

    it("should reject empty fullName", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "test@example.com", password: "password123", fullName: "" });
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should reject empty body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ password: "password123" });
      expect(res.status).toBe(422);
    });

    it("should reject invalid email format", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "bad", password: "password123" });
      expect(res.status).toBe(422);
    });

    it("should reject missing password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com" });
      expect(res.status).toBe(422);
    });

    it("should reject empty password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "" });
      expect(res.status).toBe(422);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should reject empty body", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing refreshToken", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ token: "some-token" });
      expect(res.status).toBe(422);
    });

    it("should reject empty refreshToken", async () => {
      const res = await request(app)
        .post("/api/v1/auth/refresh")
        .send({ refreshToken: "" });
      expect(res.status).toBe(422);
    });
  });
});
