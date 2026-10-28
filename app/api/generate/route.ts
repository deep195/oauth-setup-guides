import { NextRequest } from "next/server";
import { generateGuide } from "@/lib/pipeline";

export const maxDuration = 120;

// Streams newline-delimited JSON progress events, then a final {type:"result"} or
// {type:"error"} line, so the UI can show "Searching for docs...", "Reading...", etc.
// while the pipeline (search -> fetch -> synthesize -> self-check) runs live.
export async function POST(req: NextRequest) {
  const { input } = await req.json();
  if (!input || typeof input !== "string" || !input.trim()) {
    return new Response(JSON.stringify({ error: "Missing app name or URL" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      try {
        const guide = await generateGuide(input.trim(), (e) =>
          send({ type: "progress", stage: e.stage, detail: e.detail })
        );
        send({ type: "result", guide });
      } catch (e) {
        send({ type: "error", message: e instanceof Error ? e.message : "Generation failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
}
