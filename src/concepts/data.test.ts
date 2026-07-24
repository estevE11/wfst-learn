import { describe, expect, it } from "vitest";
import { CONCEPTS } from "./data";

describe("concept inventory", () => {
  it("uses matching record keys and concept ids", () => {
    for (const [key, concept] of Object.entries(CONCEPTS)) {
      expect(concept.id).toBe(key);
    }
  });

  it("only links to concepts that exist", () => {
    const knownIds = new Set(Object.keys(CONCEPTS));
    const referencedIds = new Set<string>();

    for (const concept of Object.values(CONCEPTS)) {
      concept.prereqs.forEach((id) => referencedIds.add(id));
      concept.related.forEach((id) => referencedIds.add(id));
      for (const match of concept.body.matchAll(/\[\[([^|\]]+)/g)) {
        referencedIds.add(match[1]);
      }
    }

    expect([...referencedIds].filter((id) => !knownIds.has(id))).toEqual([]);
  });
});
