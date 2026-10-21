import { describe, expect, it } from "vitest";
import { findMentionedUserIds } from "@/lib/mentions";

const users = [
  { id: "ana", name: "Ana", email: "ana@x.com" },
  { id: "anamaria", name: "Ana María", email: "am@x.com" },
  { id: "mario", name: "mario ruby", email: "mario@x.com" },
  { id: "nameless", name: null, email: "dev@x.com" },
];

describe("findMentionedUserIds", () => {
  it("finds people by name, ignoring case", () => {
    expect(findMentionedUserIds("hola @Mario Ruby, mira esto", users)).toEqual(["mario"]);
  });
  it("does not match a longer name by its prefix", () => {
    expect(findMentionedUserIds("@Ana María puedes revisar", users)).toEqual(["anamaria"]);
    expect(findMentionedUserIds("@Ana y @Ana María", users).sort()).toEqual(["ana", "anamaria"]);
  });
  it("requires a boundary after the name and ignores emails and plain text", () => {
    expect(findMentionedUserIds("@Anabel no es nadie", users)).toEqual([]);
    expect(findMentionedUserIds("escríbeme a ana@x.com", users)).toEqual([]);
    expect(findMentionedUserIds("sin menciones", users)).toEqual([]);
  });
  it("falls back to the email for users without a name", () => {
    expect(findMentionedUserIds("ping @dev@x.com", users)).toEqual(["nameless"]);
  });
  it("counts each person once", () => {
    expect(findMentionedUserIds("@Ana @ana @ANA", users)).toEqual(["ana"]);
  });
});
