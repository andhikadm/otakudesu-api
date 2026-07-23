import { envBaseUrl, envInt } from "./lib/env.js";

export const BASE_URL = envBaseUrl("OTAKUDESU_BASE_URL", "https://otakudesu.blog");
export const PORT = envInt("PORT", 3000, 1, 65535);
export const REQUEST_TIMEOUT_MS = envInt("REQUEST_TIMEOUT_MS", 15_000, 1_000, 120_000);
export const CACHE_TTL_MS = envInt("CACHE_TTL_MS", 5 * 60_000, 0, 60 * 60_000);
export const CACHE_MAX_ENTRIES = envInt("CACHE_MAX_ENTRIES", 500, 1, 100_000);
export const RATE_LIMIT_WINDOW_MS = envInt("RATE_LIMIT_WINDOW_MS", 60_000, 1_000, 60 * 60_000);
export const RATE_LIMIT_MAX = envInt("RATE_LIMIT_MAX", 60, 1, 10_000);
export const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
export const SEARCH_QUERY_MAX_LENGTH = envInt("SEARCH_QUERY_MAX_LENGTH", 100, 1, 500);
