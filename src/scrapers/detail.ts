import * as cheerio from "cheerio";
import type { CheerioAPI } from "cheerio";
import type {
  AnimeDetail,
  BatchDetail,
  CompleteDownloadEpisode,
  CompleteDownloadsDetail,
  DownloadQuality,
  EpisodeDetail,
  EpisodeListItem,
  LinkItem,
  StreamMirror,
} from "../types.js";
import { cleanText, firstMatch } from "../lib/text.js";
import { absoluteUrl, slugFromUrl } from "../lib/url.js";

type Metadata = Record<string, string>;

export function parseAnimeDetail(html: string, sourceUrl: string): AnimeDetail {
  const $ = cheerio.load(html);
  const metadata = parseInfozingleMetadata($);
  const sections = parseEpisodeSections($);
  const title = metadata.judul || cleanText($("h1").first().text());

  return {
    title,
    slug: slugFromUrl(sourceUrl),
    url: absoluteUrl(sourceUrl),
    image_url: imageUrl($),
    japanese: metadata.japanese ?? null,
    score: metadata.skor ?? metadata.rating ?? null,
    producer: metadata.produser ?? metadata.producer ?? null,
    type: metadata.tipe ?? metadata.type ?? null,
    status: metadata.status ?? null,
    total_episodes: metadata["total episode"] ?? metadata.episodes ?? null,
    duration: metadata.durasi ?? metadata.duration ?? null,
    release_date: metadata["tanggal rilis"] ?? metadata.aired ?? null,
    studio: metadata.studio ?? metadata.studios ?? null,
    genres: parseGenresFromInfo($),
    synopsis: parseSynopsis($),
    batch: sections.batch,
    complete_download: sections.complete,
    episodes: sections.episodes,
  };
}

export function parseEpisodeDetail(html: string, sourceUrl: string): EpisodeDetail {
  const $ = cheerio.load(html);
  const title = cleanText($(".posttl, h1").first().text());
  const episodeSelector = parseEpisodeSelector($);
  const allEpisodes = parseAllEpisodesLink($);

  return {
    title,
    slug: slugFromUrl(sourceUrl),
    url: absoluteUrl(sourceUrl),
    episode: episodeNumber(sourceUrl, title),
    anime: allEpisodes,
    stream_url: absoluteUrl($(".responsive-embed-stream iframe[src]").first().attr("src")) || null,
    mirrors: parseMirrors($),
    downloads: parseDownloadContainer($, $(".download").first()),
    episode_selector: episodeSelector,
    previous_episode: adjacentEpisode(episodeSelector, sourceUrl, "previous"),
    next_episode: adjacentEpisode(episodeSelector, sourceUrl, "next"),
    all_episodes: allEpisodes ? { ...allEpisodes, episode: null, date: null } : null,
  };
}

export function parseBatchDetail(html: string, sourceUrl: string): BatchDetail {
  const $ = cheerio.load(html);

  return {
    title: cleanText($("h1").first().text()),
    slug: slugFromUrl(sourceUrl),
    url: absoluteUrl(sourceUrl),
    anime: animeLinkFromPage($),
    image_url: imageUrl($),
    metadata: parseAnimeInfoMetadata($),
    downloads: parseDownloadContainer($, $(".download2 .batchlink").first()),
  };
}

export function parseCompleteDownloads(html: string, sourceUrl: string): CompleteDownloadsDetail {
  const $ = cheerio.load(html);
  const episodes: CompleteDownloadEpisode[] = [];
  let batch: DownloadQuality[] = [];

  $(".download, .download2 .batchlink").each((_, element) => {
    const container = $(element);
    container.children("h4").each((__, heading) => {
      const title = cleanText($(heading).text());
      const downloads = parseDownloadRows($, $(heading).next("ul").find("li"));

      if (!downloads.length) {
        return;
      }

      if (/batch/i.test(title)) {
        batch = downloads;
        return;
      }

      episodes.push({
        episode: episodeNumber("", title),
        title,
        is_final: /\bend\b/i.test(title),
        downloads,
      });
    });
  });

  return {
    title: cleanText($("h1").first().text()),
    slug: slugFromUrl(sourceUrl),
    url: absoluteUrl(sourceUrl),
    anime: animeLinkFromPage($),
    metadata: parseAnimeInfoMetadata($),
    episodes,
    batch,
  };
}

