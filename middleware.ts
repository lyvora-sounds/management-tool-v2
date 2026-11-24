import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  createRateLimiter,
  extractClientIp,
  rateLimitHeaders,
} from "./lib/rateLimit";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/functions",
  "/how-it-works",
  "/stats",
  "/privacy",
  "/share/task(.*)",
  "/api/webhooks(.*)",
  // MCP authenticates machine clients with board-scoped bearer credentials.
  "/api/mcp(.*)",
  "/.well-known/oauth-protected-resource(.*)",
  "/.well-known/oauth-authorization-server",
  "/api/integrations/google-calendar/callback(.*)",
  // GitHub redirects the browser here after install and after user authorization.
  // The route still requires the Clerk session before it links an installation.
  "/api/integrations/github/setup(.*)",
]);

const isShareTaskRoute = createRouteMatcher(["/share/task(.*)"]);
const shareTaskLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

export default clerkMiddleware(async (auth, req) => {
  if (isShareTaskRoute(req)) {
    const result = shareTaskLimiter.check(extractClientIp(req.headers));
    if (!result.allowed) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          ...rateLimitHeaders(result),
        },
      });
    }
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // /api/health is skipped on purpose: the container probe must not depend on Clerk (see app/api/health).
    "/((?!_next|api/health$|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api(?!/health$)|trpc)(.*)",
  ],
};
