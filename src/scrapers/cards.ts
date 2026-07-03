import * as cheerio from "cheerio";
type CheerioSelection = ReturnType<cheerio.CheerioAPI>;
import type { AnimeCard } from "../types.js";
import { cleanText, firstMatch } from "../lib/text.js";
import { absoluteUrl, slugFromUrl } from "../lib/url.js";

const CARD_SELECTORS = ".venz ul li, .venser ul li, .detpost, article, .listupd .bs";

export function parseAnimeCards($: cheerio.CheerioAPI, root: CheerioSelection = $("body")): AnimeCard[] {
  const cards: AnimeCard[] = [];

  root.find(CARD_SELECTORS).each((_, element) => {
    const card = parseAnimeCard($, $(element));

    if (card) {
      cards.push(card);
    }
  });

  return dedupeCards(cards);
}

export function parseAnimeCard($: cheerio.CheerioAPI, element: CheerioSelection): AnimeCard | null {
  const link = element.find("a[href]").first();
  const href = link.attr("href");
  const title = cleanText(
    element.find(".thumbz h2, .thumb h2, .jdlflm, h2, h3, a[title]").first().text()
      || link.attr("title")
      || link.text(),
  );

  if (!href || !title) {
    return null;
  }

  const text = cleanText(element.text());
  const image = element.find("img").first();

  return {
    title,
    slug: slugFromUrl(href),
    url: absoluteUrl(href),
    image_url: absoluteUrl(image.attr("src") || image.attr("data-src") || image.attr("data-lazy-src")) || null,
    episode: cleanText(element.find(".epz, .bt .epx").first().text()) || firstMatch(text, [/Episode\s*([0-9.]+)/i, /(Episode\s*[^\s]+)/i]),
    release_day: cleanText(element.find(".epztipe, .epztipe2").first().text()) || null,
    release_date: cleanText(element.find(".newnime, .epzdate").first().text()) || firstMatch(text, [/(\d{1,2}\s+[A-Za-z]{3,})/i]),
    total_episodes: firstMatch(text, [/([0-9]+\s*Episode)/i]),
    score: firstMatch(text, [/Score\s*:?\s*([0-9.]+)/i, /([0-9]+\.[0-9]+)/]),
    completed_date: cleanText(element.find(".newnime").first().text()) || null,
  };
}

function dedupeCards(cards: AnimeCard[]): AnimeCard[] {
  const seen = new Set<string>();

  return cards.filter((card) => {
    const key = card.url || card.slug;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
