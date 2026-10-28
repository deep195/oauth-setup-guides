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
        <nav className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold text-sm">
              OAuth Setup Guides
            </Link>
            <Link href="/new" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
              Generate new →
            </Link>
          </div>
        </nav>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
