import type { components, paths } from "./schema";

/** Schemas that kiki-api publishes, by name. */
export type ApiSchemas = components["schemas"];
export type ApiLabel = ApiSchemas["Label"];
export type ApiError = ApiSchemas["Error"];
export type ApiBoard = ApiSchemas["Board"];
export type ApiBoardLink = ApiSchemas["BoardLink"];
/**
 * Ticket link on an activity row. Defined locally until staging OpenAPI
 * publishes `ActivityReference` (after kiki-api activity refs deploy); then
 * switch back to `ApiSchemas["ActivityReference"]` via `pnpm api:types`.
 */
export type ApiActivityReference = {
  taskId: string;
  ticketKey: string | null;
  title: string;
  url: string;
};
/** Activity log DTO; `references` is additive until OpenAPI lists it on ActivityLog. */
export type ApiActivityLog = ApiSchemas["ActivityLog"] & {
  references?: ApiActivityReference[];
};
export type ApiAttachment = ApiSchemas["Attachment"];
export type ApiCreatedTask = ApiSchemas["CreatedTask"];

/** Narrow unknown JSON `references` into typed activity links (omit when absent). */
export function readActivityReferences(value: unknown): ApiActivityReference[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) return undefined;
  const refs: ApiActivityReference[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.taskId !== "string" || !row.taskId.trim()) continue;
    if (typeof row.title !== "string" || typeof row.url !== "string") continue;
    refs.push({
      taskId: row.taskId.trim(),
      ticketKey: typeof row.ticketKey === "string" ? row.ticketKey : null,
      title: row.title,
      url: row.url,
    });
  }
  return refs;
}

type JsonBody<T> = T extends { content: { "application/json": infer Body } } ? Body : never;

/**
 * The JSON body a GET route answers with, straight from the API's OpenAPI document. When the API changes
 * what a route returns, every place that reads it through this type stops compiling after `pnpm api:types`.
 */
export type ApiGetResponse<Path extends keyof paths, Status extends number = 200> =
  NonNullable<paths[Path]["get"]>["responses"] extends infer Responses
    ? Status extends keyof Responses
      ? JsonBody<Responses[Status]>
      : never
    : never;

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

/** The JSON body a route answers with for one method and status, for routes that are not a GET. */
export type ApiResponse<
  Path extends keyof paths,
  Method extends HttpMethod & keyof paths[Path],
  Status extends keyof NonNullable<paths[Path][Method]>["responses"],
> = JsonBody<NonNullable<paths[Path][Method]>["responses"][Status]>;

/** What the server-rendered pages read (GET /v1/me/*, /v1/boards/:id/view). */
export type ApiBoardCard = ApiSchemas["BoardCard"];
export type ApiMyTasks = ApiSchemas["MyTasks"];
export type ApiBoardPeople = ApiSchemas["BoardPeople"];
export type ApiWorkspace = ApiSchemas["Workspace"];
export type ApiBoardView = ApiSchemas["BoardView"];
export type ApiBoardViewTask = ApiSchemas["BoardViewTask"];
export type ApiDashboard = ApiSchemas["Dashboard"];
export type ApiSharedTask = ApiSchemas["SharedTask"];
export type ApiGithubResult = ApiGetResponse<"/v1/integrations/github/result">;
