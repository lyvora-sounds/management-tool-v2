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
      ["POST", "/api/tasks/createTask"],
      ["POST", "/api/tasks/t1/comments"], // Kiki answers after the response: it moves with the agent routes
      ["POST", "/api/tasks/t1/agent-apply"],
      ["POST", "/api/tasks/t1/agent-undo"],
      ["PUT", "/api/tasks/t1/attachments"],
      ["GET", "/api/tasks/t1/attachments/a1"], // there is no single-attachment read; only the download
      ["POST", "/api/tasks/t1/attachments/a1/download"],
      ["PUT", "/api/tasks/t1/share"],
      ["GET", "/api/tasks/updateTask/t1"],
      ["GET", "/api/lists/createList"], // the app only had the POST
      ["PUT", "/api/lists/updateOrder"],
      ["DELETE", "/api/notifications/n1"],
      ["DELETE", "/api/search"],
      // The rest of the board routes belong to later sub-batches.
      ["POST", "/api/boards/b1/tasks"],
      ["PUT", "/api/boards/b1/members/m1"],
      ["PUT", "/api/invite/tok_1"],
      ["PUT", "/api/organizations/o1/members"],
      ["PATCH", "/api/organizations"],
      ["GET", "/api/organizations/o1/teams/t1/members"],
      // GitHub keeps its own sub-batch: the routes and their library move together.
      ["GET", "/api/organizations/o1/github"],
      ["POST", "/api/organizations/o1/github/install"],
      ["GET", "/api/organizations/o1/github/repositories"],
      ["POST", "/api/boards/b1/links"],
      ["GET", "/api/boards/b1/permissions"],
    ];
    for (const [method, path] of stays) expect(apiPathFor(method, path)).toBeNull();
  });

  it("does not take a longer path for a shorter one", () => {
    expect(apiPathFor("GET", "/api/labels/label/l1")).toBeNull();
    expect(apiPathFor("GET", "/api/search/extra")).toBeNull();
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
