import { describe, expect, it } from "bun:test";
import { loadConfig } from "@src/config/defaults";
import { AmalfaIngestor } from "@src/pipeline/AmalfaIngestor";
import { ResonanceDB } from "@src/resonance/db";

describe("Incremental Ingestion", () => {
  it("should process only specified files", async () => {
    const db = new ResonanceDB(":memory:");
    const config = await loadConfig();
    const ingestor = new AmalfaIngestor(config, db);

    // Create test file
    const testFile = "/tmp/test-incremental-doc.md";
    await Bun.write(testFile, "# Test\nContent for incremental test");

    // Ingest single file
    const result = await ingestor.ingestFiles([testFile]);

    expect(result.success).toBe(true);
    expect(result.stats.files).toBe(1);

    // Verify node exists
    const node = db.getNode("test-incremental-doc");
    expect(node).toBeDefined();
    expect(node?.label).toBe("test-incremental-doc.md"); // Uses filename as label since no frontmatter title

    db.close();
  });

  it("should handle empty file list", async () => {
    const db = new ResonanceDB(":memory:");
    const config = await loadConfig();
    const ingestor = new AmalfaIngestor(config, db);

    // Ingest empty list
    const result = await ingestor.ingestFiles([]);

    expect(result.success).toBe(true);
    expect(result.stats.files).toBe(0);

    db.close();
  });

  it("should skip unchanged files via hash", async () => {
    const db = new ResonanceDB(":memory:");
    const config = await loadConfig();
    const ingestor = new AmalfaIngestor(config, db);

    // Create test file
    const testFile = "/tmp/test-hash-check.md";
    const content = "# Hash Test\nUnchanged content";
    await Bun.write(testFile, content);

    // First ingest
    const result1 = await ingestor.ingestFiles([testFile]);
    expect(result1.success).toBe(true);

    // Get initial stats
    const stats1 = db.getStats();

    // Second ingest with same content (should skip via hash)
    const result2 = await ingestor.ingestFiles([testFile]);
    expect(result2.success).toBe(true);

    // Stats should be unchanged (no re-processing)
    const stats2 = db.getStats();
    expect(stats2.nodes).toBe(stats1.nodes);

    db.close();
  });

  it("should update node when content changes", async () => {
    const db = new ResonanceDB(":memory:");
    const config = await loadConfig();
    const ingestor = new AmalfaIngestor(config, db);

    // Create test file
    const testFile = "/tmp/test-update.md";
    await Bun.write(testFile, "# Original\nOriginal content");

    // First ingest
    await ingestor.ingestFiles([testFile]);
    const node1 = db.getNode("test-update");
    const hash1 = node1?.hash;

    // Update content
    await Bun.write(testFile, "# Updated\nNew content");

    // Second ingest
    await ingestor.ingestFiles([testFile]);
    const node2 = db.getNode("test-update");
    const hash2 = node2?.hash;

    // Hash should be different
    expect(hash1).toBeDefined();
    expect(hash2).toBeDefined();
    expect(hash1).not.toBe(hash2);

    db.close();
  });
});
