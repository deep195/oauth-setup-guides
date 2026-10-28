import type { Guide } from "./types";

// Stateless sharing: the whole guide is base64url-encoded into the URL, so a generated
// guide can be shared with no database. Good enough for this scope; a real product would
// swap this for a persisted record once guides need to be edited/updated after sharing.
export function encodeGuide(guide: Guide): string {
  const json = JSON.stringify(guide);
  return Buffer.from(json, "utf8").toString("base64url");
}

export function decodeGuide(encoded: string): Guide | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    return JSON.parse(json) as Guide;
  } catch {
    return null;
  }
}
