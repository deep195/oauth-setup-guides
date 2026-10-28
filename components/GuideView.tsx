"use client";

import type { Guide, StepOwner, EvidenceLevel } from "@/lib/types";

const DIFFICULTY: Record<Guide["difficulty"], { label: string; cls: string }> = {
  quick: { label: "Quick / self-serve", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  moderate: { label: "Moderate / review required", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  enterprise: { label: "Lengthy / enterprise approval", cls: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300" },
};

const OWNER: Record<StepOwner, { label: string; cls: string }> = {
  agent_found: { label: "Agent found this", cls: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300" },
  agent_can_draft: { label: "Agent can draft this", cls: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300" },
  you_must_do: { label: "You must do this", cls: "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200" },
};

const EVIDENCE: Record<EvidenceLevel, string> = {
  fetched_and_read: "Fetched & read directly",
  search_result_only: "Found via search, not fetched",
  manually_verified: "Manually verified by us",
};

function fmtTime(mins: number | null): string {
  if (mins == null) return "Not specified by sources";
  if (mins < 60) return `${mins} min`;
  const h = Math.round((mins / 60) * 10) / 10;
  return `${h} hr`;
}

function fmtWait(days: number | null): string {
  if (days == null) return "Not specified by sources";
  if (days <= 0) return "No wait — instant";
  if (days < 1) return "Same day";
  if (days <= 2) return `${days} day${days === 1 ? "" : "s"}`;
  if (days <= 13) return `~${days} days`;
  return `~${Math.round(days / 7)} weeks`;
}

export default function GuideView({ guide, shareUrl }: { guide: Guide; shareUrl?: string }) {
  const diff = DIFFICULTY[guide.difficulty];
  return (
    <article className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-3">
        {guide.isLive && (
          <div className="rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 px-3 py-2 text-sm text-indigo-800 dark:text-indigo-300">
            Generated just now by the agent, then self-checked against its own sources. Not human-verified — treat specifics as a strong starting point, not a guarantee.
          </div>
        )}
        {guide.manuallyVerified && (
          <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
            ✓ Manually verified against live provider docs/portal.
            {guide.verificationNotes.length > 0 && (
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {guide.verificationNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">{guide.appName}</h1>
        {guide.website && (
          <a href={guide.website} target="_blank" rel="noreferrer" className="text-sm text-zinc-500 hover:underline">
            {guide.website.replace(/^https?:\/\//, "")}
          </a>
        )}
        <p className="text-zinc-600 dark:text-zinc-400">{guide.summary}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${diff.cls}`}>{diff.label}</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Setup time: {fmtTime(guide.setupTimeMinutes)}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Approval wait: {fmtWait(guide.approvalWaitDays)}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Confidence: {guide.confidence}
          </span>
        </div>

        {shareUrl && (
          <div className="flex items-center gap-2 pt-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1.5 text-zinc-600 dark:text-zinc-300"
              onFocus={(e) => e.currentTarget.select()}
            />
          </div>
        )}
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-2">Before you start</h2>
        <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
          {guide.requirements.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Steps</h2>
        <ol className="space-y-3">
          {guide.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
              <span className="text-xs text-zinc-400 mt-0.5 w-5 shrink-0">{i + 1}.</span>
              <div className="flex-1 space-y-1.5">
                <p className="text-sm text-zinc-800 dark:text-zinc-200">{s.text}</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${OWNER[s.owner].cls}`}>
                  {OWNER[s.owner].label}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {guide.blockers.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Nuances & common blockers</h2>
          <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
            {guide.blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>
      )}

      {guide.uncertainNotes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">What we couldn&apos;t confirm</h2>
          <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-400 text-sm">
            {guide.uncertainNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Evidence</h2>
        <ul className="space-y-1.5">
          {guide.sources.map((s, i) => (
            <li key={i} className="text-sm flex items-center gap-2">
              <a href={s.url} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs">
                {s.title || s.url}
              </a>
              <span className="text-xs text-zinc-400 shrink-0">· {EVIDENCE[s.evidence]}</span>
            </li>
          ))}
          {guide.sources.length === 0 && <li className="text-sm text-zinc-400">No sources were successfully fetched.</li>}
        </ul>
        <p className="text-xs text-zinc-400 mt-3">Generated {new Date(guide.generatedAt).toLocaleString()}</p>
      </section>
    </article>
  );
}
