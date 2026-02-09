import { DaemonManager } from "../utils/DaemonManager";
// import { getLogger } from "../utils/Logger";

// const log = getLogger("CLI:Enhance");

export async function cmdEnhance(args: string[]) {
  const manager = new DaemonManager();
  const status = await manager.checkSonarAgent();

  if (!status.running) {
    console.error("❌ Sonar Agent is not running.");
    console.error("   Please start it first: amalfa sonar start");
    process.exit(1);
  }

  const BASE_URL = `http://localhost:${status.port}`;

  // Parse arguments
  const batchIdx = args.indexOf("--batch");
  const docIdx = args.indexOf("--doc");
  const limitIdx = args.indexOf("--limit");

  if (batchIdx !== -1) {
    // Batch Mode
    let limit = 50;
    if (limitIdx !== -1) {
      const limitArg = args[limitIdx + 1];
      if (limitArg !== undefined) {
        limit = parseInt(limitArg, 10);
      }
    }

    console.log(`🚀 Starting batch enhancement (Limit: ${limit})...`);
    try {
      const res = await fetch(`${BASE_URL}/metadata/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit }),
      });

      if (!res.ok) throw new Error(res.statusText);

      const result = (await res.json()) as {
        processed: number;
        errors: number;
      };
      console.log(`✅ Batch complete:`);
      console.log(`   Processed: ${result.processed}`);
      console.log(`   Errors:    ${result.errors}`);
    } catch (e) {
      console.error("❌ Batch enhancement failed:", e);
    }
    return;
  }

  if (docIdx !== -1 && args[docIdx + 1]) {
    // Single Doc Mode
    const docId = args[docIdx + 1];
    console.log(`🔍 Enhancing document: ${docId}...`);
    try {
      const res = await fetch(`${BASE_URL}/metadata/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId }),
      });

      if (!res.ok) throw new Error(res.statusText);

      const result = await res.json();
      console.log("✅ Enhancement successful!");
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("❌ Enhancement failed:", e);
    }
    return;
  }

  console.log("Usage:");
  console.log("  amalfa enhance --batch [--limit <n>]");
  console.log("  amalfa enhance --doc <id>");
}
