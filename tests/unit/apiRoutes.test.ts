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
  ];

  it.each(migrated)("%s %s -> %s", (method, path, expected) => {
    expect(apiPathFor(method, path)).toBe(expected);
  });

  it("is case-insensitive on the method", () => {
    expect(apiPathFor("patch", "/api/notifications")).toBe("/v1/notifications");
  });

  it("leaves every route that has not moved on this app", () => {
    const stays: [string, string][] = [
      ["GET", "/api/boards/getBoards"],
      ["POST", "/api/tasks/createTask"],
      ["PATCH", "/api/tasks/updateOrder"],
      ["POST", "/api/tasks/t1/labels"],
      ["GET", "/api/lists/createList"], // the app only had the POST
      ["PUT", "/api/lists/updateOrder"],
      ["DELETE", "/api/notifications/n1"],
      ["DELETE", "/api/search"],
    ];
    for (const [method, path] of stays) expect(apiPathFor(method, path)).toBeNull();
  });

  it("does not take a longer path for a shorter one", () => {
    expect(apiPathFor("GET", "/api/labels/label/l1")).toBeNull();
    expect(apiPathFor("GET", "/api/search/extra")).toBeNull();
  });
});
