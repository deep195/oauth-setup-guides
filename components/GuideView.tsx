"use client";

import { useState } from "react";
import type { Guide, StepOwner, EvidenceLevel } from "@/lib/types";
import ProviderLogo from "@/components/ProviderLogo";
import {
  Sparkles,
  BadgeCheck,
  Clock,
  CalendarClock,
  Gauge,
  ListChecks,
  AlertTriangle,
  ExternalLink,
  Bot,
  PenLine,
  User,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Timer,
} from "lucide-react";

const DIFFICULTY: Record<Guide["difficulty"], { label: string; cls: string; icon: typeof Zap }> = {
  quick: { label: "Quick / self-serve", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20", icon: Zap },
  moderate: { label: "Moderate / review required", cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20", icon: Timer },
  enterprise: { label: "Lengthy / enterprise approval", cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20", icon: ShieldCheck },
};

const OWNER: Record<StepOwner, { label: string; cls: string; icon: typeof Bot }> = {
  agent_found: { label: "Agent found this", cls: "bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20", icon: Bot },
  agent_can_draft: { label: "Agent can draft this", cls: "bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20", icon: PenLine },
  you_must_do: { label: "You must do this", cls: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-600/40", icon: User },
};

const EVIDENCE: Record<EvidenceLevel, string> = {
  fetched_and_read: "Fetched & read directly",
  search_result_only: "Found via search, not fetched",
  manually_verified: "Manually verified by us",
};

const CONFIDENCE_PCT: Record<Guide["confidence"], number> = { low: 33, medium: 66, high: 100 };

// Intl.DateTimeFormat with an explicit locale + timeZone so the server render (wherever it runs)
// and the client hydration always produce identical text — `toLocaleString()` without these pins
// to the runtime's own locale/timezone, which differs between server and browser and throws a
// React hydration-mismatch error (#418), observed directly on this page.
const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

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

function ShareLink({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 pt-1">
      <input
        readOnly
        value={shareUrl}
        className="flex-1 text-xs bg-zinc-100 dark:bg-zinc-800 rounded-lg px-3 py-2 text-zinc-600 dark:text-zinc-300"
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            // clipboard unavailable — the input above still lets them select & copy manually
          }
        }}
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-85 transition-opacity"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export default function GuideView({ guide, shareUrl }: { guide: Guide; shareUrl?: string }) {
  const diff = DIFFICULTY[guide.difficulty];
  const DiffIcon = diff.icon;

  return (
    <article className="max-w-3xl mx-auto px-4 py-10 space-y-9">
      <header className="space-y-4 animate-fade-in-up">
        {guide.isLive && (
          <div className="flex items-start gap-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-600/20 dark:ring-indigo-400/20 px-4 py-3 text-sm text-indigo-800 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Generated just now by the agent, then self-checked against its own sources. Not human-verified — treat specifics as a strong starting point, not a guarantee.</span>
          </div>
        )}
        {guide.manuallyVerified && (
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-600/20 dark:ring-emerald-400/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
            <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Manually verified against live provider docs/portal.
              {guide.verificationNotes.length > 0 && (
                <ul className="list-disc list-inside mt-1.5 space-y-1">
                  {guide.verificationNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <ProviderLogo name={guide.appName} website={guide.website} size={44} />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{guide.appName}</h1>
            {guide.website && (
              <a href={guide.website} target="_blank" rel="noreferrer" className="text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {guide.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-snug">{guide.summary}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${diff.cls}`}>
            <DiffIcon className="w-3.5 h-3.5" />
            {diff.label}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Clock className="w-3.5 h-3.5" />
            Setup: {fmtTime(guide.setupTimeMinutes)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <CalendarClock className="w-3.5 h-3.5" />
            Approval: {fmtWait(guide.approvalWaitDays)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <Gauge className="w-3.5 h-3.5" />
            Confidence
            <span className="w-10 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600 overflow-hidden">
              <span
                className="block h-full rounded-full bg-indigo-500"
                style={{ width: `${CONFIDENCE_PCT[guide.confidence]}%` }}
              />
            </span>
          </span>
        </div>

        {shareUrl && <ShareLink shareUrl={shareUrl} />}
      </header>

      <section className="animate-fade-in-up">
        <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
          <ListChecks className="w-5 h-5 text-indigo-500" />
          Before you start
        </h2>
        <ul className="space-y-2">
          {guide.requirements.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="animate-fade-in-up">
        <h2 className="text-lg font-semibold mb-4">Steps</h2>
        <ol className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 dark:before:bg-zinc-800">
          {guide.steps.map((s, i) => {
            const owner = OWNER[s.owner];
            const OwnerIcon = owner.icon;
            return (
              <li key={i} className="relative flex items-start gap-4 pl-0">
                <span className="relative z-10 shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xs font-semibold flex items-center justify-center shadow-sm shadow-indigo-500/30">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[var(--surface)] p-3.5 -mt-0.5">
                  <p className="text-sm text-zinc-800 dark:text-zinc-200">{s.text}</p>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${owner.cls}`}>
                    <OwnerIcon className="w-3 h-3" />
                    {owner.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {guide.blockers.length > 0 && (
        <section className="animate-fade-in-up">
          <h2 className="text-lg font-semibold mb-3">Nuances &amp; common blockers</h2>
          <ul className="space-y-2">
            {guide.blockers.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      {guide.uncertainNotes.length > 0 && (
        <section className="animate-fade-in-up">
          <h2 className="flex items-center gap-2 text-lg font-semibold mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            What we couldn&apos;t confirm
          </h2>
          <ul className="space-y-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-600/20 dark:ring-amber-400/20 p-4">
            {guide.uncertainNotes.map((n, i) => (
              <li key={i} className="flex items-start gap-2.5 text-amber-800 dark:text-amber-300 text-sm">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                {n}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="animate-fade-in-up">
        <h2 className="text-lg font-semibold mb-3">Evidence</h2>
        <ul className="space-y-2">
          {guide.sources.map((s, i) => (
            <li key={i}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-indigo-600 dark:text-indigo-400 truncate flex-1">{s.title || s.url}</span>
                <span className="text-xs text-zinc-400 shrink-0">{EVIDENCE[s.evidence]}</span>
              </a>
            </li>
          ))}
          {guide.sources.length === 0 && <li className="text-sm text-zinc-400">No sources were successfully fetched.</li>}
        </ul>
        <p className="text-xs text-zinc-400 mt-4">Generated {DATE_FMT.format(new Date(guide.generatedAt))} UTC</p>
      </section>
    </article>
  );
}
