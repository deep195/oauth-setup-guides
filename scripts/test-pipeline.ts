import { config } from "dotenv";
config({ path: ".env.local" });
import { generateGuide } from "../lib/pipeline";

const input = process.argv[2];
if (!input) {
  console.error("Usage: tsx scripts/test-pipeline.ts <app name or url>");
  process.exit(1);
}

generateGuide(input, (e) => console.log(`[${e.stage}] ${e.detail}`))
  .then((guide) => {
    console.log("\n=== RESULT ===");
    console.log(JSON.stringify(guide, null, 2));
  })
  .catch((e) => {
    console.error("FAILED:", e);
    process.exit(1);
  });
