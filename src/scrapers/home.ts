import * as cheerio from "cheerio";
import type { AnimeCard } from "../types.js";
import { parseAnimeCards } from "./cards.js";

export interface HomeData {
  ongoing_anime: AnimeCard[];
  complete_anime: AnimeCard[];
}

export function parseHome(html: string): HomeData {
  const $ = cheerio.load(html);

  return {
    ongoing_anime: parseSection($, ["On-going Anime", "Ongoing Anime"]),
    complete_anime: parseSection($, ["Complete Anime", "Completed Anime"]),
  };
}

function parseSection($: cheerio.CheerioAPI, titles: string[]): AnimeCard[] {
  for (const title of titles) {
    const heading = $("h1, h2, h3, .releases, .jdlbar")
      .filter((_, element) => $(element).text().toLowerCase().includes(title.toLowerCase()))
      .first();

    if (heading.length) {
      const container = heading.parent().next(".venz, .venser").length
        ? heading.parent().next(".venz, .venser")
        : heading.closest("section, .rapi, .clear, div").find(".venz, .venser").first();
      const cards = parseAnimeCards($, container.length ? container : heading.parent());

      if (cards.length) {
        return cards;
      }
    }
  }

  const allCards = parseAnimeCards($);
  const midpoint = Math.ceil(allCards.length / 2);

  return titles[0]?.toLowerCase().includes("complete") ? allCards.slice(midpoint) : allCards.slice(0, midpoint);
}
