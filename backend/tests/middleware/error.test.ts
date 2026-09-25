import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app";

const app = createApp();

describe("Error Middleware", () => {
  it("should return 404 JSON for completely unknown routes", async () => {
    const res = await request(app).get("/this/does/not/exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body).toHaveProperty("message", "Not Found");
    expect(res.body).toHaveProperty("error");
  });

  it("should return consistent error structure", async () => {
    const res = await request(app).get("/api/v1/nonexistent-route");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(typeof res.body.message).toBe("string");
    expect(res.headers["content-type"]).toMatch(/json/);
  });

  it("should return 501 for unimplemented modules", async () => {
    const res = await request(app).get("/api/v1/teams/list");
    expect(res.status).toBe(501);
    expect(res.body).toEqual({
      success: false,
      message: "Not Implemented",
      error: "Teams module is not yet implemented",
    });
  });

  it("should handle malformed JSON body gracefully", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{ invalid json }");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
