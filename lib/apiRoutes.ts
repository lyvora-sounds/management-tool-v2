/**
 * Routes already served by kiki-api. Everything not listed here keeps going to this app's own /api routes,
 * so a route moves over by adding one line here and nothing else. A route is matched by method and path
 * because the same path can still be served here for the other methods.
 *
 * `to` gives the kiki-api path (the query string is added by apiFetch). The API uses REST names under /v1, so
 * the app's older action-style paths are mapped one by one.
 */
/** `public` routes need no session: a signed-out visitor (the page behind an invitation link) still reaches kiki-api. */
type Route = { method: string; pattern: RegExp; to: (path: string) => string; public?: true };

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

  // Boards
  { method: "GET", pattern: /^\/api\/boards\/getBoards$/, to: () => "/v1/boards" },
  { method: "POST", pattern: /^\/api\/boards\/createBoard$/, to: () => "/v1/boards" },
  { method: "PATCH", pattern: /^\/api\/boards\/updateBoard\/[^/]+$/, to: (p) => `/v1/boards/${id(p)}` },
  { method: "DELETE", pattern: /^\/api\/boards\/deleteBoard\/[^/]+$/, to: (p) => `/v1/boards/${id(p)}` },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/activity$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/links$/, to: sameUnderV1 },
  { method: "PUT", pattern: /^\/api\/boards\/[^/]+\/links$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/permissions$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/organization$/, to: sameUnderV1 },

  // Board access, archive, epics and integrations
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/access$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/access$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/archive$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/boards\/[^/]+\/archive$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/archive$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/epics$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/boards\/[^/]+\/epics$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/epics$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/boards\/[^/]+\/epics$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/integrations$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/integrations$/, to: sameUnderV1 },

  // Board members, invitations and external access
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/invitations$/, to: (p) => p.replace(/^\/api\/boards\/([^/]+)\/invitations$/, "/v1/boards/$1/members") },
  { method: "POST", pattern: /^\/api\/boards\/[^/]+\/invitations$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/boards\/[^/]+\/invitations\/[^/]+$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/boards\/[^/]+\/members\/[^/]+$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/boards\/[^/]+\/members\/[^/]+$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/external-access$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/boards\/[^/]+\/external-access$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/boards\/[^/]+\/external-access\/[^/]+$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/organizations\/[^/]+\/external-access$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/organizations\/[^/]+\/external-access$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/organizations\/[^/]+\/external-access\/[^/]+$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/invite\/[^/]+$/, to: (p) => `/v1/invitations/${id(p)}`, public: true },
  { method: "POST", pattern: /^\/api\/invite\/[^/]+$/, to: (p) => `/v1/invitations/${id(p)}/accept` },

  // Organizations, their members and teams (the GitHub routes under an organization are still served here)
  { method: "GET", pattern: /^\/api\/organizations$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/organizations$/, to: sameUnderV1 },
  ...["GET", "POST", "PATCH", "DELETE"].map((method) => ({ method, pattern: /^\/api\/organizations\/[^/]+\/members$/, to: sameUnderV1 })),
  { method: "GET", pattern: /^\/api\/organizations\/[^/]+\/available-members$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/organizations\/[^/]+\/teams$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/organizations\/[^/]+\/teams$/, to: sameUnderV1 },
  ...["POST", "DELETE"].flatMap((method) => [
    { method, pattern: /^\/api\/organizations\/[^/]+\/teams\/[^/]+\/members$/, to: sameUnderV1 },
    { method, pattern: /^\/api\/organizations\/[^/]+\/teams\/[^/]+\/boards$/, to: sameUnderV1 },
  ]),

  // Tickets. Creating a ticket, the batch endpoint, comments (POST), attachments and the agent routes are still served here.
  { method: "PATCH", pattern: /^\/api\/tasks\/updateTask\/[^/]+$/, to: (p) => `/v1/tasks/${id(p)}` },
  { method: "PATCH", pattern: /^\/api\/tasks\/updateOrder$/, to: () => "/v1/tasks/order" },
  { method: "DELETE", pattern: /^\/api\/tasks\/deleteTask\/[^/]+$/, to: (p) => `/v1/tasks/${id(p)}` },
  { method: "GET", pattern: /^\/api\/boards\/[^/]+\/tasks$/, to: sameUnderV1 },
  ...["labels", "assignee", "qa", "collaborators"].map((part) => ({ method: "POST", pattern: new RegExp(`^/api/tasks/[^/]+/${part}$`), to: sameUnderV1 })),
  { method: "GET", pattern: /^\/api\/tasks\/[^/]+\/subtasks$/, to: sameUnderV1 },
  { method: "POST", pattern: /^\/api\/tasks\/[^/]+\/subtasks$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/tasks\/[^/]+\/subtasks\/[^/]+$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/tasks\/[^/]+\/subtasks\/[^/]+$/, to: sameUnderV1 },
  { method: "GET", pattern: /^\/api\/tasks\/[^/]+\/custom-values$/, to: sameUnderV1 },
  { method: "PATCH", pattern: /^\/api\/tasks\/[^/]+\/custom-values$/, to: sameUnderV1 },
  ...["GET", "POST", "DELETE"].map((method) => ({ method, pattern: /^\/api\/tasks\/[^/]+\/share$/, to: sameUnderV1 })),
  { method: "GET", pattern: /^\/api\/tasks\/[^/]+\/comments$/, to: sameUnderV1 },
  { method: "DELETE", pattern: /^\/api\/tasks\/[^/]+\/comments\/[^/]+$/, to: sameUnderV1 },

  // Onboarding
  { method: "PATCH", pattern: /^\/api\/onboarding$/, to: sameUnderV1 },
];

/** The kiki-api path for a request, or null when this app still serves it. */
export function apiPathFor(method: string, path: string): string | null {
  const route = MIGRATED.find((r) => r.method === method.toUpperCase() && r.pattern.test(path));
  return route ? route.to(path) : null;
}

/** Whether kiki-api serves this route to someone who is not signed in. */
export function isPublicRoute(method: string, path: string): boolean {
  return MIGRATED.some((r) => r.public && r.method === method.toUpperCase() && r.pattern.test(path));
}
