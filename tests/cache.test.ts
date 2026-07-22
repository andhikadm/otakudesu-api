import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "../src/lib/cache.js";

describe("TtlCache", () => {
  it("stores and returns values within TTL", () => {
    const cache = new TtlCache<string>(60_000);

    cache.set("a", "value");
    expect(cache.get("a")).toBe("value");
  });

  it("expires values after TTL", () => {
    vi.useFakeTimers();
    const cache = new TtlCache<string>(1_000);

    cache.set("a", "value");
    vi.advanceTimersByTime(1_001);

    expect(cache.get("a")).toBeUndefined();
    vi.useRealTimers();
  });

  it("disables itself when TTL is zero", () => {
    const cache = new TtlCache<string>(0);

    cache.set("a", "value");
    expect(cache.get("a")).toBeUndefined();
  });
});
