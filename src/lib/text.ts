export function cleanText(value: string | undefined | null): string {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/ /g, " ")
    .trim();
}

export function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return null;
}
