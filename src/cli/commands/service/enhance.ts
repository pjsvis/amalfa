import { DaemonManager } from "@src/utils/DaemonManager";
import { defineCommand } from "citty";

export const enhanceCommand = defineCommand({
  meta: {
    name: "enhance",
    description: "Enhance graph metadata using Sonar agent",
  },
  args: {
    batch: {
      type: "boolean",
      description: "Run in batch mode",
    },
    doc: {
      type: "string",
      description: "Document ID to enhance",
    },
    limit: {
      type: "string",
      description: "Max documents to process in batch",
      default: "50",
    },
  },
  async run({ args }) {
    const manager = new DaemonManager();
    const status = await manager.checkSonarAgent();

    if (!status.running) {
      console.error("❌ Sonar Agent is not running.");
      console.error("   Please start it first: amalfa service sonar start");
      process.exit(1);
    }

    const BASE_URL = `http://localhost:${status.port}`;

    if (args.batch) {
      const limit = Number.parseInt(args.limit, 10);
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

    if (args.doc) {
      const docId = args.doc;
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
    console.log("  amalfa service enhance --batch [--limit <n>]");
    console.log("  amalfa service enhance --doc <id>");
  },
});

// Legacy export
export async function cmdEnhance(args: string[]) {
  if (enhanceCommand.run) {
    let limit = "50";
    const limitIdx = args.indexOf("--limit");
    if (limitIdx !== -1 && args[limitIdx + 1])
      limit = args[limitIdx + 1] ?? "50";

    const docIdx = args.indexOf("--doc");
    const docId = docIdx !== -1 ? args[docIdx + 1] : undefined;

    return enhanceCommand.run({
      rawArgs: args,
      args: {
        _: args,
        batch: args.includes("--batch"),
        doc: docId || "",
        limit,
      } as any,
      cmd: enhanceCommand,
      data: {},
    });
  }
}
