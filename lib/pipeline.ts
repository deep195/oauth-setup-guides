import { webSearch, type SearchResult } from "./search";
import { fetchPageText, type FetchedPage } from "./fetchPage";
import { chatJson } from "./openrouter";
import { Guide, GuideDraft, type Source } from "./types";

export type ProgressEvent = { stage: string; detail: string };
export type OnProgress = (e: ProgressEvent) => void;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isLikelyUrl(input: string): boolean {
  return /^https?:\/\//.test(input) || /\.[a-z]{2,}(\/|$)/i.test(input);
}

function domainOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Prefer official-looking pages: same registrable domain as the app, or docs/developer subdomains.
function scoreCandidate(url: string, appDomain: string): number {
  const host = domainOf(url);
  let score = 0;
  if (appDomain && (host === appDomain || host.endsWith(`.${appDomain}`))) score += 10;
  if (/(^|\.)docs?\./.test(host) || /(^|\.)developers?\./.test(host)) score += 4;
  if (/oauth|auth|developer|api/i.test(url)) score += 2;
  if (/github\.com/i.test(host)) score += 1; // often has real integration docs
  return score;
}

// Common developer-portal URL conventions, tried directly (no search engine involved) when
// search comes back empty — e.g. DuckDuckGo rate-limiting under bursty traffic, observed
// directly during development. This can't find a specific deep-linked doc page the way search
// can, but it keeps the pipeline grounded in something real instead of falling back to
// ungrounded "general knowledge" every time a search backend hiccups.
function guessDeveloperPortalUrls(domain: string): string[] {
  if (!domain) return [];
  return [
    `https://developers.${domain}`,
    `https://developer.${domain}`,
    `https://docs.${domain}`,
    `https://${domain}/developers`,
    `https://${domain}/developer`,
    `https://${domain}/docs`,
  ];
}

