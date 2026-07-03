import * as cheerio from "cheerio";
import type { SearchResult } from "../types.js";
import { cleanText, firstMatch } from "../lib/text.js";
import { absoluteUrl, pathFromUrl, slugFromUrl } from "../lib/url.js";

export function parseSearch(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $("li").each((_, element) => {
    const item = $(element);
    const link = item.find("a[href]").first();
    const href = link.attr("href");
    const title = cleanText(link.text() || link.attr("title"));

    if (!href || !title || !isSearchResultUrl(href)) {
      return;
    }

    const text = cleanText(item.text());

    results.push({
      title,
      slug: slugFromUrl(href),
      url: absoluteUrl(href),
      type: resultType(href),
      episode: episodeNumber(href, title),
      status: firstMatch(text, [/Status\s*:?\s*([^|]+?)(?:\s+Rating|$)/i]),
      rating: firstMatch(text, [/Rating\s*:?\s*([0-9.]+)/i]),
    });
  });

  return dedupeResults(results);
}

function isSearchResultUrl(url: string): boolean {
  const path = pathFromUrl(url);
  return path.includes("/anime/") || path.includes("/episode/");
}

function resultType(url: string): SearchResult["type"] {
  const path = pathFromUrl(url);

  if (path.includes("/anime/")) {
    return "anime";
  }

  if (path.includes("/episode/")) {
    return "episode";
  }

  return "unknown";
}

function episodeNumber(url: string, title: string): number | null {
  const value = firstMatch(`${url} ${title}`, [/episode-(\d+)/i, /Episode\s+(\d+)/i]);
  return value ? Number(value) : null;
}

function dedupeResults(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    if (seen.has(result.url)) {
      return false;
    }

    seen.add(result.url);
    return true;
  });
}
