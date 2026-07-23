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

  it("evicts least-recently-used entries when max size is exceeded", () => {
    const cache = new TtlCache<string>(60_000, 2);

    cache.set("a", "1");
    cache.set("b", "2");
    cache.get("a"); // touch a so b becomes the oldest
    cache.set("c", "3");

    expect(cache.get("a")).toBe("1");
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe("3");
    expect(cache.size).toBe(2);
  });

  it("refreshes existing keys without growing past max size", () => {
    const cache = new TtlCache<string>(60_000, 2);

    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("a", "1-updated");

    expect(cache.size).toBe(2);
    expect(cache.get("a")).toBe("1-updated");
    expect(cache.get("b")).toBe("2");
  });
});
