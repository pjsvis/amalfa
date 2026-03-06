import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { defineCommand } from "citty";

const SERVICES = [
  {
    name: "MCP Server",
    pidFile: join(AMALFA_DIRS.runtime, "mcp.pid"),
    port: "stdio",
    id: "mcp",
    cmd: "amalfa service serve",
  },
  {
    name: "Vector Daemon",
    pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
    port: "3010",
    id: "vector",
    cmd: "amalfa service vector start",
  },
  {
    name: "Reranker Daemon",
    pidFile: join(AMALFA_DIRS.runtime, "reranker-daemon.pid"),
    port: "3011",
    id: "reranker",
    cmd: "amalfa service reranker start",
  },
  {
    name: "File Watcher",
    pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
    port: "-",
    id: "watcher",
    cmd: "amalfa service watcher start",
  },
  {
    name: "Sonar Agent",
    pidFile: join(AMALFA_DIRS.runtime, "sonar.pid"),
    port: "3012",
    id: "sonar",
    cmd: "amalfa service sonar start",
  },
  {
    name: "Dashboard",
    pidFile: join(AMALFA_DIRS.runtime, "dashboard.pid"),
    port: "3013",
    id: "dashboard",
    cmd: "amalfa service dashboard start",
  },
  {
    name: "SSR Docs",
    pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid"),
    port: "3001",
    id: "ssr-docs",
    cmd: "bun run website/ssr-docs/server.ts",
  },
];

async function isRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export const serversCommand = defineCommand({
  meta: {
    name: "servers",
    description: "Show status of all AMALFA services",
  },
  args: {
    dot: {
      type: "boolean",
      description: "Output status as Graphviz DOT diagram",
    },
    action: {
      type: "positional",
      description:
        "Action to perform on all servers (start|stop|restart|status)",
      required: false,
    },
  },
  async run({ args }) {
    const action = args.action || "status";

    if (action !== "status") {
      await manageAllServers(action as "start" | "stop" | "restart");
      if (action !== "restart") return;
    }

    if (args.dot) {
      // Generate DOT diagram
      const statuses = new Map<string, { status: string; pid: string }>();

      for (const svc of SERVICES) {
        let status = "stopped";
        let pidStr = "-";

        if (existsSync(svc.pidFile)) {
          try {
            const text = readFileSync(svc.pidFile, "utf-8");
            const pid = Number.parseInt(text.trim(), 10);

            if (!Number.isNaN(pid) && (await isRunning(pid))) {
              status = "running";
              pidStr = pid.toString();
            } else {
              status = "stale";
              pidStr = `${pid}`;
            }
          } catch {
            // Ignore
          }
        }

        statuses.set(svc.id, { status, pid: pidStr });
      }

      console.log("digraph AMALFA {");
      console.log("  rankdir=LR;");
      console.log("  node [shape=box, style=filled];");
      console.log("");
      console.log("  // Nodes");

      for (const svc of SERVICES) {
        const st = statuses.get(svc.id);
        const color =
          st?.status === "running"
            ? "lightgreen"
            : st?.status === "stale"
              ? "orange"
              : "lightgray";
        const label = `${svc.name}\\nPort: ${svc.port}\\nPID: ${st?.pid || "-"}`;
        console.log(`  ${svc.id} [label="${label}", fillcolor=${color}];`);
      }

      console.log("");
      console.log("  // Databases");
      console.log(
        '  db [label="SQLite\\n.amalfa/resonance.db", shape=cylinder, fillcolor=lightyellow];',
      );
      console.log(
        '  semdb [label="SQLite\\n.amalfa/runtime/semantic.db", shape=cylinder, fillcolor=lightblue];',
      );
      console.log("");
      console.log("  // Connections");
      console.log('  mcp -> db [label="read/write"];');
      console.log('  vector -> db [label="embeddings"];');
      console.log('  watcher -> db [label="updates"];');
      console.log('  mcp -> vector [label="query", style=dashed];');
      console.log('  vector -> reranker [label="rerank", style=dashed];');
      console.log('  dashboard -> db [label="visualize"];');
      console.log('  dashboard -> semdb [label="visualize"];');
      console.log("}");
      return;
    }

    console.log("\n📡 AMALFA Service Status\n");
    console.log("─".repeat(95));
    console.log(
      "SERVICE".padEnd(18) +
        "COMMAND".padEnd(25) +
        "PORT".padEnd(12) +
        "STATUS".padEnd(15) +
        "PID".padEnd(10),
    );
    console.log("─".repeat(95));

    for (const svc of SERVICES) {
      let status = "⚪️ STOPPED";
      let pidStr = "-";

      if (existsSync(svc.pidFile)) {
        try {
          const text = readFileSync(svc.pidFile, "utf-8");
          const pid = Number.parseInt(text.trim(), 10);

          if (!Number.isNaN(pid) && (await isRunning(pid))) {
            status = "🟢 RUNNING";
            pidStr = pid.toString();
          } else {
            status = "🔴 STALE";
            pidStr = `${pid} (?)`;
          }
        } catch {
          // Ignore read errors
        }
      }

      console.log(
        svc.name.padEnd(18) +
          svc.cmd.padEnd(25) +
          svc.port.padEnd(12) +
          status.padEnd(15) +
          pidStr.padEnd(10),
      );
    }

    console.log("─".repeat(95));
    console.log(
      "\n💡 Commands: amalfa service servers [start|stop|restart] | amalfa service vector start\n",
    );
  },
});

