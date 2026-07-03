import * as cheerio from "cheerio";
import type { AnimeCard, LinkItem, ScheduleGroup } from "../types.js";
import { cleanText } from "../lib/text.js";
import { absoluteUrl, slugFromUrl } from "../lib/url.js";
import { parseAnimeCards } from "./cards.js";

export function parseListPage(html: string): AnimeCard[] {
  const $ = cheerio.load(html);
  return parseAnimeCards($);
}

export function parseAnimeList(html: string): LinkItem[] {
  const $ = cheerio.load(html);
  const items: LinkItem[] = [];

  $(".bariskel a[href], .anime-list a[href], .abtext a[href], .penzbar a[href], .episodelist a[href]").each((_, element) => {
    const link = $(element);
    const title = cleanText(link.text());
    const href = link.attr("href");

    if (title && href) {
      items.push({ title, slug: slugFromUrl(href), url: absoluteUrl(href) });
    }
  });

  return dedupeLinks(items);
}

export function parseGenres(html: string): LinkItem[] {
  const $ = cheerio.load(html);
  const items: LinkItem[] = [];

  $("a[href*='/genres/'], a[href*='/genre/']").each((_, element) => {
    const link = $(element);
    const title = cleanText(link.text());
    const href = link.attr("href");

    if (title && href) {
      items.push({ title, slug: slugFromUrl(href), url: absoluteUrl(href) });
    }
  });

  return dedupeLinks(items);
}

export function parseSchedule(html: string): ScheduleGroup[] {
  const $ = cheerio.load(html);
  const groups: ScheduleGroup[] = [];

  $("h2, h3, h4").each((_, heading) => {
    const day = cleanText($(heading).text());

    if (!day || !/senin|selasa|rabu|kamis|jumat|sabtu|minggu|random/i.test(day)) {
      return;
    }

    const anime: LinkItem[] = [];
    $(heading)
      .nextUntil("h2, h3, h4")
      .find("a[href]")
      .each((__, element) => {
        const link = $(element);
        const title = cleanText(link.text());
        const href = link.attr("href");

        if (title && href) {
          anime.push({ title, slug: slugFromUrl(href), url: absoluteUrl(href) });
        }
      });

    if (anime.length) {
      groups.push({ day, anime: dedupeLinks(anime) });
    }
  });

  if (groups.length) {
    return groups;
  }

  const fallbackAnime = parseAnimeList(html);
  return fallbackAnime.length ? [{ day: "unknown", anime: fallbackAnime }] : [];
}

function dedupeLinks<T extends LinkItem>(items: T[]): T[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = item.url || item.slug;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
