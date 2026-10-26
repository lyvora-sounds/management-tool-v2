/**
 * Routes already served by kiki-api. Everything not listed here keeps going to this app's own /api routes,
 * so a route moves over by adding one line here and nothing else. A route is matched by method and path
 * because the same path can still be served here for the other methods.
 *
 * `to` gives the kiki-api path (the query string is added by apiFetch). The API uses REST names under /v1, so
 * the app's older action-style paths are mapped one by one.
 */
type Route = { method: string; pattern: RegExp; to: (path: string) => string };

const sameUnderV1 = (path: string) => path.replace(/^\/api\//, "/v1/");
const id = (path: string) => path.slice(path.lastIndexOf("/") + 1);

const MIGRATED: Route[] = [
  // Labels
  { method: "GET", pattern: /^\/api\/labels\/[^/]+$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/labels\/[^/]+$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/labels\/label\/[^/]+$/, to: (p) => `/v1/labels/${id(p)}` },
  { method: "DELETE", pattern: /^\/api\/labels\/label\/[^/]+$/, to: (p) => `/v1/labels/${id(p)}` },

  // Lists
  { method: "POST", pattern: /^\/api\/lists\/createList$/, to: () => "/v1/lists" },
  { method: "PATCH", pattern: /^\/api\/lists\/updateOrder$/, to: () => "/v1/lists/order" },
  { method: "PATCH", pattern: /^\/api\/lists\/updateList\/[^/]+$/, to: (p) => `/v1/lists/${id(p)}` },
  { method: "DELETE", pattern: /^\/api\/lists\/deleteList\/[^/]+$/, to: (p) => `/v1/lists/${id(p)}` },

  // Notifications
  { method: "GET", pattern: /^\/api\/notifications$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/notifications$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/notifications\/[^/]+$/, to: sameUnderV1 },

  // Search
  { method: "GET", pattern: /^\/api\/search$/, to: sameUnderV1 },
];

/** The kiki-api path for a request, or null when this app still serves it. */
export function apiPathFor(method: string, path: string): string | null {
  const route = MIGRATED.find((r) => r.method === method.toUpperCase() && r.pattern.test(path));
  return route ? route.to(path) : null;
}
