import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listGuides, getGuide } from "@/lib/guides";
import GuideView from "@/components/GuideView";

export function generateStaticParams() {
  return listGuides().map((g) => ({ slug: g.slug }));
}

async function Guide(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return <GuideView guide={guide} />;
}

export default function GuidePage(props: PageProps<"/guides/[slug]">) {
  return (
    <div>
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Library
        </Link>
      </div>
      <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-16 text-center text-zinc-500">Loading...</div>}>
        <Guide params={props.params} />
      </Suspense>
    </div>
  );
}