async function locate(
  appName: string,
  websiteHint: string,
  onProgress: OnProgress
): Promise<{ website: string; candidates: string[] }> {
  onProgress({ stage: "locate", detail: `Searching for ${appName}'s OAuth / developer docs...` });

  const queries = [
    `${appName} OAuth app create developer docs`,
    `${appName} API OAuth app approval review requirements`,
    `${appName} developer portal register application`,
  ];

  // Probe with the first query alone. If DuckDuckGo is down/blocked, this tells us within one
  // fast-failing request instead of burning the function's time budget on 3-4 queries that would
  // all fail the same way — go straight to the heuristic fallback instead.
  const firstBatch = await webSearch(queries[0], 8);
  const results: SearchResult[] = [...firstBatch];
  let siteResults: SearchResult[] = [];
  if (firstBatch.length > 0) {
    const [rest, site] = await Promise.all([
      Promise.all(queries.slice(1).map((q) => webSearch(q, 8))).then((r) => r.flat()),
      webSearch(`${appName} official website`, 5),
    ]);
    results.push(...rest);
    siteResults = site;
  }

  // Prefer an apex/marketing domain (not a docs./developer./api. subdomain) for "website".
  const isSubdomainish = (host: string) => /^(docs?|developer|dev|api)\./.test(host);
  const siteGuess =
    siteResults.map((r) => domainOf(r.url)).find((h) => h && !isSubdomainish(h)) ||
    domainOf(results[0]?.url ?? "");
  const appDomain = websiteHint ? domainOf(websiteHint) : siteGuess;

  const uniqueUrls = [...new Map(results.map((r) => [r.url, r])).values()];
  const ranked = uniqueUrls
    .filter((r) => /^https?:\/\//.test(r.url))
    .sort((a, b) => scoreCandidate(b.url, appDomain) - scoreCandidate(a.url, appDomain));

  let candidates = ranked.slice(0, 6).map((r) => r.url);
  if (candidates.length === 0 && appDomain) {
    onProgress({ stage: "locate", detail: "Search unavailable — trying known developer-portal URL patterns..." });
    candidates = guessDeveloperPortalUrls(appDomain);
  }

  return {
    website: websiteHint || (appDomain ? `https://${appDomain}` : ""),
    candidates,
  };
}

async function fetchTopPages(candidates: string[], onProgress: OnProgress): Promise<FetchedPage[]> {
  // Fetched in parallel, capped to 6 candidates — sequential fetches were the main cause of the
  // pipeline occasionally running past a minute (each page had its own multi-second timeout).
  const slice = candidates.slice(0, 6);
  onProgress({
    stage: "fetch",
    detail: slice.length ? `Reading ${slice.length} candidate page(s)...` : "No pages to read.",
  });
  const results = await Promise.all(slice.map((url) => fetchPageText(url)));
  return results.filter((p) => p.ok).slice(0, 4); // enough grounding without blowing up the prompt
}

function buildSynthesisPrompt(appName: string, website: string, pages: FetchedPage[]): string {
  const sourceBlocks = pages
    .map(
      (p, i) =>
        `SOURCE ${i + 1}: ${p.url}\nTITLE: ${p.title}\nCONTENT:\n${p.text}\n`
    )
    .join("\n---\n");

  return `You are helping a software developer who wants to register their OWN OAuth app with "${appName}" (website: ${website || "unknown"}) so their users can authorize it. This is the "bring-your-own OAuth app" path (as opposed to a managed/pre-approved app) — the developer must register the app themselves and may need approval from the provider.

Below are real pages fetched from the web about this provider's OAuth/developer setup. Use ONLY what these sources actually say. Do not invent requirements, timelines, or policies that are not supported by the text below. If something a developer would need to know is not covered by these sources, do not guess a number — omit it or note it as uncertain.

${sourceBlocks || "(No pages could be fetched — base your answer only on general, well-established knowledge of this provider's OAuth setup, and mark confidence as \"low\".)"}

Produce ONLY valid JSON (no markdown fences, no commentary) matching exactly this shape:
{
  "appName": string,
  "website": string,
  "difficulty": "quick" | "moderate" | "enterprise",
  "setupTimeMinutes": number | null,   // hands-on time to fill out the registration; null if sources give no basis for an estimate
  "approvalWaitDays": number | null,   // 0 if sources confirm no review; null if sources don't say (do NOT guess a number)
  "summary": string,                   // 1-2 sentences, plain language
  "requirements": string[],            // concrete things needed before starting (redirect URI, business info, etc.)
  "steps": [{ "text": string, "owner": "agent_found" | "agent_can_draft" | "you_must_do" }],
  "blockers": string[],                // nuances, rate limits, common rejection reasons, review criteria
  "confidence": "low" | "medium" | "high",
  "uncertainNotes": string[],          // anything you were not able to confirm from the sources
  "sources": [{ "url": string, "title": string }]   // only URLs from the SOURCE list above that you actually used
}

Tag each step's "owner":
- "agent_found": information the agent already looked up for the developer (e.g. "redirect URI must use HTTPS").
- "agent_can_draft": something the agent could pre-fill or draft text for (e.g. an app description).
- "you_must_do": requires the developer's own account, business verification, or credentials — the agent cannot do this.`;
}

function buildSelfCheckPrompt(draftJson: string, pages: FetchedPage[]): string {
  const sourceBlocks = pages.map((p, i) => `SOURCE ${i + 1}: ${p.url}\n${p.text}`).join("\n---\n");
  return `You will fact-check a draft OAuth setup guide against the source material it was supposedly built from. Be skeptical: any specific number (minutes, days) or specific policy claim that is NOT directly supported by the sources below should be flagged.

SOURCES:
${sourceBlocks || "(none fetched)"}

DRAFT GUIDE JSON:
${draftJson}

Return ONLY corrected JSON in the exact same shape as the draft. Rules:
- If a claim in the draft is not supported by the sources, move it (or a note about it) into "uncertainNotes" and lower "confidence" accordingly (sources present but claim unsupported -> at most "medium"; no sources at all -> "low").
- If "setupTimeMinutes" or "approvalWaitDays" is not actually supported by the sources, set it to null (never a guessed number) and add a note to "uncertainNotes".
- Do not fabricate new specifics. You may only remove/qualify unsupported claims, not add new ones.
- Keep everything else from the draft unchanged.`;
}

export async function generateGuide(
  input: string,
  onProgress: OnProgress = () => {}
): Promise<Guide> {
  const appName = isLikelyUrl(input) ? domainOf(input).split(".")[0] : input;
  const websiteHint = isLikelyUrl(input) ? (input.startsWith("http") ? input : `https://${input}`) : "";

  const { website, candidates } = await locate(appName, websiteHint, onProgress);
  const pages = await fetchTopPages(candidates, onProgress);

  onProgress({ stage: "synthesize", detail: "Drafting the guide from what was found..." });
  const { data: draftRaw, model: modelUsed } = await chatJson(buildSynthesisPrompt(appName, website, pages));

  onProgress({ stage: "self-check", detail: "Checking claims against sources..." });
  let finalRaw = draftRaw;
  try {
    const { data } = await chatJson(buildSelfCheckPrompt(JSON.stringify(draftRaw), pages));
    finalRaw = data;
  } catch (e) {
    onProgress({ stage: "self-check", detail: `Self-check skipped (${e instanceof Error ? e.message : "error"})` });
  }

  const draft = GuideDraft.parse(finalRaw);

  const fetchedUrls = new Set(pages.map((p) => p.url));
  const sources: Source[] = draft.sources.map((s) => ({
    ...s,
    evidence: fetchedUrls.has(s.url) ? "fetched_and_read" : "search_result_only",
  }));

  const guide: Guide = Guide.parse({
    ...draft,
    appName: draft.appName || appName,
    website: website || draft.website,
    slug: slugify(draft.appName || appName),
    sources,
    manuallyVerified: false,
    verificationNotes: [],
    generatedAt: new Date().toISOString(),
    isLive: true,
  });

  onProgress({ stage: "done", detail: `Guide generated (model: ${modelUsed})` });
  return guide;
}
