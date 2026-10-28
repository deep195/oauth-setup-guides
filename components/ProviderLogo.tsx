"use client";

import { useState } from "react";

const PALETTE = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function domainOf(website: string): string {
  try {
    return new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export default function ProviderLogo({
  name,
  website,
  size = 36,
}: {
  name: string;
  website?: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const domain = website ? domainOf(website) : "";
  const showImg = domain && !failed;

  return (
    <div
      className={`shrink-0 rounded-lg flex items-center justify-center overflow-hidden ${showImg ? "bg-white border border-zinc-200 dark:border-zinc-700" : `${colorFor(name)} text-white font-semibold`}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://logo.clearbit.com/${domain}?size=128`}
          alt=""
          width={size}
          height={size}
          className="w-full h-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}
