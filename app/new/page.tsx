"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileSearch, Sparkles, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import type { Guide } from "@/lib/types";

type ProgressLine = { stage: string; detail: string };

const STAGE_ICON: Record<string, typeof Search> = {
  locate: Search,
  fetch: FileSearch,
  synthesize: Sparkles,
  "self-check": ShieldCheck,
  done: CheckCircle2,
};

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
    <div className="max-w-2xl mx-auto px-4 py-20">
      <div className="text-center space-y-3 mb-9">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25 mb-1">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Generate a guide</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-base max-w-lg mx-auto">
          Enter an app name or its website. The agent searches for its real OAuth/developer docs,
          reads them, drafts a guide, then fact-checks its own draft against what it read — live, at no cost to you.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Stripe, or https://stripe.com"
            disabled={loading}
            className="w-full rounded-full border border-zinc-300 dark:border-zinc-700 bg-[var(--surface)] pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-60 transition-shadow"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/35 disabled:opacity-50 disabled:shadow-none transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Working
            </>
          ) : (
            <>
              Generate
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <AnimatePresence mode="popLayout">
        {progress.length > 0 && (
          <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-2.5">
            {progress.map((p, i) => {
              const Icon = STAGE_ICON[p.stage] ?? Sparkles;
              const isLast = i === progress.length - 1;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-3 text-sm"
                >
                  <span
                    className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
                      isLast && loading
                        ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                        : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {isLast && loading ? <Icon className="w-3.5 h-3.5 animate-pulse" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </span>
                  <span className={isLast && loading ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-500 dark:text-zinc-500"}>
                    {p.detail}
                  </span>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-600/20 dark:ring-rose-400/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {error}
            {!/quota|resets daily/i.test(error) && " Try again — free-tier models occasionally rate-limit under load."}
          </span>
        </motion.div>
      )}
    </div>
  );
}
