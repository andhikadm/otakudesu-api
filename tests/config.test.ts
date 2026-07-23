import { describe, expect, it } from "vitest";
import { parsePublicHttpsOrigin } from "../src/lib/env.js";

describe("parsePublicHttpsOrigin", () => {
  it("accepts public https origins", () => {
    expect(parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://otakudesu.blog")).toBe("https://otakudesu.blog");
  });

  it("normalizes away path and trailing slash", () => {
    expect(parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://otakudesu.blog/extra/path")).toBe("https://otakudesu.blog");
  });

  it("rejects non-https URLs", () => {
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "http://otakudesu.blog")).toThrow(/only https URLs are allowed/i);
  });

  it("rejects localhost and private hosts", () => {
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://localhost")).toThrow(/public host/i);
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://127.0.0.1")).toThrow(/public host/i);
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://192.168.1.10")).toThrow(/public host/i);
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://10.0.0.5")).toThrow(/public host/i);
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://169.254.169.254")).toThrow(/public host/i);
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "https://172.16.0.1")).toThrow(/public host/i);
  });

  it("rejects invalid absolute URLs", () => {
    expect(() => parsePublicHttpsOrigin("OTAKUDESU_BASE_URL", "not-a-url")).toThrow(/absolute URL/i);
  });
});
