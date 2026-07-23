import { Router, type Request, type Response } from "express";
import { SEARCH_QUERY_MAX_LENGTH } from "../config.js";
import { fetchHtml, FetchHtmlError } from "../lib/http.js";
import { logger } from "../lib/logger.js";
import { pagedPath } from "../lib/url.js";
import { parseBatchDetail, parseCompleteDownloads, parseAnimeDetail, parseEpisodeDetail } from "../scrapers/detail.js";
import { parseHome } from "../scrapers/home.js";
import { parseAnimeList, parseGenres, parseListPage, parseSchedule } from "../scrapers/list.js";
import { parseSearch } from "../scrapers/search.js";

export const router = Router();

const endpoints = [
  "GET /health",
  "GET /api/latest",
  "GET /api/search?q=keyword",
  "GET /api/anime/:slug",
  "GET /api/episode/:slug",
  "GET /api/batch/:slug",
  "GET /api/complete-downloads/:slug",
  "GET /api/anime-list",
  "GET /api/schedule",
  "GET /api/ongoing?page=1",
  "GET /api/genres",
  "GET /api/completed?page=1",
];

router.get("/", (_request, response) => {
  response.json({
    ok: true,
    data: {
      name: "otakudesu-api",
      description: "Read-only API wrapper for otakudesu.blog",
      endpoints,
    },
  });
});

router.get("/health", (_request, response) => {
  response.json({ ok: true, data: { status: "up" } });
});

router.get("/api/latest", asyncHandler(async (_request, response) => {
  const html = await fetchHtml("/");
  response.json({ ok: true, data: parseHome(html) });
}));

router.get("/api/search", asyncHandler(async (request, response) => {
  const query = searchQueryFromRequest(request, response);

  if (query === null) {
    return;
  }

  const html = await fetchHtml(`/?s=${encodeURIComponent(query)}&post_type=anime`);
  response.json({ ok: true, data: parseSearch(html), query });
}));

router.get("/api/anime/:slug", asyncHandler(async (request, response) => {
  const slug = slugFromRequest(request, response);

  if (!slug) {
    return;
  }

  const path = `/anime/${slug}/`;
  const html = await fetchHtml(path);
  response.json({ ok: true, data: parseAnimeDetail(html, path) });
}));

router.get("/api/episode/:slug", asyncHandler(async (request, response) => {
  const slug = slugFromRequest(request, response);

  if (!slug) {
    return;
  }

  const path = `/episode/${slug}/`;
  const html = await fetchHtml(path);
  response.json({ ok: true, data: parseEpisodeDetail(html, path) });
}));

router.get("/api/batch/:slug", asyncHandler(async (request, response) => {
  const slug = slugFromRequest(request, response);

  if (!slug) {
    return;
  }

  const path = `/batch/${slug}/`;
  const html = await fetchHtml(path);
  response.json({ ok: true, data: parseBatchDetail(html, path) });
}));

router.get("/api/complete-downloads/:slug", asyncHandler(async (request, response) => {
  const slug = slugFromRequest(request, response);

  if (!slug) {
    return;
  }

  const path = `/lengkap/${slug}/`;
  const html = await fetchHtml(path);
  response.json({ ok: true, data: parseCompleteDownloads(html, path) });
}));

router.get("/api/ongoing", asyncHandler(async (request, response) => {
  const page = pageFromQuery(request, response);

  if (page === null) {
    return;
  }

  const html = await fetchHtml(pagedPath("/ongoing-anime/", page));
  response.json({ ok: true, data: parseListPage(html), page });
}));

router.get("/api/completed", asyncHandler(async (request, response) => {
  const page = pageFromQuery(request, response);

  if (page === null) {
    return;
  }

  const html = await fetchHtml(pagedPath("/complete-anime/", page));
  response.json({ ok: true, data: parseListPage(html), page });
}));

router.get("/api/anime-list", asyncHandler(async (_request, response) => {
  const html = await fetchHtml("/anime-list/");
  response.json({ ok: true, data: parseAnimeList(html) });
}));

router.get("/api/genres", asyncHandler(async (_request, response) => {
  const html = await fetchHtml("/genre-list/");
  response.json({ ok: true, data: parseGenres(html) });
}));

router.get("/api/schedule", asyncHandler(async (_request, response) => {
  const html = await fetchHtml("/jadwal-rilis/");
  response.json({ ok: true, data: parseSchedule(html) });
}));

router.use((_request, response) => {
  response.status(404).json({ ok: false, error: "Endpoint not found" });
});

function asyncHandler(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response) => {
    handler(request, response).catch((error: unknown) => {
      const mapped = mapError(error);

      logger.error("request failed", {
        method: request.method,
        path: request.originalUrl,
        status: mapped.status,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      response.status(mapped.status).json({ ok: false, error: mapped.message });
    });
  };
}

function mapError(error: unknown): { status: number; message: string } {
  if (error instanceof FetchHtmlError) {
    if (error.status === 404) {
      return { status: 404, message: "Resource not found" };
    }

    if (error.status && error.status >= 400 && error.status < 500) {
      return { status: 502, message: "Upstream request rejected" };
    }

    return { status: 502, message: "Upstream unavailable" };
  }

  return { status: 500, message: "Unexpected server error" };
}

function pageFromQuery(request: Request, response: Response): number | null {
  const raw = request.query.page;

  if (raw === undefined) {
    return 1;
  }

  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    response.status(400).json({ ok: false, error: "Invalid page parameter" });
    return null;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < 1) {
    response.status(400).json({ ok: false, error: "Invalid page parameter" });
    return null;
  }

  return value;
}

function searchQueryFromRequest(request: Request, response: Response): string | null {
  const value = request.query.q;

  if (typeof value !== "string") {
    response.status(400).json({ ok: false, error: "Query parameter q is required" });
    return null;
  }

  const query = value.trim();

  if (!query) {
    response.status(400).json({ ok: false, error: "Query parameter q is required" });
    return null;
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    response.status(400).json({
      ok: false,
      error: `Query parameter q must be at most ${SEARCH_QUERY_MAX_LENGTH} characters`,
    });
    return null;
  }

  return query;
}

function slugFromRequest(request: Request, response: Response): string {
  const slug = request.params.slug;

  if (typeof slug !== "string" || !/^[a-z0-9_-]+$/i.test(slug)) {
    response.status(400).json({ ok: false, error: "Invalid slug" });
    return "";
  }

  return slug;
}
