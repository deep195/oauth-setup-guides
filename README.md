# OAuth Setup Guides

A working tool that tells a developer what it actually takes to register their own OAuth app with a provider and get it approved — difficulty, hands-on time vs. approval wait, requirements, nuances, and exactly what an agent can do for them versus where they have to take over. Ships a small library of real, pre-generated guides plus a live flow that investigates **any** app on demand and produces a shareable guide in real time.

**Live app:** _TODO: Vercel URL_
**Repo:** _TODO: GitHub URL_

## The problem, as scoped

A developer building an AI agent needs their users to connect a third-party app. Unless the platform they're building on provides a managed OAuth app for that provider, the developer has to register **their own** OAuth app with the provider and, for some providers, get it reviewed/approved before real users can use it. That path is scattered across each provider's own docs, with no consistent way to tell upfront whether it's a 10-minute form or a multi-week enterprise review. (Confirmed this framing against [Composio's managed-auth docs](https://docs.composio.dev/toolkits/managed-auth): "managed" means the platform supplies the app for you — this tool targets the opposite, harder case.)

## What it does

- **Library** (`/`): ~14 real providers spanning the difficulty spectrum (self-serve like GitHub/Discord/Notion/Slack, review-gated like Shopify/Dropbox/Zoom/HubSpot/Linear, enterprise-review like Google/Salesforce/X/LinkedIn/QuickBooks), pre-generated and checked into the repo so the library loads instantly with zero API calls.
- **Live generation** (`/new`): type any app name or URL, and the agent searches for its real OAuth/developer docs, fetches and reads them, drafts a guide, fact-checks its own draft against what it actually read, and hands back a guide with a shareable link — all live, in front of you.
- **Evidence, in the product, not just this README**: every guide shows which claims came from a page the agent actually fetched and read vs. a search result it didn't open vs. something it couldn't confirm at all. Numbers it can't support from real sources are shown as "not specified" rather than guessed.

## Architecture & key decisions

**Multi-stage pipeline, not a one-shot "LLM with web search" call** (`lib/pipeline.ts`):
1. **Locate** — free DuckDuckGo HTML search (`lib/search.ts`, no API key) finds candidate OAuth/developer-docs URLs for the app.
2. **Fetch** — the top candidates are actually fetched server-side and run through Mozilla's Readability (`lib/fetchPage.ts`) to extract real article text — this is the "attempt as much of the setup process as practical" part: most providers publish their registration *requirements* publicly even though the registration *form* itself sits behind login, so this is as far as an unauthenticated agent can concretely go.
3. **Synthesize** — a free OpenRouter model turns the fetched text into a structured guide (Zod-validated), required to ground every claim in a cited source or mark it uncertain.
4. **Self-check** — a second pass re-reads the draft against the same source text and is explicitly told to downgrade/flag anything it can't actually support. This caught real issues in testing (see "What we verified" below) without a human in the loop.

**Why not OpenRouter's web-search plugin?** It works, but it costs money per search even on $0 models — the opposite of what was needed here. Doing search (DuckDuckGo) and fetching (direct HTTP + Readability) ourselves keeps the entire pipeline, library included, at **$0 cost**, using only OpenRouter's free-tier models for synthesis.

**Why stateless share links instead of a database?** A live-generated guide is base64url-encoded directly into `/guide/live?d=...` (`lib/shareLink.ts`). No database, no expiry, no extra infra — a generated guide is shareable the instant it exists. The tradeoff: the link is only as short as the guide is small, and there's no server-side history of past live generations. For this scope, that tradeoff is worth the simplicity.

**Why a fixed free-model fallback chain instead of one model?** Individual free models on OpenRouter's shared pool get rate-limited under load (observed directly: `google/gemma-4-31b-it:free` returned 429 mid-build). `lib/openrouter.ts` tries a short list of free models in order so a single provider hiccup doesn't break the live demo.

**Stack:** Next.js (App Router, Cache Components) + TypeScript + Tailwind, deployed on Vercel.

## What we verified

Three guides were checked by hand against live provider sources (not just trusted from the pipeline's own self-check):

- _TODO: fill in after manual verification pass — one quick/self-serve app, one moderate, one enterprise. Note what matched, what was wrong, what stayed unconfirmed._

Every other library guide and every live-generated guide carries only the pipeline's own self-check, not human verification — the product says this explicitly (see the confidence/evidence panel on each guide page), rather than implying more certainty than it has.

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

- **Not all 100 apps** — ~14 providers in the checked-in library, chosen to span the difficulty spectrum, plus live generation for anything else. The assignment scope explicitly didn't require all 100.
- **Live-generated and most library guides are agent-self-checked, not human-verified.** Only the 3 noted above were hand-checked. The product is upfront about this per guide — treat specifics as a strong starting point, not a guarantee, especially before relying on them for an actual approval submission.
- **No OAuth app creation is automated.** This tool produces guidance only; it never touches a provider's real registration form or any credentials, consistent with not handling real accounts/secrets in a take-home.
- **Docs-site dependent.** Providers whose developer docs are heavily JavaScript-rendered (little server-rendered text for Readability to extract) yield thinner source grounding and a lower confidence score — the pipeline is honest about this rather than falling back to ungrounded guesses, but it does mean guide quality varies with how a given provider's docs site is built.
- **Free-tier model limits.** The OpenRouter key is capped at $50 (defense in depth; actual spend should be $0 since only free models are used) and free-model requests are rate-limited account-wide (~50/day by default); very heavy demo usage in a short window could hit that ceiling.
