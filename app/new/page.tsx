"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Guide } from "@/lib/types";

type ProgressLine = { stage: string; detail: string };

export default function NewGuidePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setLoading(true);
    setProgress([]);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() }),
        signal: controller.signal,
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as
            | { type: "progress"; stage: string; detail: string }
            | { type: "result"; guide: Guide }
            | { type: "error"; message: string };
          if (evt.type === "progress") {
            setProgress((p) => [...p, { stage: evt.stage, detail: evt.detail }]);
          } else if (evt.type === "result") {
            const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(evt.guide))))
              .replace(/\+/g, "-")
              .replace(/\//g, "_")
              .replace(/=+$/, "");
            router.push(`/guide/live?d=${encoded}`);
            return;
          } else if (evt.type === "error") {
            setError(evt.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight mb-2">Generate a guide</h1>
      <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
        Enter an app name or its website. The agent searches for its real OAuth/developer docs,
        reads them, drafts a guide, then fact-checks its own draft against what it read — live, at no cost to you.
      </p>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Stripe, or https://stripe.com"
          disabled={loading}
          className="flex-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {loading ? "Working..." : "Generate"}
        </button>
      </form>

      {progress.length > 0 && (
        <ul className="mt-6 space-y-1.5 text-sm text-zinc-500">
          {progress.map((p, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {p.detail}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-6 text-sm text-rose-600 dark:text-rose-400">
          {error}
          {!/quota|resets daily/i.test(error) && " Try again — free-tier models occasionally rate-limit under load."}
        </p>
      )}
    </div>
  );
}
