// OpenRouter chat-completion client, free models only (no paid plugins, no paid models).
// A fallback chain is used because individual free models on shared pools get rate-limited
// upstream (observed: google/gemma-4-31b-it:free returns 429 under load).
const FREE_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3.5-super-vl:free",
  "openrouter/free",
];

function extractJson(content: string): unknown {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in model output");
  return JSON.parse(raw.slice(start, end + 1));
}

// Thrown when OpenRouter's account-wide daily cap on free-model requests is hit. This is a hard
// stop until the daily reset (all free models share one account-level counter, so retrying a
// different model does not help) — the UI shows this message as-is rather than a generic error.
export class DailyFreeLimitError extends Error {
  resetAt?: Date;
  constructor(resetAt?: Date) {
    super(
      "This app's free OpenRouter quota for today is used up (shared across all free models, account-wide). It resets daily — please try again later" +
        (resetAt ? ` (around ${resetAt.toUTCString()}).` : ".")
    );
    this.name = "DailyFreeLimitError";
    this.resetAt = resetAt;
  }
}

function isDailyFreeLimit(err: unknown): Date | undefined {
  const e = err as { code?: number; message?: string; metadata?: { headers?: Record<string, string> } } | undefined;
  if (!e || e.code !== 429 || !/free-models-per-day/i.test(e.message ?? "")) return undefined;
  const resetMs = Number(e.metadata?.headers?.["X-RateLimit-Reset"]);
  return Number.isFinite(resetMs) ? new Date(resetMs) : new Date(0);
}

export async function chatJson(
  prompt: string,
  { temperature = 0.2 }: { temperature?: number } = {}
): Promise<{ data: unknown; model: string }> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  let lastErr: unknown;
  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        const err = json.error ?? json;
        const resetAt = isDailyFreeLimit(err);
        if (resetAt) throw new DailyFreeLimitError(resetAt); // no point trying other models
        lastErr = err;
        continue;
      }
      const content: string = json.choices?.[0]?.message?.content ?? "";
      if (!content) {
        lastErr = new Error(`Empty response from ${model}`);
        continue;
      }
      return { data: extractJson(content), model };
    } catch (e) {
      if (e instanceof DailyFreeLimitError) throw e;
      lastErr = e;
      continue;
    }
  }
  throw new Error(
    `All free models failed. Last error: ${lastErr instanceof Error ? lastErr.message : JSON.stringify(lastErr)}`
  );
}
