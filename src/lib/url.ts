import { BASE_URL } from "../config.js";

export function absoluteUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) {
    return "";
  }

  return new URL(pathOrUrl, BASE_URL).toString();
}

export function pathFromUrl(pathOrUrl: string | undefined | null): string {
  if (!pathOrUrl) {
    return "/";
  }

  return new URL(pathOrUrl, BASE_URL).pathname;
}

export function slugFromUrl(pathOrUrl: string | undefined | null): string {
  const segments = pathFromUrl(pathOrUrl)
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.at(-1) ?? "";
}

export function pagedPath(basePath: string, page: number): string {
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

  if (page <= 1) {
    return normalizedBasePath;
  }

  return `${normalizedBasePath}page/${page}/`;
}
