import * as cheerio from "cheerio";
import type { LinkItem, SearchResult } from "../types.js";
import { cleanText } from "../lib/text.js";
import { absoluteUrl, pathFromUrl, slugFromUrl } from "../lib/url.js";

export function parseSearch(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".chivsrc li, li").each((_, element) => {
    const item = $(element);
    const link = item.find("h2 a[href], a[href*='/anime/']").first();
    const href = link.attr("href");
    const title = cleanText(link.text() || link.attr("title"));

    if (!href || !title || !isSearchResultUrl(href)) {
      return;
    }

    results.push({
      title,
      slug: slugFromUrl(href),
      url: absoluteUrl(href),
      type: "anime",
      image_url: absoluteUrl(item.find("img").first().attr("src")) || null,
      genres: parseGenres($, item),
      status: labeledValue($, item, "Status"),
      rating: labeledValue($, item, "Rating"),
    });
  });

  return dedupeResults(results);
}

function isSearchResultUrl(url: string): boolean {
  return pathFromUrl(url).includes("/anime/");
}

function parseGenres($: cheerio.CheerioAPI, item: ReturnType<cheerio.CheerioAPI>): LinkItem[] {
  const genres: LinkItem[] = [];

  item.find(".set").each((_, element) => {
    const set = $(element);
    const label = cleanText(set.find("b").first().text()).toLowerCase();

    if (label !== "genres") {
      return;
    }

    set.find("a[href]").each((__, linkElement) => {
      const link = $(linkElement);
      const href = link.attr("href");
      const title = cleanText(link.text());

      if (href && title) {
        genres.push({ title, slug: slugFromUrl(href), url: absoluteUrl(href) });
      }
    });
  });

  return genres;
}

function labeledValue($: cheerio.CheerioAPI, item: ReturnType<cheerio.CheerioAPI>, label: string): string | null {
  const value = item.find(".set").map((_, element) => {
    const set = $(element);
    const setLabel = cleanText(set.find("b").first().text());

    if (setLabel.toLowerCase() !== label.toLowerCase()) {
      return null;
    }

    return cleanText(set.clone().find("b").remove().end().text().replace(/^\s*:/, ""));
  }).get().find(Boolean);

  return value || null;
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
