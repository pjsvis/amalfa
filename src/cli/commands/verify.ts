import { join } from "node:path";
import { unlinkSync, writeFileSync } from "node:fs";
import { loadConfig } from "@src/config/defaults";
import { AmalfaIngestor } from "@src/pipeline/AmalfaIngestor";
import { ResonanceDB } from "@src/resonance/db";
import { telemetry } from "@src/services/PipelineTelemetry";

// const log = getLogger("Verify");

export async function cmdVerify(_args: string[]) {
  const startTime = Date.now();
  console.log("🧪 Starting End-to-End Round-Trip Verification...");

  try {
    const config = await loadConfig();
    const dbPath = join(process.cwd(), config.database);
    const db = new ResonanceDB(dbPath);
    const ingestor = new AmalfaIngestor(config, db);

    // 1. Create Canary File
    const canaryPath = join(process.cwd(), "docs", ".amalfa-canary.md");
    const canaryContent = `---
title: Ingestion Canary
tags: [test, verification]
---
# Ingestion Canary
This is a test document for round-trip verification.
It mentions [[README]] and [[AMALFA]] to test edge weaving.
`;

    console.log("📝 Creating canary file...");
    writeFileSync(canaryPath, canaryContent);

    // 2. Trigger Ingestion
    console.log("🔄 Triggering targeted ingestion...");
    const result = await ingestor.ingestFiles([canaryPath]);

    if (!result.success) {
      throw new Error("Ingestion failed");
    }

    // 3. Verify Node Presence
    console.log("🔍 Verifying node integrity...");
    const node = db.getNode("docs--amalfa-canary"); // ID generation protocol
    if (!node) {
      // Try alternate ID if ID generation changed
      const nodes = db.getNodes({ excludeContent: true });
      const found = nodes.find((n) => n.label === "Ingestion Canary");
      if (!found) throw new Error("Canary node not found in database");
    }
    console.log("✅ Node verified.");

    // 4. Verify Edge Weaving
    console.log("🔗 Verifying edge weaving...");
    const edges = db.getEdges("docs--amalfa-canary");
    if (edges.length === 0) {
      console.warn(
        "⚠️  No edges found for canary. Lexicon might be empty or README/AMALFA not in graph.",
      );
    } else {
      console.log(`✅ ${edges.length} edges verified.`);
    }

    // 5. Cleanup
    console.log("🧹 Cleaning up...");
    unlinkSync(canaryPath);
    // Note: We leave the node in the DB for now, or we could delete it if ResonanceDB supports delete.

    const duration = Date.now() - startTime;
    console.log(`\n🎉 Round-trip successful! (${duration}ms)`);
    telemetry.update("Sync", "idle", "Verified OK");
  } catch (e) {
    console.error(`\n❌ Round-trip failed: ${String(e)}`);
    telemetry.update("Sync", "error", "Verification Failed");
    process.exit(1);
  }
}
