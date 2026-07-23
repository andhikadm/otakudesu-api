import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, REQUEST_TIMEOUT_MS } from "../config.js";
import { TtlCache } from "./cache.js";
import { absoluteUrl } from "./url.js";

export class FetchHtmlError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "FetchHtmlError";
  }
}

const htmlCache = new TtlCache<string>(CACHE_TTL_MS, CACHE_MAX_ENTRIES);
const inFlight = new Map<string, Promise<string>>();

export async function fetchHtml(pathOrUrl: string): Promise<string> {
  const url = absoluteUrl(pathOrUrl);
  const cached = htmlCache.get(url);

  if (cached !== undefined) {
    return cached;
  }

  const pending = inFlight.get(url);

  if (pending) {
    return pending;
  }

  const request = loadHtml(url)
    .then((html) => {
      htmlCache.set(url, html);
      return html;
    })
    .finally(() => {
      inFlight.delete(url);
    });

  inFlight.set(url, request);
  return request;
}

export function clearHtmlCache(): void {
  htmlCache.clear();
}

async function loadHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "otakudesu-api/0.1 (+https://otakudesu.blog)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FetchHtmlError(`Upstream returned ${response.status}`, response.status);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof FetchHtmlError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new FetchHtmlError(`Failed to fetch upstream: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}
