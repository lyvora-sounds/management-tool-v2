import { describe, expect, it } from "vitest";
import { apiPathFor, isPublicRoute } from "@/lib/apiRoutes";

describe("apiPathFor: routes already served by kiki-api", () => {
  // [method, the path the app calls, the path kiki-api serves]
  const migrated: [string, string, string][] = [
    ["GET", "/api/labels/b1", "/v1/labels/b1"],
    ["POST", "/api/labels/b1", "/v1/labels/b1"],
    ["PATCH", "/api/labels/label/l1", "/v1/labels/l1"],
    ["DELETE", "/api/labels/label/l1", "/v1/labels/l1"],
    ["POST", "/api/lists/createList", "/v1/lists"],
    ["PATCH", "/api/lists/updateOrder", "/v1/lists/order"],
    ["PATCH", "/api/lists/updateList/li1", "/v1/lists/li1"],
    ["DELETE", "/api/lists/deleteList/li1", "/v1/lists/li1"],
    ["GET", "/api/notifications", "/v1/notifications"],
    ["PATCH", "/api/notifications", "/v1/notifications"],
    ["PATCH", "/api/notifications/n1", "/v1/notifications/n1"],
    ["GET", "/api/search", "/v1/search"],
    ["GET", "/api/calendar", "/v1/calendar"],
    ["GET", "/api/settings/mcp/tokens", "/v1/settings/mcp/tokens"],
    ["GET", "/api/settings/mcp/history", "/v1/settings/mcp/history"],
    ["POST", "/api/settings/mcp/history", "/v1/settings/mcp/history"],
    ["GET", "/api/settings/mcp/oauth-clients", "/v1/settings/mcp/oauth-clients"],
    ["POST", "/api/settings/mcp/oauth-clients", "/v1/settings/mcp/oauth-clients"],
    ["DELETE", "/api/settings/mcp/oauth-clients", "/v1/settings/mcp/oauth-clients"],
    ["GET", "/api/boards/getBoards", "/v1/boards"],
    ["POST", "/api/boards/createBoard", "/v1/boards"],
    ["PATCH", "/api/boards/updateBoard/b1", "/v1/boards/b1"],
    ["DELETE", "/api/boards/deleteBoard/b1", "/v1/boards/b1"],
    ["GET", "/api/boards/b1/activity", "/v1/boards/b1/activity"],
    ["GET", "/api/boards/b1/links", "/v1/boards/b1/links"],
    ["PUT", "/api/boards/b1/links", "/v1/boards/b1/links"],
    ["PATCH", "/api/boards/b1/permissions", "/v1/boards/b1/permissions"],
    ["PATCH", "/api/boards/b1/organization", "/v1/boards/b1/organization"],
    ["GET", "/api/boards/b1/access", "/v1/boards/b1/access"],
    ["PATCH", "/api/boards/b1/access", "/v1/boards/b1/access"],
    ["GET", "/api/boards/b1/archive", "/v1/boards/b1/archive"],
    ["POST", "/api/boards/b1/archive", "/v1/boards/b1/archive"],
    ["PATCH", "/api/boards/b1/archive", "/v1/boards/b1/archive"],
    ["GET", "/api/boards/b1/epics", "/v1/boards/b1/epics"],
    ["POST", "/api/boards/b1/epics", "/v1/boards/b1/epics"],
    ["PATCH", "/api/boards/b1/epics", "/v1/boards/b1/epics"],
    ["DELETE", "/api/boards/b1/epics", "/v1/boards/b1/epics"],
    ["GET", "/api/boards/b1/integrations", "/v1/boards/b1/integrations"],
    ["PATCH", "/api/boards/b1/integrations", "/v1/boards/b1/integrations"],
    ["GET", "/api/boards/b1/invitations", "/v1/boards/b1/members"],
    ["POST", "/api/boards/b1/invitations", "/v1/boards/b1/invitations"],
    ["DELETE", "/api/boards/b1/invitations/i1", "/v1/boards/b1/invitations/i1"],
    ["PATCH", "/api/boards/b1/members/m1", "/v1/boards/b1/members/m1"],
    ["DELETE", "/api/boards/b1/members/m1", "/v1/boards/b1/members/m1"],
    ["GET", "/api/boards/b1/external-access", "/v1/boards/b1/external-access"],
    ["POST", "/api/boards/b1/external-access", "/v1/boards/b1/external-access"],
    ["DELETE", "/api/boards/b1/external-access/t1", "/v1/boards/b1/external-access/t1"],
    ["GET", "/api/organizations/o1/external-access", "/v1/organizations/o1/external-access"],
    ["POST", "/api/organizations/o1/external-access", "/v1/organizations/o1/external-access"],
    ["DELETE", "/api/organizations/o1/external-access/t1", "/v1/organizations/o1/external-access/t1"],
    ["GET", "/api/invite/tok_1", "/v1/invitations/tok_1"],
    ["POST", "/api/invite/tok_1", "/v1/invitations/tok_1/accept"],
    ["GET", "/api/organizations", "/v1/organizations"],
    ["POST", "/api/organizations", "/v1/organizations"],
    ["GET", "/api/organizations/o1/members", "/v1/organizations/o1/members"],
    ["POST", "/api/organizations/o1/members", "/v1/organizations/o1/members"],
    ["PATCH", "/api/organizations/o1/members", "/v1/organizations/o1/members"],
    ["DELETE", "/api/organizations/o1/members", "/v1/organizations/o1/members"],
    ["GET", "/api/organizations/o1/available-members", "/v1/organizations/o1/available-members"],
    ["GET", "/api/organizations/o1/teams", "/v1/organizations/o1/teams"],
    ["POST", "/api/organizations/o1/teams", "/v1/organizations/o1/teams"],
    ["POST", "/api/organizations/o1/teams/t1/members", "/v1/organizations/o1/teams/t1/members"],
    ["DELETE", "/api/organizations/o1/teams/t1/members", "/v1/organizations/o1/teams/t1/members"],
    ["POST", "/api/organizations/o1/teams/t1/boards", "/v1/organizations/o1/teams/t1/boards"],
    ["DELETE", "/api/organizations/o1/teams/t1/boards", "/v1/organizations/o1/teams/t1/boards"],
    ["PATCH", "/api/onboarding", "/v1/onboarding"],
    ["POST", "/api/ai/parse", "/v1/ai/parse"],
    ["POST", "/api/ai/improve", "/v1/ai/improve"],
    ["POST", "/api/ai/transcribe", "/v1/ai/transcribe"],
    ["GET", "/api/settings/ai", "/v1/settings/ai"],
    ["PUT", "/api/settings/ai", "/v1/settings/ai"],
    ["GET", "/api/settings/appearance", "/v1/settings/appearance"],
    ["PUT", "/api/settings/appearance", "/v1/settings/appearance"],
    ["GET", "/api/settings/security", "/v1/settings/security"],
    ["POST", "/api/settings/security", "/v1/settings/security"],
    ["GET", "/api/settings/custom-fields", "/v1/settings/custom-fields"],
    ["POST", "/api/settings/custom-fields", "/v1/settings/custom-fields"],
    ["GET", "/api/settings/custom-fields/boards", "/v1/settings/custom-fields/boards"],
    ["PATCH", "/api/settings/custom-fields/f1", "/v1/settings/custom-fields/f1"],
    ["DELETE", "/api/settings/custom-fields/f1", "/v1/settings/custom-fields/f1"],
    ["GET", "/api/organizations/o1/github", "/v1/organizations/o1/github"],
    ["PATCH", "/api/organizations/o1/github", "/v1/organizations/o1/github"],
    ["DELETE", "/api/organizations/o1/github", "/v1/organizations/o1/github"],
    ["GET", "/api/organizations/o1/github/repositories", "/v1/organizations/o1/github/repositories"],
    ["GET", "/api/organizations/o1/github/branches", "/v1/organizations/o1/github/branches"],
    ["POST", "/api/organizations/o1/github/install", "/v1/organizations/o1/github/install"],
    ["POST", "/api/organizations/o1/github/finish", "/v1/organizations/o1/github/finish"],
    ["POST", "/api/organizations/o1/github/choose", "/v1/organizations/o1/github/choose"],
    ["GET", "/api/tasks/t1/development", "/v1/tasks/t1/development"],
    ["PATCH", "/api/tasks/updateTask/t1", "/v1/tasks/t1"],
    ["PATCH", "/api/tasks/updateOrder", "/v1/tasks/order"],
    ["DELETE", "/api/tasks/deleteTask/t1", "/v1/tasks/t1"],
    ["GET", "/api/boards/b1/tasks", "/v1/boards/b1/tasks"],
    ["POST", "/api/tasks/t1/labels", "/v1/tasks/t1/labels"],
    ["POST", "/api/tasks/t1/assignee", "/v1/tasks/t1/assignee"],
    ["POST", "/api/tasks/t1/qa", "/v1/tasks/t1/qa"],
    ["POST", "/api/tasks/t1/collaborators", "/v1/tasks/t1/collaborators"],
    ["GET", "/api/tasks/t1/subtasks", "/v1/tasks/t1/subtasks"],
    ["POST", "/api/tasks/t1/subtasks", "/v1/tasks/t1/subtasks"],
    ["PATCH", "/api/tasks/t1/subtasks/s1", "/v1/tasks/t1/subtasks/s1"],
    ["DELETE", "/api/tasks/t1/subtasks/s1", "/v1/tasks/t1/subtasks/s1"],
    ["GET", "/api/tasks/t1/custom-values", "/v1/tasks/t1/custom-values"],
    ["PATCH", "/api/tasks/t1/custom-values", "/v1/tasks/t1/custom-values"],
    ["GET", "/api/tasks/t1/share", "/v1/tasks/t1/share"],
    ["POST", "/api/tasks/t1/share", "/v1/tasks/t1/share"],
    ["DELETE", "/api/tasks/t1/share", "/v1/tasks/t1/share"],
    ["GET", "/api/tasks/t1/comments", "/v1/tasks/t1/comments"],
    ["DELETE", "/api/tasks/t1/comments/c1", "/v1/tasks/t1/comments/c1"],
    ["GET", "/api/tasks/t1/attachments", "/v1/tasks/t1/attachments"],
    ["POST", "/api/tasks/t1/attachments", "/v1/tasks/t1/attachments"],
    ["GET", "/api/tasks/t1/attachments/a1/download", "/v1/tasks/t1/attachments/a1/download"],
    ["DELETE", "/api/tasks/t1/attachments/a1", "/v1/tasks/t1/attachments/a1"],
    ["POST", "/api/tasks/createTask", "/v1/tasks"],
    ["POST", "/api/boards/b1/batchTasks", "/v1/boards/b1/tasks/batch"],
    ["POST", "/api/tasks/t1/comments", "/v1/tasks/t1/comments"],
    ["POST", "/api/tasks/t1/agent-apply", "/v1/tasks/t1/agent-apply"],
    ["POST", "/api/tasks/t1/agent-undo", "/v1/tasks/t1/agent-undo"],
  ];

  it.each(migrated)("%s %s -> %s", (method, path, expected) => {
    expect(apiPathFor(method, path)).toBe(expected);
  });

  it("is case-insensitive on the method", () => {
    expect(apiPathFor("patch", "/api/notifications")).toBe("/v1/notifications");
  });

  it("leaves every route that has not moved on this app", () => {
    const stays: [string, string][] = [
      ["PUT", "/api/boards/getBoards"],
      ["GET", "/api/boards/b1/hierarchy"], // drawn in the browser; nothing calls the route
      ["PUT", "/api/boards/b1/epics"],
      ["GET", "/api/tasks/createTask"], // the app only had the POST
      ["PUT", "/api/tasks/t1/comments"],
      ["GET", "/api/boards/b1/batchTasks"],
      ["GET", "/api/tasks/t1/agent-apply"],
      ["DELETE", "/api/tasks/t1/agent-undo"],
      ["PUT", "/api/tasks/t1/attachments"],
      ["GET", "/api/tasks/t1/attachments/a1"], // there is no single-attachment read; only the download
      ["POST", "/api/tasks/t1/attachments/a1/download"],
      ["PUT", "/api/tasks/t1/share"],
      ["GET", "/api/tasks/updateTask/t1"],
      ["GET", "/api/lists/createList"], // the app only had the POST
      ["PUT", "/api/lists/updateOrder"],
      ["DELETE", "/api/notifications/n1"],
      ["DELETE", "/api/search"],
      ["POST", "/api/calendar"], // the page only reads
      // Google Calendar OAuth is dormant and is not served by the API.
      ["GET", "/api/integrations/google-calendar/auth"],
      ["GET", "/api/integrations/google-calendar/callback"],
      // The rest of the board routes belong to later sub-batches.
      ["POST", "/api/boards/b1/tasks"],
      ["PUT", "/api/boards/b1/members/m1"],
      ["PUT", "/api/invite/tok_1"],
      ["PUT", "/api/organizations/o1/members"],
      ["PATCH", "/api/organizations"],
      ["GET", "/api/organizations/o1/teams/t1/members"],
      // The MCP endpoint itself belongs to the MCP batch.
      ["PUT", "/api/settings/mcp/history"],
      ["PATCH", "/api/settings/mcp/oauth-clients"],
      ["GET", "/api/settings/ai/extra"],
      ["DELETE", "/api/settings/ai"],
      ["GET", "/api/ai/parse"],
      ["POST", "/api/settings/custom-fields/f1"],
      // GitHub's setup page and its result are redirects of the browser, not calls: they stay in this app and relay.
      ["GET", "/api/integrations/github/setup"],
      ["POST", "/api/integrations/github/result"],
      ["POST", "/api/webhooks/github"],
      ["PUT", "/api/organizations/o1/github"],
      ["POST", "/api/organizations/o1/github/repositories"],
      ["GET", "/api/organizations/o1/github/install"],
      ["POST", "/api/boards/b1/links"],
      ["GET", "/api/boards/b1/permissions"],
    ];
    for (const [method, path] of stays) expect(apiPathFor(method, path)).toBeNull();
  });

  it("does not take a longer path for a shorter one", () => {
    expect(apiPathFor("GET", "/api/labels/label/l1")).toBeNull();
    expect(apiPathFor("GET", "/api/search/extra")).toBeNull();
    expect(apiPathFor("GET", "/api/calendar/extra")).toBeNull();
  });
});

describe("isPublicRoute", () => {
  it("is only the page behind an invitation link, and only for reading it", () => {
    expect(isPublicRoute("GET", "/api/invite/tok_1")).toBe(true);
    expect(isPublicRoute("get", "/api/invite/tok_1")).toBe(true);
    expect(isPublicRoute("POST", "/api/invite/tok_1")).toBe(false);
    expect(isPublicRoute("GET", "/api/boards/b1/members")).toBe(false);
    expect(isPublicRoute("GET", "/api/labels/b1")).toBe(false);
  });
});
