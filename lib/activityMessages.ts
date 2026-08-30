import type { AppTranslator } from "@/lib/i18nFormat";

export type LogParams = Record<string, string | number>;

export type DecodedLog = {
  key: string;
  params: LogParams;
};

export function encodeLogMessage(key: string, params: LogParams = {}): string {
  return JSON.stringify({ k: key, p: params });
}

export function decodeLogMessage(raw: string): DecodedLog | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed) as { k?: unknown; p?: unknown };
      if (typeof parsed.k === "string") {
        return {
          key: parsed.k,
          params: parsed.p && typeof parsed.p === "object" && !Array.isArray(parsed.p)
            ? (parsed.p as LogParams)
            : {},
        };
      }
    } catch {
      // fall through to legacy parser
    }
  }
  return parseLegacyLog(raw);
}

export function formatLogMessage(raw: string, t: AppTranslator): string {
  const decoded = decodeLogMessage(raw);
  if (!decoded) return raw;
  try {
    return t(decoded.key, decoded.params);
  } catch {
    return raw;
  }
}

type LegacyRule = {
  pattern: RegExp;
  key: string;
  names: string[];
};

const LEGACY_RULES: LegacyRule[] = [
  {
    pattern: /^(.+) movió la tarea "(.+)" de "(.+)" a "(.+)"$/,
    key: "activity.ticketMoved",
    names: ["actor", "ticket", "from", "to"],
  },
  {
    pattern: /^(.+) movió "(.+)" de "(.+)" a "(.+)"$/,
    key: "activity.ticketMoved",
    names: ["actor", "ticket", "from", "to"],
  },
  {
    pattern: /^(.+) moved the ticket "(.+)" from "(.+)" to "(.+)"$/,
    key: "activity.ticketMoved",
    names: ["actor", "ticket", "from", "to"],
  },
  {
    pattern: /^(.+) agregó a (.+) como colaborador en "(.+)"$/,
    key: "activity.collaboratorAdded",
    names: ["actor", "name", "ticket"],
  },
  {
    pattern: /^(.+) removió a (.+) de colaboradores en "(.+)"$/,
    key: "activity.collaboratorRemoved",
    names: ["actor", "name", "ticket"],
  },
  {
    pattern: /^(.+) asignó a (.+) como QA de "(.+)"$/,
    key: "activity.qaAssigned",
    names: ["actor", "name", "ticket"],
  },
  {
    pattern: /^(.+) removió al QA de la tarea "(.+)"$/,
    key: "activity.qaRemoved",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) asignó "(.+)" a (.+)$/,
    key: "activity.ticketAssigned",
    names: ["actor", "ticket", "assignee"],
  },
  {
    pattern: /^(.+) desasignó la tarea "(.+)"$/,
    key: "activity.ticketUnassigned",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) creó la lista "(.+)"$/,
    key: "activity.listCreated",
    names: ["actor", "list"],
  },
  {
    pattern: /^(.+) eliminó la lista "(.+)"$/,
    key: "activity.listDeleted",
    names: ["actor", "list"],
  },
  {
    pattern: /^(.+) creó la tarea "(.+)" en "(.+)"$/,
    key: "activity.ticketCreated",
    names: ["actor", "ticket", "list"],
  },
  {
    pattern: /^(.+) eliminó la tarea "(.+)"$/,
    key: "activity.ticketDeleted",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) completó la tarea "(.+)"$/,
    key: "activity.ticketCompleted",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) reactivó la tarea "(.+)"$/,
    key: "activity.ticketReopened",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) renombró la tarea "(.+)" a "(.+)"$/,
    key: "activity.ticketRenamed",
    names: ["actor", "ticket", "newTitle"],
  },
  {
    pattern: /^ha creado (\d+) tareas mediante Brain Dump con IA$/,
    key: "activity.brainDumpCount",
    names: ["count"],
  },
  {
    pattern: /^(.+) te asignó la tarea "(.+)"$/,
    key: "notifications.assignedYou",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) comentó en la tarea "(.+)"$/,
    key: "notifications.commented",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) te asignó como QA en la tarea "(.+)"$/,
    key: "notifications.assignedYouQa",
    names: ["actor", "ticket"],
  },
  {
    pattern: /^(.+) te agregó como colaborador en la tarea "(.+)"$/,
    key: "notifications.addedYouCollaborator",
    names: ["actor", "ticket"],
  },
];

function parseLegacyLog(raw: string): DecodedLog | null {
  for (const rule of LEGACY_RULES) {
    const match = raw.match(rule.pattern);
    if (!match) continue;
    const params: LogParams = {};
    rule.names.forEach((name, index) => {
      const value = match[index + 1];
      params[name] = name === "count" ? Number(value) : value;
    });
    return { key: rule.key, params };
  }
  return null;
}
