/**
 * Document Registry Tests
 */

import { describe, it, expect } from "bun:test";
import { getDocumentRegistry } from "./doc-registry";
import { existsSync } from "fs";

describe("getDocumentRegistry", () => {
  it("returns document set with folders", () => {
    const registry = getDocumentRegistry();
    expect(registry.folders.length).toBeGreaterThan(0);
    expect(registry.folders[0]?.key).toBe("docs");
  });

  it("returns categorized documents", () => {
    const registry = getDocumentRegistry();
    expect(registry.byCategory.index.length).toBeGreaterThan(0);
  });

  it("has valid document metadata", () => {
    const registry = getDocumentRegistry();
    expect(registry.documents.length).toBeGreaterThan(0);
    const doc = registry.documents[0];
    expect(doc).toBeDefined();
    expect(doc?.file).toBeDefined();
    expect(typeof doc?.file).toBe("string");
    expect(doc?.id).toBeDefined();
  });

  it("has persisted registry file", () => {
    expect(existsSync(".amalfa/runtime/doc-registry.json")).toBe(true);
  });
});
