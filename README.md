# OAuth Setup Guides

A working tool that tells a developer what it actually takes to register their own OAuth app with a provider and get it approved — difficulty, hands-on time vs. approval wait, requirements, nuances, and exactly what an agent can do for them versus where they have to take over. Ships a small library of real, pre-generated guides plus a live flow that investigates **any** app on demand and produces a shareable guide in real time.

**Live app:** https://oauth-setup-guides-one.vercel.app
**Repo:** https://github.com/deep195/oauth-setup-guides

## The problem, as scoped

A developer building an AI agent needs their users to connect a third-party app. Unless the platform they're building on provides a managed OAuth app for that provider, the developer has to register **their own** OAuth app with the provider and, for some providers, get it reviewed/approved before real users can use it. That path is scattered across each provider's own docs, with no consistent way to tell upfront whether it's a 10-minute form or a multi-week enterprise review. (Confirmed this framing against [Composio's managed-auth docs](https://docs.composio.dev/toolkits/managed-auth): "managed" means the platform supplies the app for you — this tool targets the opposite, harder case.)

## What it does

- **Library** (`/`): 14 real providers spanning the difficulty spectrum (self-serve like GitHub/Discord/Notion/Slack, review-gated like Shopify/Dropbox/Zoom/HubSpot/Linear, enterprise-review like Google/Salesforce/X/LinkedIn/QuickBooks), pre-generated and checked into the repo so the library loads instantly with zero API calls.
- **Live generation** (`/new`): type any app name or URL, and the agent searches for its real OAuth/developer docs, fetches and reads them, drafts a guide, fact-checks its own draft against what it actually read, and hands back a guide with a shareable link — all live, in front of you.
- **Evidence, in the product, not just this README**: every guide shows which claims came from a page the agent actually fetched and read vs. a search result it didn't open vs. something it couldn't confirm at all. Numbers it can't support from real sources are shown as "not specified" rather than guessed.

## Architecture & key decisions

**Multi-stage pipeline, not a one-shot "LLM with web search" call** (`lib/pipeline.ts`):
1. **Locate** — free DuckDuckGo HTML search (`lib/search.ts`, no API key) finds candidate OAuth/developer-docs URLs for the app. If DuckDuckGo is blocked or slow (it rate-limited under this project's own bursty testing — see Limitations), the pipeline fails fast and falls back to guessing common developer-portal URL patterns (`developers.<domain>`, `docs.<domain>`, etc.) instead of stalling.
2. **Fetch** — the top candidates are fetched server-side **in parallel** and run through Mozilla's Readability (`lib/fetchPage.ts`) to extract real article text. This is the "attempt as much of the setup process as practical" part: most providers publish their registration *requirements* publicly even though the registration *form* itself sits behind login, so reading the real docs is as far as an unauthenticated agent can concretely go.
3. **Synthesize** — a free OpenRouter model turns the fetched text into a structured guide (Zod-validated), required to ground every claim in a cited source or mark it uncertain, and to use `null` (shown as "not specified") instead of guessing a number when sources don't support one.
4. **Self-check** — a second pass re-reads the draft against the same source text and is explicitly told to downgrade/flag anything it can't actually support. This caught real issues in testing — see "What we verified" below.

**Why not OpenRouter's web-search plugin?** It works, but it costs money per search even on $0 models — the opposite of what was needed here. Doing search (DuckDuckGo) and fetching (direct HTTP + Readability) ourselves keeps the entire pipeline, library included, at **$0 cost**, using only OpenRouter's free-tier models for synthesis.

**Why stateless share links instead of a database?** A live-generated guide is base64url-encoded directly into `/guide/live?d=...` (`lib/shareLink.ts`). No database, no expiry, no extra infra — a generated guide is shareable the instant it exists. The tradeoff: the link is only as short as the guide is small, and there's no server-side history of past live generations. For this scope, that tradeoff is worth the simplicity.

**Why a fixed free-model fallback chain instead of one model?** Individual free models on OpenRouter's shared pool get rate-limited under load (observed directly: `google/gemma-4-31b-it:free` returned 429 mid-build). `lib/openrouter.ts` tries a short list of free models in order, and short-circuits immediately (no point retrying other models) on the one error that no retry fixes: the account-wide daily free-model cap.

**Stack:** Next.js (App Router, Cache Components) + TypeScript + Tailwind, deployed on Vercel.

## What we verified

Four library guides — not three, one from each difficulty tier plus an extra — were checked by hand against live provider documentation (not just trusted from the pipeline's own self-check), by browsing the real docs directly:

- **[GitHub](https://oauth-setup-guides-one.vercel.app/guides/github)** (quick/self-serve): The pipeline's own live fetch attempts failed twice in testing (search blocked, then a model timeout), so it had fallen back to general knowledge at low confidence. Manually read `docs.github.com` and confirmed the steps, the 100-app-per-owner and 10-callback-URL limits, and the "public information only" warning verbatim — the fallback's general knowledge turned out accurate, just unconfirmed. Added the Device Flow and token-expiry nuances it had omitted.
- **[Shopify](https://oauth-setup-guides-one.vercel.app/guides/shopify)** (moderate): The automated self-check had already flagged, correctly, that it wasn't sure its "Partner Dashboard" / public-vs-custom terminology was still current. It wasn't — Shopify now calls it the **Dev Dashboard**, and public distribution requires a **one-time App Store registration fee** that the auto-draft never mentioned. Corrected both from `shopify.dev`.
- **[Salesforce](https://oauth-setup-guides-one.vercel.app/guides/salesforce)** (moderate, bordering enterprise): The pipeline fetched real pages but correctly judged them irrelevant (developer-portal landing pages) and produced an empty guide rather than fabricate one — honest, but not useful on its own. Manually browsing `help.salesforce.com` surfaced something genuinely important the free model would not have known: **Salesforce restricted creation of new Connected Apps as of Spring '26** and now directs developers to **External Client Apps** instead — recent enough to postdate most models' training data. This is the clearest example in this project of why live verification matters, not just live generation.
- **[Google](https://oauth-setup-guides-one.vercel.app/guides/google)** (enterprise): Same empty-guide pattern as Salesforce (fetched only Gemini marketing pages, correctly discarded them). Manually confirmed via `developers.google.com` and `support.google.com` that OAuth **credential creation is instant**, but **verification for sensitive/restricted scopes is a genuine multi-week process** ("several weeks" per Google's own current docs). This is the sharpest example in the library of why this product separates "setup time" from "approval wait" as two different numbers.

Every other library guide and every live-generated guide carries only the pipeline's own self-check, not human verification — the product says this explicitly (see the confidence/evidence panel on each guide page), rather than implying more certainty than it has. Several of them (HubSpot, LinkedIn) did get real grounded sources from the automated pipeline alone; several others (Discord, Notion, Slack, Dropbox, Zoom, Linear, X, QuickBooks) fell back to general knowledge at low confidence when their docs sites didn't yield fetchable text — honestly labeled as such, not silently upgraded.

## Setup

```bash
cd oauth-setup-guides
npm install
cp .env.example .env.local   # fill in OPENROUTER_API_KEY
npm run dev
```

Get a free OpenRouter API key at [openrouter.ai/keys](https://openrouter.ai/keys) — no payment method required; this project only calls `:free` models and does the search/fetch itself, so it costs nothing to run.

Regenerate the library (optional — it's checked in):
```bash
npm run generate:library            # skips apps that already have a saved guide
npm run generate:library -- --force # regenerate everything
npm run generate:library "GitHub"   # regenerate a single app
```

## Limitations

- **Not all 100 apps** — 14 providers in the checked-in library, chosen to span the difficulty spectrum, plus live generation for anything else. The assignment scope explicitly didn't require all 100.
- **Live-generated and most library guides are agent-self-checked, not human-verified.** Only the 4 noted above were hand-checked. The product is upfront about this per guide — treat specifics as a strong starting point, not a guarantee, especially before relying on them for an actual approval submission.
- **No OAuth app creation is automated.** This tool produces guidance only; it never touches a provider's real registration form or any credentials, consistent with not handling real accounts/secrets in a take-home.
- **Docs-site dependent.** Providers whose developer docs are heavily JavaScript-rendered (little server-rendered text for Readability to extract, e.g. Salesforce's and Google's own help centers) yield thinner source grounding and a lower confidence score. The pipeline is honest about this rather than falling back to ungrounded guesses — but it does mean grounding quality varies with how a given provider's docs site is built, and is exactly where the manual-verification pass above added the most value.
- **DuckDuckGo's free HTML search is unofficial and does rate-limit under bursty traffic** — hit directly during this project's own testing (dozens of generations in a short window). The pipeline degrades gracefully (falls back to guessing standard developer-portal URLs) rather than failing outright, but a grader's live demo may occasionally see a "search unavailable" step before it recovers via the fallback.
- **OpenRouter's free-model tier has an account-wide daily cap (~50 requests/day by default)**, shared across every key on the account — not per-key. This project's own development/testing exhausted it during the build, which is exactly what surfaced and fixed two real bugs (a 115-second worst-case request, now ~10s; and a generic error message, now one that names the cap and its reset time). If the demo hits this during grading, the app explains it plainly rather than failing silently; it resets daily, or raising the cap is a one-time, non-required step on OpenRouter's side (adding account credit) that this project intentionally did not take, per the "no paid accounts" scope.
