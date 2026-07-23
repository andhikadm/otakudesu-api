export function envInt(name: string, fallback: number, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER): number {
  const raw = process.env[name];

  if (raw === undefined || raw === "") {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}: expected integer between ${min} and ${max}, got "${raw}"`);
  }

  return value;
}

export function parsePublicHttpsOrigin(name: string, raw: string): string {
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid ${name}: expected absolute URL, got "${raw}"`);
  }

  if (parsed.protocol !== "https:") {
    throw new Error(`Invalid ${name}: only https URLs are allowed, got "${parsed.protocol}"`);
  }

  if (!parsed.hostname || isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error(`Invalid ${name}: hostname must be a public host, got "${parsed.hostname}"`);
  }

  return parsed.origin;
}

export function envBaseUrl(name: string, fallback: string): string {
  return parsePublicHttpsOrigin(name, process.env[name] ?? fallback);
}

function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0") {
    return true;
  }

  if (host === "::1" || host === "0:0:0:0:0:0:0:1") {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);

  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);

    if (octets.some((octet) => octet > 255)) {
      return true;
    }

    const [a, b] = octets;

    if (a === 10 || a === 127 || a === 0) {
      return true;
    }

    if (a === 169 && b === 254) {
      return true;
    }

    if (a === 172 && b >= 16 && b <= 31) {
      return true;
    }

    if (a === 192 && b === 168) {
      return true;
    }

    if (a === 100 && b >= 64 && b <= 127) {
      return true;
    }
  }

  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) {
    return true;
  }

  return false;
}
