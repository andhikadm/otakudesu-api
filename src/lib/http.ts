import { REQUEST_TIMEOUT_MS } from "../config.js";
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

export async function fetchHtml(pathOrUrl: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const url = absoluteUrl(pathOrUrl);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "otakudesu-api/0.1 (+https://otakudesu.blog)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new FetchHtmlError(`Failed to fetch ${url}`, response.status);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof FetchHtmlError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown fetch error";
    throw new FetchHtmlError(`Failed to fetch ${url}: ${message}`);
  } finally {
    clearTimeout(timeout);
  }
}