const BACKGROUND_SERVICES = [
  {
    name: "Vector Daemon",
    cmd: "bun",
    args: ["run", "src/cli/index.ts", "service", "vector", "start"],
  },
  {
    name: "Reranker Daemon",
    cmd: "bun",
    args: ["run", "src/cli/index.ts", "service", "reranker", "start"],
  },
  {
    name: "File Watcher",
    cmd: "bun",
    args: ["run", "src/cli/index.ts", "service", "watcher", "start"],
  },
  {
    name: "Sonar Agent",
    cmd: "bun",
    args: ["run", "src/cli/index.ts", "service", "sonar", "start"],
  },
  {
    name: "Dashboard",
    cmd: "bun",
    args: ["run", "src/cli/index.ts", "service", "dashboard", "start"],
  },
  {
    name: "SSR Docs",
    cmd: "bun",
    args: ["run", "website/ssr-docs/server.ts"],
  },
];

async function manageAllServers(action: "start" | "stop" | "restart") {
  if (action === "stop" || action === "restart") {
    await stopAllInternal();
  }

  if (action === "start" || action === "restart") {
    console.log("🚀 Starting background services...\n");

    for (const svc of BACKGROUND_SERVICES) {
      console.log(`▶️  Starting ${svc.name}...`);
      const child = spawn(svc.cmd, svc.args, {
        detached: true,
        stdio: "ignore",
        cwd: process.cwd(),
      });
      child.unref();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.log("\n✅ All background services triggered.");
    console.log("Run 'amalfa service servers' to check status.");
  }
}

async function stopAllInternal() {
  const STOP_SERVICES = [
    {
      name: "Vector Daemon",
      pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
    },
    {
      name: "Reranker Daemon",
      pidFile: join(AMALFA_DIRS.runtime, "reranker-daemon.pid"),
    },
    { name: "File Watcher", pidFile: join(AMALFA_DIRS.runtime, "daemon.pid") },
    { name: "Sonar Agent", pidFile: join(AMALFA_DIRS.runtime, "sonar.pid") },
    { name: "Dashboard", pidFile: join(AMALFA_DIRS.runtime, "dashboard.pid") },
    { name: "SSR Docs", pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid") },
    { name: "MCP Server", pidFile: join(AMALFA_DIRS.runtime, "mcp.pid") },
  ];

  for (const svc of STOP_SERVICES) {
    if (existsSync(svc.pidFile)) {
      try {
        const pidStr = readFileSync(svc.pidFile, "utf-8").trim();
        const pid = Number.parseInt(pidStr, 10);
        if (!Number.isNaN(pid)) {
          try {
            process.kill(pid, "SIGTERM");
          } catch {
            // Stale
          }
        }
      } catch {
        // Ignore
      }
      try {
        unlinkSync(svc.pidFile);
      } catch {}
    }
  }
}

// Legacy export
export async function cmdServers(args: string[]) {
  if (serversCommand.run) {
    return serversCommand.run({
      rawArgs: args,
      args: { _: args, dot: args.includes("--dot"), action: args[1] } as any,
      cmd: serversCommand,
      data: {},
    });
  }
}
