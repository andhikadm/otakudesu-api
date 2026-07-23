import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import * as http from "../src/lib/http.js";

async function request(path: string, init?: RequestInit) {
  const app = createApp();
  const server = app.listen(0);

  try {
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Failed to bind test server");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, init);
    const body = await response.json();

    return { status: response.status, body, headers: response.headers };
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  http.clearHtmlCache();
});

describe("routes", () => {
  it("returns health status", async () => {
    const result = await request("/health");

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ ok: true, data: { status: "up" } });
  });

  it("rejects invalid slug", async () => {
    const result = await request("/api/anime/bad slug!");

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "Invalid slug" });
  });

  it("maps upstream 404 to resource not found", async () => {
    vi.spyOn(http, "fetchHtml").mockRejectedValue(new http.FetchHtmlError("missing", 404));

    const result = await request("/api/anime/missing-title");

    expect(result.status).toBe(404);
    expect(result.body).toEqual({ ok: false, error: "Resource not found" });
  });

  it("maps upstream failures to generic 502", async () => {
    vi.spyOn(http, "fetchHtml").mockRejectedValue(new http.FetchHtmlError("timeout"));

    const result = await request("/api/latest");

    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: "Upstream unavailable" });
  });

  it("returns security headers", async () => {
    const result = await request("/health");

    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
    expect(result.headers.get("access-control-allow-origin")).toBe("*");
    expect(result.headers.get("x-powered-by")).toBeNull();
  });

  it("rejects missing search query", async () => {
    const result = await request("/api/search");

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "Query parameter q is required" });
  });

  it("rejects search query that exceeds max length", async () => {
    const query = "a".repeat(101);
    const result = await request(`/api/search?q=${query}`);

    expect(result.status).toBe(400);
    expect(result.body).toEqual({
      ok: false,
      error: "Query parameter q must be at most 100 characters",
    });
  });

  it("rejects invalid page parameter", async () => {
    const result = await request("/api/ongoing?page=abc");

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "Invalid page parameter" });
  });

  it("rejects non-positive page parameter", async () => {
    const result = await request("/api/completed?page=0");

    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "Invalid page parameter" });
  });
});
