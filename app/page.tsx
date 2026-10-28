import Link from "next/link";
import { listGuides } from "@/lib/guides";

const DIFFICULTY_LABEL: Record<string, string> = {
  quick: "Quick",
  moderate: "Moderate",
  enterprise: "Enterprise",
};

const DIFFICULTY_CLS: Record<string, string> = {
  quick: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  enterprise: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

export default function HomePage() {
  const guides = listGuides();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">OAuth Setup Guides</h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Before your users can connect an app, you usually need to register your own OAuth app with
          that provider and sometimes get it approved. Here&apos;s what that actually takes, provider by
          provider — difficulty, time, approval wait, and the nuances that trip people up.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Generate a guide for any app →
        </Link>
      </header>

      <section>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide mb-4">
          Library ({guides.length} apps)
        </h2>
        {guides.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No guides generated yet. Run <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">npm run generate:library</code>.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{g.appName}</h3>
                  {g.manuallyVerified && <span className="text-emerald-600 dark:text-emerald-400 text-xs">✓ verified</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_CLS[g.difficulty]}`}>
                    {DIFFICULTY_LABEL[g.difficulty]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  {g.setupTimeMinutes == null
                    ? "setup time unspecified"
                    : g.setupTimeMinutes < 60
                      ? `${g.setupTimeMinutes} min setup`
                      : `${Math.round(g.setupTimeMinutes / 60)}h setup`}
                  {g.approvalWaitDays == null
                    ? " · approval wait unspecified"
                    : g.approvalWaitDays > 0
                      ? ` · ~${g.approvalWaitDays}d approval wait`
                      : " · no approval wait"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
