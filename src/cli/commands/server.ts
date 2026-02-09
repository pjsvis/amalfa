import { spawn } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { checkDatabase, getDbPath } from "../utils";

export async function cmdServe(_args: string[]) {
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
}

export async function cmdServers(args: string[]) {
  const action = args[1];
  // If action is provided and isn't a flag (like --dot), treat it as a lifecycle command
  if (
    action &&
    !action.startsWith("-") &&
    ["start", "stop", "restart", "status"].includes(action)
  ) {
    if (action === "status") {
      // Just fall through to normal status display
    } else {
      await manageAllServers(action as "start" | "stop" | "restart");
      return;
    }
  }

  const showDot = args.includes("--dot");

  const SERVICES = [
    {
      name: "MCP Server",
      pidFile: join(AMALFA_DIRS.runtime, "mcp.pid"),
      port: "stdio",
      id: "mcp",
      cmd: "amalfa serve",
    },
    {
      name: "Vector Daemon",
      pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
      port: "3010",
      id: "vector",
      cmd: "amalfa vector start",
    },
    {
      name: "Reranker Daemon",
      pidFile: join(AMALFA_DIRS.runtime, "reranker-daemon.pid"),
      port: "3011",
      id: "reranker",
      cmd: "amalfa reranker start",
    },
    {
      name: "File Watcher",
      pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
      port: "-",
      id: "watcher",
      cmd: "amalfa daemon start",
    },
    {
      name: "Sonar Agent",
      pidFile: join(AMALFA_DIRS.runtime, "sonar.pid"),
      port: "3012",
      id: "sonar",
      cmd: "amalfa sonar start",
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

  if (showDot) {
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
    console.log("  // Database");
    console.log(
      '  db [label="SQLite\\n.amalfa/resonance.db", shape=cylinder, fillcolor=lightyellow];',
    );
    console.log("");
    console.log("  // Connections");
    console.log('  mcp -> db [label="read/write"];');
    console.log('  vector -> db [label="embeddings"];');
    console.log('  watcher -> db [label="updates"];');
    console.log('  mcp -> vector [label="query", style=dashed];');
    console.log('  vector -> reranker [label="rerank", style=dashed];');
    console.log("}");
    console.log("");
    console.log("# Save to file: amalfa servers --dot > amalfa.dot");
    console.log("# Render: dot -Tpng amalfa.dot -o amalfa.png");
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
    "\n💡 Commands: amalfa servers [start|stop|restart] | amalfa vector start | amalfa daemon start\n",
  );
}

// Background services to manage via 'amalfa servers start/restart'
const BACKGROUND_SERVICES = [
  {
    name: "Vector Daemon",
    cmd: "bun",
    args: ["run", "src/cli.ts", "vector", "start"],
  },
  {
    name: "Reranker Daemon",
    cmd: "bun",
    args: ["run", "src/cli.ts", "reranker", "start"],
  },
  {
    name: "File Watcher",
    cmd: "bun",
    args: ["run", "src/cli.ts", "daemon", "start"],
  },
  {
    name: "Sonar Agent",
    cmd: "bun",
    args: ["run", "src/cli.ts", "sonar", "start"],
  },
  {
    name: "SSR Docs",
    cmd: "bun",
    args: ["run", "website/ssr-docs/server.ts"],
  },
];

async function manageAllServers(action: "start" | "stop" | "restart") {
  if (action === "stop" || action === "restart") {
    await cmdStopAll([]);
  }

  if (action === "start" || action === "restart") {
    console.log("🚀 Starting background services...\n");

    for (const svc of BACKGROUND_SERVICES) {
      console.log(`▶️  Starting ${svc.name}...`);
      const child = spawn(svc.cmd, svc.args, {
        detached: true,
        stdio: "ignore", // Daemons manage their own logs
        cwd: process.cwd(),
      });
      child.unref();
      // Brief pause to allow pid file creation / logging
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    console.log("\n✅ All background services triggered.");
    console.log("Run 'amalfa servers' to check status.");
  }
}

export async function cmdStopAll(_args: string[]) {
  console.log("🛑 Stopping ALL Amalfa Services...\n");

  const SERVICES = [
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
    { name: "SSR Docs", pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid") },
    // MCP usually runs as stdio, but if we track a PID file for it:
    { name: "MCP Server", pidFile: join(AMALFA_DIRS.runtime, "mcp.pid") },
  ];

  let stoppedCount = 0;

  for (const svc of SERVICES) {
    if (existsSync(svc.pidFile)) {
      try {
        const pidStr = readFileSync(svc.pidFile, "utf-8").trim();
        const pid = Number.parseInt(pidStr, 10);

        if (!Number.isNaN(pid)) {
          // Check if running
          try {
            process.kill(pid, 0); // Check existence
            process.kill(pid, "SIGTERM");
            console.log(`✅ Sent SIGTERM to ${svc.name} (PID: ${pid})`);
            stoppedCount++;
          } catch {
            // Not running, just stale
            console.log(`🧹 Cleaning stale PID file for ${svc.name}`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Failed to stop ${svc.name}:`, e);
      }
      // Always clean up PID file
      try {
        unlinkSync(svc.pidFile);
      } catch {}
    }
  }

  if (stoppedCount === 0) {
    console.log("✨ No active services found.");
  } else {
    console.log(`\n✅ Stopped ${stoppedCount} service(s).`);
  }
}
