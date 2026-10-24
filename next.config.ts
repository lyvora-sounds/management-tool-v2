import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Only the container build asks for the self-contained server; Vercel builds are left as they were.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
    ],
  },
};

export default withNextIntl(nextConfig);

