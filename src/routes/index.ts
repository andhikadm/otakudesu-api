import { Router, type Request, type Response } from "express";
import { fetchHtml, FetchHtmlError } from "../lib/http.js";
import { pagedPath } from "../lib/url.js";
import { parseHome } from "../scrapers/home.js";
import { parseAnimeList, parseGenres, parseListPage, parseSchedule } from "../scrapers/list.js";

export const router = Router();

const endpoints = [
  "GET /api/home",
  "GET /api/ongoing?page=1",
  "GET /api/completed?page=1",
  "GET /api/anime-list",
  "GET /api/genres",
  "GET /api/schedule",
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

router.get("/api/home", asyncHandler(async (_request, response) => {
  const html = await fetchHtml("/");
  response.json({ ok: true, data: parseHome(html) });
}));

router.get("/api/ongoing", asyncHandler(async (request, response) => {
  const page = pageFromQuery(request);
  const html = await fetchHtml(pagedPath("/ongoing-anime/", page));
  response.json({ ok: true, data: parseListPage(html), page });
}));

router.get("/api/completed", asyncHandler(async (request, response) => {
  const page = pageFromQuery(request);
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
      const status = error instanceof FetchHtmlError && error.status ? error.status : 500;
      const message = error instanceof Error ? error.message : "Unexpected server error";
      response.status(status).json({ ok: false, error: message });
    });
  };
}

function pageFromQuery(request: Request): number {
  const value = Number(request.query.page ?? 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
}
