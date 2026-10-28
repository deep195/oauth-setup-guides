// Free web search via DuckDuckGo's HTML endpoint — no API key, no cost.
// Used only to locate a provider's official docs/developer-portal URLs.

export type SearchResult = { url: string; title: string };

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"');
}

async function ddgSearchOnce(query: string, max: number): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];
  const html = await res.text();
  const matches = [
    ...html.matchAll(/result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
  ];
  return matches.slice(0, max).map((m) => ({
    url: m[1],
    title: decodeHtml(m[2].replace(/<[^>]+>/g, "")).trim(),
  }));
}

// DuckDuckGo's HTML endpoint occasionally rate-limits/blocks bursty traffic, or times out outright
// (observed directly during development). A single fast-fail attempt, no retry: on a live request
// budget (Vercel function timeout) a slow retry-with-backoff costs more than it's worth — the
// pipeline degrades gracefully to developer-portal URL guessing either way.
export async function webSearch(query: string, max = 8): Promise<SearchResult[]> {
  try {
    return await ddgSearchOnce(query, max);
  } catch {
    return [];
  }
}
