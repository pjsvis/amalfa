import { spawn } from "node:child_process";
import { join } from "node:path";
import { defineCommand } from "citty";
import { checkDatabase, getDbPath } from "../../utils";

export const serveCommand = defineCommand({
  meta: {
    name: "serve",
    description: "Start MCP server (stdio transport)",
  },
  async run() {
    // Check database exists
    if (!(await checkDatabase())) {
      process.exit(1);
    }

    const dbPath = await getDbPath();
    console.error("🚀 Starting AMALFA MCP Server...");
    console.error(`📊 Database: ${dbPath}`);
    console.error("");

    const serverPath = join(process.cwd(), "src/mcp/index.ts");
    const proc = spawn("bun", ["run", serverPath, "serve"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    proc.on("exit", (code) => {
      process.exit(code ?? 0);
    });
  },
});

// Legacy export
export async function cmdServe(args: string[]) {
  if (serveCommand.run) {
    return serveCommand.run({
      rawArgs: args,
      args: { _: args } as any,
      cmd: serveCommand,
      data: {},
    });
  }
}
