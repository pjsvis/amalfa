import { ResonanceDB } from "@src/resonance/db";
import { defineCommand } from "citty";
import { checkDatabase, getDbPath } from "../../utils";

interface Edge {
  target: string;
  type: string;
}

export const exploreCommand = defineCommand({
  meta: {
    name: "explore",
    description: "Explore related documents and links in the graph",
  },
  args: {
    id: {
      type: "positional",
      description: "Node ID to explore",
      required: true,
    },
    relation: {
      type: "string",
      description: "Filter by relation type",
      alias: "r",
    },
    json: {
      type: "boolean",
      description: "Output results as JSON",
      alias: "j",
    },
  },
  async run({ args }) {
    const { id: nodeId, relation: relationType, json: jsonOutput } = args;

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

    try {
      // Get edges using raw SQL
      const allEdges = db
        .getRawDb()
        .query("SELECT target, type FROM edges WHERE source = ?")
        .all(nodeId) as Edge[];

      if (!allEdges || allEdges.length === 0) {
        if (jsonOutput) {
          console.log(JSON.stringify([]));
        } else {
          console.log(`\n🔗 No outgoing links found for: ${nodeId}\n`);
          console.log("This node either:");
          console.log("  - Has no explicit links to other documents");
          console.log("  - Doesn't exist in the graph");
          console.log(
            "\n💡 Tip: Use 'amalfa query read' to verify the node exists",
          );
        }
        return;
      }

      // Filter by relation type if specified
      const edges = relationType
        ? allEdges.filter((e: Edge) => e.type === relationType)
        : allEdges;

      // Output
      if (jsonOutput) {
        console.log(JSON.stringify(edges, null, 2));
      } else {
        // Human-readable output
        if (edges.length === 0 && relationType) {
          console.log(
            `\n🔗 No links of type "${relationType}" found for: ${nodeId}\n`,
          );
          console.log("Available relation types:");
          const types = new Set(allEdges.map((e: Edge) => e.type));
          for (const type of types) {
            console.log(`  - ${type}`);
          }
          console.log();
        } else {
          const title = relationType ? `Links (${relationType})` : "All Links";
          console.log(`\n🔗 ${title} from: ${nodeId}\n`);

          // Group by type
          const byType = new Map<string, Edge[]>();
          for (const edge of edges) {
            const e = edge as Edge;
            if (!byType.has(e.type)) {
              byType.set(e.type, []);
            }
            byType.get(e.type)?.push(e);
          }

          for (const [type, typeEdges] of byType) {
            console.log(`${type.toUpperCase()}:`);
            for (const edge of typeEdges) {
              console.log(`  → ${edge.target}`);
            }
            console.log();
          }

          console.log(
            `💡 Tip: Use 'amalfa query read <target>' to view linked documents\n`,
          );
        }
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
          "❌ Explore failed:",
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
export async function cmdExplore(args: string[]) {
  if (exploreCommand.run) {
    const nodeId = args.find((arg) => !arg.startsWith("--"));
    let relation: string | undefined;
    const relIdx = args.indexOf("--relation");
    if (relIdx !== -1 && args[relIdx + 1]) relation = args[relIdx + 1];

    return exploreCommand.run({
      rawArgs: args,
      args: {
        _: args,
        id: nodeId || "",
        relation,
        r: relation,
        json: args.includes("--json"),
        j: args.includes("--json"),
      } as any,
      cmd: exploreCommand,
      data: {},
    });
  }
}
