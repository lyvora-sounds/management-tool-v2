import type { LabelModel } from "@/lib/generated/prisma/models/Label";
import type { ApiLabel } from "./types";

/**
 * What the API sends for a label, as the Prisma-shaped model the board screens use. Dates cross the wire as
 * ISO strings. Reading every field by name here is what makes a change in the API's label fail the build.
 */
export function labelFromApi(label: ApiLabel): LabelModel {
  return {
    id: label.id,
    title: label.title,
    color: label.color,
    boardId: label.boardId,
    createdAt: new Date(label.createdAt),
    updatedAt: new Date(label.updatedAt),
  };
}
