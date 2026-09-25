import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";

const app = createApp();

describe("Health Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return 200 with status ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "ok",
        service: "Start-X Backend",
      });
    });
  });

  describe("GET /api/v1/health", () => {
    it("should return 200 with version", async () => {
      const res = await request(app).get("/api/v1/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: "ok",
        service: "Start-X Backend",
        version: "v1",
      });
    });
  });

  describe("GET /api/v1/database/health", () => {
    it("should return database status object", async () => {
      const res = await request(app).get("/api/v1/database/health");
      expect(res.body.database).toBe("supabase");
      expect(["connected", "disconnected"]).toContain(res.body.status);
    });
  });
});

describe("System Info", () => {
  describe("GET /api/v1/system/info", () => {
    it("should return safe system information", async () => {
      const res = await request(app).get("/api/v1/system/info");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBe("Start-X Backend");
      expect(res.body.data.version).toBe("1.0.0");
      expect(res.body.data.environment).toBeDefined();
    });

    it("should NOT expose secrets", async () => {
      const res = await request(app).get("/api/v1/system/info");
      const body = JSON.stringify(res.body).toLowerCase();
      expect(body).not.toContain("supabase_url");
      expect(body).not.toContain("supabase_key");
      expect(body).not.toContain("jwt_secret");
      expect(body).not.toContain("service_role");
    });
  });
});

describe("Invalid Routes", () => {
  it("should return 404 JSON for non-existent routes", async () => {
    const res = await request(app).get("/api/v1/this-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Not Found");
  });

  it("should return 404 for completely unknown paths", async () => {
    const res = await request(app).get("/totally/unknown/path");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe("Unimplemented Modules (501)", () => {
  const modules = [
    "users", "students", "staff", "teams", "discussions",
    "contributions", "knowledge", "documents", "tasks",
    "insights", "gaps", "collaboration", "notifications",
  ];

  it.each(modules)("GET /api/v1/%s should return 501", async (mod) => {
    const res = await request(app).get(`/api/v1/${mod}/anything`);
    expect(res.status).toBe(501);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Not Implemented");
  });
});
