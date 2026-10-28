import { describe, expect, it } from "vitest";
import { apiPathFor } from "@/lib/apiRoutes";

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
    ["PATCH", "/api/onboarding", "/v1/onboarding"],
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
      ["PATCH", "/api/tasks/updateOrder"],
      ["POST", "/api/tasks/t1/labels"],
      ["GET", "/api/lists/createList"], // the app only had the POST
      ["PUT", "/api/lists/updateOrder"],
      ["DELETE", "/api/notifications/n1"],
      ["DELETE", "/api/search"],
      // The rest of the board routes belong to later sub-batches.
      ["GET", "/api/boards/b1/tasks"],
      ["GET", "/api/boards/b1/invitations"],
      ["PATCH", "/api/boards/b1/members/m1"],
      ["GET", "/api/organizations"],
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
