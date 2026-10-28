import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Guide } from "./types";

const DIR = join(process.cwd(), "data", "guides");

export function listGuides(): Guide[] {
  let files: string[] = [];
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files
    .map((f) => Guide.parse(JSON.parse(readFileSync(join(DIR, f), "utf8"))))
    .sort((a, b) => a.appName.localeCompare(b.appName));
}

export function getGuide(slug: string): Guide | null {
  const match = listGuides().find((g) => g.slug === slug);
  return match ?? null;
}
