import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
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
