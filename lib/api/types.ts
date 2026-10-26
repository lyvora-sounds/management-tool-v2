import type { components, paths } from "./schema";

/** Schemas that kiki-api publishes, by name. */
export type ApiSchemas = components["schemas"];
export type ApiLabel = ApiSchemas["Label"];
export type ApiError = ApiSchemas["Error"];

type JsonBody<T> = T extends { content: { "application/json": infer Body } } ? Body : never;

/**
 * The JSON body a GET route answers with, straight from the API's OpenAPI document. When the API changes
 * what a route returns, every place that reads it through this type stops compiling after `pnpm api:types`.
 */
export type ApiGetResponse<
  Path extends keyof paths,
  Status extends keyof NonNullable<paths[Path]["get"]>["responses"] = 200,
> = JsonBody<NonNullable<paths[Path]["get"]>["responses"][Status]>;
