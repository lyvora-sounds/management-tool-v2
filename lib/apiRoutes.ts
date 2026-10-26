/**
 * Routes already served by kiki-api. Everything not listed here keeps going to this app's own /api routes,
 * so a route moves over by adding one line here and nothing else. A route is matched by method and path
 * because the same path can still be served here for the other methods.
 */
const MIGRATED: { method: string; pattern: RegExp; to: (path: string) => string }[] = [
  { method: "GET", pattern: /^\/api\/labels\/[^/]+$/, to: (path) => path.replace(/^\/api\//, "/v1/") },
];

/** The kiki-api path for a request, or null when this app still serves it. */
export function apiPathFor(method: string, path: string): string | null {
  const route = MIGRATED.find((r) => r.method === method.toUpperCase() && r.pattern.test(path));
  return route ? route.to(path) : null;
}