function parseInfozingleMetadata($: CheerioAPI): Metadata {
  const metadata: Metadata = {};

  $(".infozingle p span").each((_, element) => {
    const label = cleanText($(element).find("b").first().text()).toLowerCase();
    const value = cleanText($(element).clone().find("b").remove().end().text().replace(/^:/, ""));

    if (label && value) {
      metadata[label] = value;
    }
  });

  return metadata;
}

function parseAnimeInfoMetadata($: CheerioAPI): Metadata {
  const metadata: Metadata = {};
  const container = $(".animeinfo .infos, .animeinfo .data").first();

  container.find("b").each((_, element) => {
    const label = cleanText($(element).text()).toLowerCase();
    const parts = $(element).parent().html()?.split(/<br\s*\/?>/i) ?? [];
    const htmlPart = parts.find((part) => cheerio.load(part)("b").first().text().trim().toLowerCase() === label);
    const value = cleanText(cheerio.load(htmlPart ?? "").text().replace(new RegExp(`^${escapeRegExp(label)}\\s*:`, "i"), ""));

    if (label && value) {
      metadata[label] = value;
    }
  });

  return metadata;
}

function parseGenresFromInfo($: CheerioAPI): LinkItem[] {
  const genres: LinkItem[] = [];

  $(".infozingle p span").each((_, element) => {
    const label = cleanText($(element).find("b").first().text()).toLowerCase();

    if (label !== "genre") {
      return;
    }

    $(element).find("a[href]").each((__, linkElement) => {
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

function parseSynopsis($: CheerioAPI): string {
  return cleanText(
    $(".sinopc p")
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter(Boolean)
      .join(" "),
  );
}

function parseEpisodeSections($: CheerioAPI): {
  batch: EpisodeListItem | null;
  complete: EpisodeListItem | null;
  episodes: EpisodeListItem[];
} {
  const episodes: EpisodeListItem[] = [];
  let batch: EpisodeListItem | null = null;
  let complete: EpisodeListItem | null = null;

  $(".episodelist").each((_, section) => {
    const heading = cleanText($(section).find(".monktit").first().text());

    $(section).find("li").each((__, item) => {
      const listItem = parseEpisodeListItem($, $(item));

      if (!listItem) {
        return;
      }

      if (listItem.url.includes("/batch/")) {
        batch = listItem;
        return;
      }

      if (listItem.url.includes("/lengkap/")) {
        complete = listItem;
        return;
      }

      if (listItem.url.includes("/episode/")) {
        episodes.push(listItem);
        return;
      }

      if (/batch/i.test(heading)) {
        batch = listItem;
        return;
      }

      if (/lengkap/i.test(heading)) {
        complete = listItem;
      }
    });
  });

  return { batch, complete, episodes };
}

function parseEpisodeListItem($: CheerioAPI, item: ReturnType<CheerioAPI>): EpisodeListItem | null {
  const link = item.find("a[href]").first();
  const href = link.attr("href");
  const title = cleanText(link.text());

  if (!href || !title) {
    return null;
  }

  return {
    title,
    slug: slugFromUrl(href),
    url: absoluteUrl(href),
    episode: episodeNumber(href, title),
    date: cleanText(item.find(".zeebr").first().text()) || null,
  };
}

function parseEpisodeSelector($: CheerioAPI): EpisodeListItem[] {
  const items: EpisodeListItem[] = [];

  $("#selectcog option[value^='http']").each((_, option) => {
    const optionElement = $(option);
    const href = optionElement.attr("value");
    const title = cleanText(optionElement.text());

    if (href && title) {
      items.push({
        title,
        slug: slugFromUrl(href),
        url: absoluteUrl(href),
        episode: episodeNumber(href, title),
        date: null,
      });
    }
  });

  return items;
}

function parseAllEpisodesLink($: CheerioAPI): LinkItem | null {
  const link = $("a[href*='/anime/']")
    .filter((_, element) => /lihat semua|episode/i.test($(element).text()) || Boolean($(element).attr("href")?.includes("/anime/")))
    .first();
  const href = link.attr("href");
  const title = cleanText(link.text()) || "All Episodes";

  if (!href) {
    return null;
  }

  return { title, slug: slugFromUrl(href), url: absoluteUrl(href) };
}

function parseMirrors($: CheerioAPI): StreamMirror[] {
  const mirrors: StreamMirror[] = [];

  $(".mirrorstream ul").each((_, element) => {
    const group = $(element);
    const quality = firstMatch(group.attr("class") ?? "", [/m([0-9]+p)/i])
      ?? firstMatch(cleanText(group.text()), [/Mirror\s+([0-9]+p)/i])
      ?? "unknown";
    const providers = group.find("li a").map((__, linkElement) => {
      const link = $(linkElement);

      return {
        name: cleanText(link.text()),
        data_content: link.attr("data-content") ?? null,
        is_default: link.attr("data-default") === "true",
      };
    }).get().filter((provider) => provider.name);

    if (providers.length) {
      mirrors.push({ quality, providers });
    }
  });

  return mirrors;
}

function parseDownloadContainer($: CheerioAPI, container: ReturnType<CheerioAPI>): DownloadQuality[] {
  return parseDownloadRows($, container.find("li"));
}

function parseDownloadRows($: CheerioAPI, rows: ReturnType<CheerioAPI>): DownloadQuality[] {
  const downloads: DownloadQuality[] = [];

  rows.each((_, row) => {
    const rowElement = $(row);
    const quality = cleanText(rowElement.find("strong").first().text());

    if (!quality) {
      return;
    }

    const links = rowElement.find("a[href]").map((__, linkElement) => {
      const link = $(linkElement);
      const provider = cleanText(link.text());
      const href = link.attr("href");

      if (!provider || !href || !isDownloadUrl(href)) {
        return null;
      }

      return { provider, url: absoluteUrl(href) };
    }).get().filter((link): link is { provider: string; url: string } => Boolean(link));

    downloads.push({
      quality,
      size: cleanText(rowElement.find("i").first().text()) || null,
      links,
    });
  });

  return downloads;
}

function animeLinkFromPage($: CheerioAPI): LinkItem | null {
  const link = $("a[href*='/anime/']").first();
  const href = link.attr("href");
  const title = cleanText(link.text()) || cleanText($(".animeinfo .infos").first().text()).split(" ").slice(0, 3).join(" ");

  if (!href) {
    return null;
  }

  return { title: title || "Anime", slug: slugFromUrl(href), url: absoluteUrl(href) };
}

function adjacentEpisode(items: EpisodeListItem[], sourceUrl: string, direction: "previous" | "next"): EpisodeListItem | null {
  const currentIndex = items.findIndex((item) => item.slug === slugFromUrl(sourceUrl));

  if (currentIndex === -1) {
    return null;
  }

  const candidate = direction === "previous" ? items[currentIndex + 1] : items[currentIndex - 1];
  return candidate ?? null;
}

function imageUrl($: CheerioAPI): string | null {
  return absoluteUrl($(".wp-post-image, .imganime img, .fotoanime img, img[src*='wp-content/uploads']").first().attr("src")) || null;
}

function episodeNumber(url: string, title: string): number | null {
  const value = firstMatch(`${url} ${title}`, [/episode-(\d+)/i, /Episode\s+(\d+)/i]);
  return value ? Number(value) : null;
}

function isDownloadUrl(url: string): boolean {
  return /link\.desustream\.com|otakudrive|desudrive|mega|acefile|solidfiles|racaty|zippy|letsup|uptobox|desufiles/i.test(url);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
