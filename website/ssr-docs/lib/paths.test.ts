/**
 * Path Utilities Tests
 */

import { describe, it, expect } from "bun:test";
import { findProjectRoot, resolvePath } from "./paths";

describe("findProjectRoot", () => {
  it("finds root from nested directory", () => {
    const root = findProjectRoot("/Users/petersmith/Dev/GitHub/amalfa/website/ssr-docs");
    expect(root).toBe("/Users/petersmith/Dev/GitHub/amalfa");
  });

  it("finds root from project root", () => {
    const root = findProjectRoot("/Users/petersmith/Dev/GitHub/amalfa");
    expect(root).toBe("/Users/petersmith/Dev/GitHub/amalfa");
  });

  it("returns null when no marker found", () => {
    const root = findProjectRoot("/nonexistent");
    expect(root).toBeNull();
  });
});

describe("resolvePath", () => {
  it("resolves paths relative to project root", () => {
    const docsPath = resolvePath("docs");
    expect(docsPath).toBe("/Users/petersmith/Dev/GitHub/amalfa/docs");
  });

  it("resolves nested paths", () => {
    const path = resolvePath("src", "config", "defaults.ts");
    expect(path).toBe("/Users/petersmith/Dev/GitHub/amalfa/src/config/defaults.ts");
  });
});
