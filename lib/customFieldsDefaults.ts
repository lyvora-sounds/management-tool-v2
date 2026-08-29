export const CUSTOM_FIELD_TYPES = ["NUMBER", "TEXT", "SELECT"] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

export function isCustomFieldType(value: unknown): value is CustomFieldType {
  return (
    typeof value === "string" &&
    (CUSTOM_FIELD_TYPES as readonly string[]).includes(value)
  );
}

export function isParentFieldKey(key: string | null | undefined): boolean {
  return key === "parent";
}

export function isChildFieldKey(key: string | null | undefined): boolean {
  return key === "child";
}

export function isTicketRefKey(key: string | null | undefined): boolean {
  return isParentFieldKey(key) || isChildFieldKey(key);
}

export interface DefaultCustomFieldDef {
  defaultKey: string;
  name: string;
  type: CustomFieldType;
  options: string[] | null;
  order: number;
}

export const DEFAULT_CUSTOM_FIELDS: DefaultCustomFieldDef[] = [
  {
    defaultKey: "story_points",
    name: "Story points",
    type: "SELECT",
    options: ["1", "2", "3", "5", "8", "13", "21"],
    order: 0,
  },
  {
    defaultKey: "environment",
    name: "Environment",
    type: "SELECT",
    options: ["dev", "integration", "uat", "production"],
    order: 1,
  },
  {
    defaultKey: "parent",
    name: "Parent ticket",
    type: "TEXT",
    options: null,
    order: 2,
  },
  {
    defaultKey: "child",
    name: "Child ticket",
    type: "TEXT",
    options: null,
    order: 3,
  },
  {
    defaultKey: "customer",
    name: "Customer",
    type: "TEXT",
    options: null,
    order: 4,
  },
];
