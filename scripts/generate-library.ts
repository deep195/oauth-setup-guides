import { config } from "dotenv";
config({ path: ".env.local" });

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { generateGuide } from "../lib/pipeline";

// Representative providers spanning the difficulty spectrum (see plan for rationale).
const LIBRARY_APPS: { name: string; url: string }[] = [
  { name: "GitHub", url: "https://github.com" },
  { name: "Discord", url: "https://discord.com" },
  { name: "Notion", url: "https://notion.so" },
  { name: "Slack", url: "https://slack.com" },
  { name: "Shopify", url: "https://shopify.com" },
  { name: "Dropbox", url: "https://dropbox.com" },
  { name: "Zoom", url: "https://zoom.us" },
  { name: "HubSpot", url: "https://hubspot.com" },
  { name: "Linear", url: "https://linear.app" },
  { name: "Google", url: "https://google.com" },
  { name: "Salesforce", url: "https://salesforce.com" },
  { name: "X (Twitter)", url: "https://x.com" },
  { name: "LinkedIn", url: "https://linkedin.com" },
  { name: "Intuit QuickBooks", url: "https://quickbooks.intuit.com" },
];

const OUT_DIR = join(__dirname, "..", "data", "guides");
const only = process.argv[2]; // optional: generate a single app by name, for retries

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const app of LIBRARY_APPS) {
    if (only && app.name.toLowerCase() !== only.toLowerCase()) continue;

    const outPath = join(OUT_DIR, `${app.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`);
    if (existsSync(outPath) && !process.argv.includes("--force")) {
      console.log(`SKIP (exists): ${app.name}`);
      continue;
    }

    console.log(`\n=== ${app.name} ===`);
    try {
      const guide = await generateGuide(app.url, (e) => console.log(`  [${e.stage}] ${e.detail}`));
      guide.isLive = false; // this is a library guide, not a freshly-live-generated one
      writeFileSync(outPath, JSON.stringify(guide, null, 2));
      console.log(`  -> saved ${outPath}`);
    } catch (e) {
      console.error(`  FAILED: ${e instanceof Error ? e.message : e}`);
    }
    // Be gentle on the free-model daily request budget and on DuckDuckGo.
    await new Promise((r) => setTimeout(r, 3000));
  }
}

main();
