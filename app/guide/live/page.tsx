import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { decodeGuide } from "@/lib/shareLink";
import GuideView from "@/components/GuideView";

async function LiveGuide(props: { searchParams: Promise<{ d?: string }> }) {
  const { d } = await props.searchParams;
  const guide = d ? decodeGuide(d) : null;

  if (!guide) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-3">
        <h1 className="text-xl font-semibold">Guide not found</h1>
        <p className="text-zinc-500 text-sm">This link looks broken or incomplete.</p>
        <Link href="/new" className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm">
          Generate a new guide →
        </Link>
      </div>
    );
  }

  const hdrs = await headers();
  const host = hdrs.get("host") ?? "";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const shareUrl = host ? `${proto}://${host}/guide/live?d=${d}` : undefined;

  return <GuideView guide={guide} shareUrl={shareUrl} />;
}

export default function LiveGuidePage(props: { searchParams: Promise<{ d?: string }> }) {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Library
        </Link>
      </div>
      <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center text-zinc-500">Loading guide...</div>}>
        <LiveGuide searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
