export interface DefaultCustomFieldDef {
  defaultKey: string;
  name: string;
  type: "NUMBER" | "TEXT" | "SELECT";
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
