import { GraphEngine } from "@src/core/GraphEngine";
import { GraphGardener } from "@src/core/GraphGardener";
import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { defineCommand } from "citty";
import { checkDatabase, getDbPath } from "../../utils";

export const readCommand = defineCommand({
  meta: {
    name: "read",
    description: "Read document content from the knowledge graph",
  },
  args: {
    id: {
      type: "positional",
      description: "Node ID to read",
      required: true,
    },
    json: {
      type: "boolean",
      description: "Output content as JSON",
      alias: "j",
    },
  },
  async run({ args }) {
    const { id: nodeId, json: jsonOutput } = args;

    // Check database
    if (!(await checkDatabase())) {
      if (jsonOutput) {
        console.error(
          JSON.stringify({
            error: "Database not found",
            suggestion: "Run 'amalfa init' first",
          }),
        );
      } else {
        console.error("❌ Database not found. Run 'amalfa init' first.");
      }
      process.exit(1);
    }

    // Connect to database
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const vectorEngine = new VectorEngine(db.getRawDb());
    const graphEngine = new GraphEngine();

    try {
      await graphEngine.load(db.getRawDb());
      const gardener = new GraphGardener(db, graphEngine, vectorEngine);

      // Get content
      const content = await gardener.getContent(nodeId);

      if (!content) {
        if (jsonOutput) {
          console.error(
            JSON.stringify({
              error: "Node not found",
              node_id: nodeId,
              suggestion:
                "Check the node ID. Use 'amalfa query search' to find documents.",
            }),
          );
        } else {
          console.error(`❌ Node not found: ${nodeId}`);
          console.error(
            "\n💡 Tip: Use 'amalfa query search <query>' to find documents",
          );
        }
        process.exit(1);
      }

      // Output
      if (jsonOutput) {
        console.log(
          JSON.stringify({
            id: nodeId,
            content,
          }),
        );
      } else {
        // Human-readable output with header
        console.log(`\n📄 ${nodeId}`);
        console.log("─".repeat(80));
        console.log(content);
        console.log("─".repeat(80));
        console.log(
          `\n💡 Tip: Use 'amalfa query explore ${nodeId}' to see related documents\n`,
        );
      }
    } catch (error) {
      if (jsonOutput) {
        console.error(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            node_id: nodeId,
          }),
        );
      } else {
        console.error(
          "❌ Read failed:",
          error instanceof Error ? error.message : error,
        );
      }
      process.exit(1);
    } finally {
      db.close();
    }
  },
});

// Legacy export
export async function cmdRead(args: string[]) {
  if (readCommand.run) {
    const nodeId = args.find((arg) => !arg.startsWith("--"));
    return readCommand.run({
      rawArgs: args,
      args: {
        _: args,
        id: nodeId || "",
        json: args.includes("--json"),
        j: args.includes("--json"),
      } as any,
      cmd: readCommand,
      data: {},
    });
  }
}
