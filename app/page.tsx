import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarClock, Clock, Sparkles, Zap, Timer, ShieldCheck } from "lucide-react";
import { listGuides } from "@/lib/guides";
import ProviderLogo from "@/components/ProviderLogo";

const DIFFICULTY: Record<string, { label: string; cls: string; icon: typeof Zap }> = {
  quick: { label: "Quick", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20", icon: Zap },
  moderate: { label: "Moderate", cls: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20", icon: Timer },
  enterprise: { label: "Enterprise", cls: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20", icon: ShieldCheck },
};

export default function HomePage() {
  const guides = listGuides();
  const verifiedCount = guides.filter((g) => g.manuallyVerified).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-14">
      <header className="space-y-6 animate-fade-in-up">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20">
          <Sparkles className="w-3 h-3" />
          Free &amp; live OAuth setup intelligence
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
          Know exactly what it takes to{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            register your OAuth app
          </span>
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl text-lg">
          Before your users can connect an app, you usually need to register your own OAuth app with
          that provider and sometimes get it approved. Here&apos;s what that actually takes, provider by
          provider — difficulty, time, approval wait, and the nuances that trip people up.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/new"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
          >
            Generate a guide for any app
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {verifiedCount} manually verified
            </span>
            <span>·</span>
            <span>$0 to run</span>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-5">
          Library — {guides.length} providers
        </h2>
        {guides.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No guides generated yet. Run <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">npm run generate:library</code>.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {guides.map((g, i) => {
              const diff = DIFFICULTY[g.difficulty];
              const DiffIcon = diff.icon;
              return (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  className="animate-fade-in-up group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-[var(--surface)] p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-zinc-900/5 dark:hover:shadow-black/30 hover:-translate-y-0.5 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <ProviderLogo name={g.appName} website={g.website} />
                      <h3 className="font-medium truncate">{g.appName}</h3>
                    </div>
                    {g.manuallyVerified && (
                      <span title="Manually verified against live docs" className="shrink-0 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${diff.cls}`}>
                    <DiffIcon className="w-3 h-3" />
                    {diff.label}
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {g.setupTimeMinutes == null
                        ? "unspecified"
                        : g.setupTimeMinutes < 60
                          ? `${g.setupTimeMinutes} min`
                          : `${Math.round(g.setupTimeMinutes / 60)}h`}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarClock className="w-3 h-3" />
                      {g.approvalWaitDays == null ? "unspecified" : g.approvalWaitDays > 0 ? `~${g.approvalWaitDays}d` : "instant"}
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
