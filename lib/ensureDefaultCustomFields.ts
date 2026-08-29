import db from "@/lib/db";
import { DEFAULT_CUSTOM_FIELDS } from "@/lib/customFieldsDefaults";

export function defaultCustomFieldRows() {
  return DEFAULT_CUSTOM_FIELDS.map((df) => ({
    name: df.name,
    type: df.type,
    options: df.options ?? undefined,
    enabled: true,
    isDefault: true,
    defaultKey: df.defaultKey,
    order: df.order,
  }));
}

export function defaultCustomFieldCreateData(boardId: string) {
  return defaultCustomFieldRows().map((field) => ({ ...field, boardId }));
}

export async function ensureDefaultCustomFields(boardId: string) {
  await db.customField.createMany({
    data: defaultCustomFieldCreateData(boardId),
    skipDuplicates: true,
  });
}
