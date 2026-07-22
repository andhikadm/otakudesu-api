import type { NextFunction, Request, Response } from "express";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface HitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimit({ windowMs, max }: RateLimitOptions) {
  const hits = new Map<string, HitEntry>();

  const cleanup = setInterval(() => {
    const now = Date.now();

    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, windowMs);

  cleanup.unref?.();

  return (request: Request, response: Response, next: NextFunction): void => {
    const ip = request.ip || request.socket.remoteAddress || "unknown";
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }

    entry.count += 1;

    response.setHeader("X-RateLimit-Limit", String(max));
    response.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    response.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      response.status(429).json({ ok: false, error: "Too many requests" });
      return;
    }

    next();
  };
}
