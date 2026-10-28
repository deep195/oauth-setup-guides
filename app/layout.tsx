import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Link from "next/link";
import { KeyRound, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "OAuth Setup Guides",
  description: "Actionable, evidence-checked guides for registering an OAuth app with a provider — library plus live generation for any app.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <nav className="sticky top-0 z-10 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
                <KeyRound className="w-4 h-4" strokeWidth={2.5} />
              </span>
              OAuth Setup Guides
            </Link>
            <Link
              href="/new"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-85 transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate new
            </Link>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
