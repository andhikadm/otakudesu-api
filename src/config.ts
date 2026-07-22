function envInt(name: string, fallback: number, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}: expected integer between ${min} and ${max}, got "${raw}"`);
  }

  return value;
}

export const BASE_URL = process.env.OTAKUDESU_BASE_URL ?? "https://otakudesu.blog";
export const PORT = envInt("PORT", 3000, 1, 65535);
export const REQUEST_TIMEOUT_MS = envInt("REQUEST_TIMEOUT_MS", 15_000, 1_000, 120_000);
export const CACHE_TTL_MS = envInt("CACHE_TTL_MS", 5 * 60_000, 0, 60 * 60_000);
export const RATE_LIMIT_WINDOW_MS = envInt("RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 60 * 60_000);
export const RATE_LIMIT_MAX = envInt("RATE_LIMIT_MAX", 60, 1, 10_000);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
