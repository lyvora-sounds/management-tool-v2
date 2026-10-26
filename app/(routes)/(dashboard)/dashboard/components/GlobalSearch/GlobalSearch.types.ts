import type { ApiGetResponse } from "@/lib/api/types";

/** What GET /v1/search sends. A change in the API's answer fails the build here. */
export type SearchResults = ApiGetResponse<"/v1/search">;
export type SearchBoard = SearchResults["boards"][number];
export type SearchTask = SearchResults["tasks"][number];
