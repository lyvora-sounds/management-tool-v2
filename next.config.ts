import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { mcpApiRewrites } from "./lib/mcpApiRewrites";
import { buildSecurityHeaders } from "./lib/securityHeaders";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Only the container build asks for the self-contained server; Vercel builds are left as they were.
  ...(process.env.BUILD_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildSecurityHeaders(process.env),
      },
    ];
  },
  // MCP and its OAuth server live in kiki-api; these paths are forwarded to it.
  async rewrites() {
    return { beforeFiles: mcpApiRewrites(process.env), afterFiles: [], fallback: [] };
  },
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
    ],
  },
};

export default withNextIntl(nextConfig);

