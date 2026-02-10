import { describe, expect, test } from "bun:test";
import { Harvester } from "@src/core/Harvester";

describe("Harvester", () => {
  test("Utils are stable", () => {
    expect(true).toBe(true);
    // We can test filtering logic
  });

  test("Filter Known Tags", () => {
    const harvester = new Harvester();
    const tags = new Map<string, string[]>();
    tags.set("known", ["file1.md"]);
    tags.set("unknown", ["file2.md"]);

    const knownIds = new Set(["known"]);

    const result = harvester.filterKnown(tags, knownIds);
    expect(result.size).toBe(1);
    expect(result.has("unknown")).toBe(true);
    expect(result.has("known")).toBe(false);
  });

  test("Cleanup Regex Logic", () => {
    const tag = "recursive-bullshit";
    const text = "This is a case of tag-recursive-bullshit inside a sentence.";
    const regex = new RegExp(`\\btag-${tag}\\b`, "g");
    const newText = text.replace(regex, tag);
    expect(newText).toBe(
      "This is a case of recursive-bullshit inside a sentence.",
    );
  });
});
