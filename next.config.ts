import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // jsdom (used by Readability to parse fetched pages) fails to bundle correctly for Vercel's
  // serverless runtime otherwise — a transitive dependency (html-encoding-sniffer -> @exodus/bytes)
  // hits a CJS/ESM interop error under Turbopack's server bundling (observed directly in production;
  // worked fine in local `next dev`, which doesn't bundle server code the same way).
  serverExternalPackages: ["jsdom"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
