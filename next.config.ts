import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standard server rendering for DB-backed pages. Cache Components / partial
  // prefetching are disabled so Prisma data fetching in Server Components works
  // without extra "use cache" wiring.
  cacheComponents: false,
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
