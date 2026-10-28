import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export type FetchedPage = {
  url: string;
  title: string;
  text: string;
  ok: boolean;
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Fetches a real page and extracts its readable text (free — direct HTTP + local parsing,
// no third-party scraping API). This is what lets the pipeline ground a guide in content it
// actually read, instead of a search snippet.
export async function fetchPageText(url: string, maxChars = 6000): Promise<FetchedPage> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return { url, title: "", text: "", ok: false };
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) return { url, title: "", text: "", ok: false };
    const html = await res.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const text = (article?.textContent || "").replace(/\s+\n/g, "\n").replace(/[ \t]+/g, " ").trim();
    if (!text || text.length < 100) return { url, title: article?.title || "", text: "", ok: false };
    return { url, title: article?.title || "", text: text.slice(0, maxChars), ok: true };
  } catch {
    return { url, title: "", text: "", ok: false };
  }
}
