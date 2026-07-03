import { describe, expect, it } from "vitest";
import { absoluteUrl, pagedPath, slugFromUrl } from "../src/lib/url.js";

describe("url helpers", () => {
  it("builds absolute URLs", () => {
    expect(absoluteUrl("/anime/example-title/")).toBe("https://otakudesu.blog/anime/example-title/");
  });

  it("extracts the last path segment as slug", () => {
    expect(slugFromUrl("https://otakudesu.blog/anime/example-title/")).toBe("example-title");
  });

  it("builds paged WordPress paths", () => {
    expect(pagedPath("/ongoing-anime/", 1)).toBe("/ongoing-anime/");
    expect(pagedPath("/ongoing-anime/", 3)).toBe("/ongoing-anime/page/3/");
  });
});
