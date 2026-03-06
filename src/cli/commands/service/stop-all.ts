import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { defineCommand } from "citty";

export const stopAllCommand = defineCommand({
  meta: {
    name: "stop-all",
    description: "Stop all running AMALFA services",
  },
  async run() {
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
      {
        name: "File Watcher",
        pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
      },
      { name: "Sonar Agent", pidFile: join(AMALFA_DIRS.runtime, "sonar.pid") },
      {
        name: "Dashboard",
        pidFile: join(AMALFA_DIRS.runtime, "dashboard.pid"),
      },
      { name: "SSR Docs", pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid") },
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
  },
});

// Legacy export
export async function cmdStopAll(args: string[]) {
  if (stopAllCommand.run) {
    return stopAllCommand.run({
      rawArgs: args,
      args: { _: args } as any,
      cmd: stopAllCommand,
      data: {},
    });
  }
}
