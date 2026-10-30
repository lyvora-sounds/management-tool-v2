import type { components, paths } from "./schema";

/** Schemas that kiki-api publishes, by name. */
export type ApiSchemas = components["schemas"];
export type ApiLabel = ApiSchemas["Label"];
export type ApiError = ApiSchemas["Error"];
export type ApiBoard = ApiSchemas["Board"];
export type ApiBoardLink = ApiSchemas["BoardLink"];
export type ApiActivityLog = ApiSchemas["ActivityLog"];
export type ApiAttachment = ApiSchemas["Attachment"];

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
