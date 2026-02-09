import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { unlink } from "node:fs/promises";
import { EmberSquasher } from "@src/ember/squasher";
import type { EmberSidecar } from "@src/ember/types";

const TEST_FILE = ".amalfa/test_squasher_target.md";
const SIDECAR_FILE = ".amalfa/test_squasher_target.md.ember.json";

describe("EmberSquasher", () => {
  let squasher: EmberSquasher;

  beforeEach(async () => {
    squasher = new EmberSquasher();
    // Setup initial file
    await Bun.write(
      TEST_FILE,
      `---
title: Original Title
tags:
  - existing
---
# Content
Original content here.
`,
    );
  });

  afterEach(async () => {
    try {
      await unlink(TEST_FILE);
    } catch {}
    try {
      await unlink(SIDECAR_FILE);
    } catch {}
  });

  test("should merge tags without duplicates", async () => {
    const sidecar: EmberSidecar = {
      targetFile: TEST_FILE,
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      changes: {
        tags: {
          add: ["new-tag", "existing"], // 'existing' is duplicate
        },
      },
    };

    await Bun.write(SIDECAR_FILE, JSON.stringify(sidecar));
    await squasher.squash(SIDECAR_FILE);

    const content = await Bun.file(TEST_FILE).text();
    expect(content).toContain("tags:");
    expect(content).toContain("- existing");
    expect(content).toContain("- new-tag");

    // Count occurrences of 'existing' to ensure no duplication
    const matches = content.match(/- existing/g);
    expect(matches?.length).toBe(1);
  });

  test("should update frontmatter fields", async () => {
    const sidecar: EmberSidecar = {
      targetFile: TEST_FILE,
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      changes: {
        frontmatter: {
          status: "final",
          author: "bot",
        },
      },
    };

    await Bun.write(SIDECAR_FILE, JSON.stringify(sidecar));
    await squasher.squash(SIDECAR_FILE);

    const content = await Bun.file(TEST_FILE).text();
    expect(content).toContain("status: final");
    expect(content).toContain("author: bot");
    expect(content).toContain("title: Original Title"); // preserved
  });

  test("should preserve content exactly", async () => {
    const sidecar: EmberSidecar = {
      targetFile: TEST_FILE,
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      changes: {
        tags: { add: ["tag"] },
      },
    };

    await Bun.write(SIDECAR_FILE, JSON.stringify(sidecar));
    await squasher.squash(SIDECAR_FILE);

    const content = await Bun.file(TEST_FILE).text();
    expect(content).toContain("# Content");
    expect(content).toContain("Original content here.");
  });

  test("should delete sidecar after squashing", async () => {
    const sidecar: EmberSidecar = {
      targetFile: TEST_FILE,
      generatedAt: new Date().toISOString(),
      confidence: 1.0,
      changes: { tags: { add: ["tag"] } },
    };

    await Bun.write(SIDECAR_FILE, JSON.stringify(sidecar));
    await squasher.squash(SIDECAR_FILE);

    const exists = await Bun.file(SIDECAR_FILE).exists();
    expect(exists).toBe(false);
  });
});
