import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { defineCommand } from "citty";

const PID_FILE = join(AMALFA_DIRS.runtime, "dashboard.pid");
const PORT = 3013;

export const dashboardCommand = defineCommand({
  meta: {
    name: "dashboard",
    description: "Manage AMALFA web dashboard",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform (start|stop|restart|status|open)",
      default: "status",
    },
  },
  async run({ args }) {
    const { action } = args;

    switch (action) {
      case "start":
        await startDashboard();
        break;
      case "stop":
        await stopDashboard();
        break;
      case "restart":
        await stopDashboard();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await startDashboard();
        break;
      case "status":
        await showStatus();
        break;
      case "open":
        await openDashboard();
        break;
      default:
        console.log(
          "Usage: amalfa service dashboard [start|stop|restart|status|open]",
        );
        process.exit(1);
    }
  },
});

async function startDashboard() {
  if (existsSync(PID_FILE)) {
    const pid = readFileSync(PID_FILE, "utf-8").trim();
    console.log(`⚠️  Dashboard may already be running (PID: ${pid})`);
    console.log("   Run 'amalfa service dashboard stop' first if needed.");
    return;
  }

  console.log("🚀 Starting dashboard...");

  const child = spawn("bun", ["run", "src/services/dashboard-daemon.ts"], {
    detached: true,
    stdio: "ignore",
    cwd: process.cwd(),
  });

  child.unref();

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (existsSync(PID_FILE)) {
    const pid = readFileSync(PID_FILE, "utf-8").trim();
    console.log(`✅ Dashboard started (PID: ${pid})`);
    console.log(`   View at: http://localhost:${PORT}`);
  } else {
    console.log("❌ Failed to start dashboard");
  }
}

async function stopDashboard() {
  if (!existsSync(PID_FILE)) {
    console.log("⚠️  Dashboard is not running");
    return;
  }

  const pid = readFileSync(PID_FILE, "utf-8").trim();
  console.log(`🛑 Stopping dashboard (PID: ${pid})...`);

  try {
    process.kill(Number(pid), "SIGTERM");
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log("✅ Dashboard stopped");
  } catch (err) {
    console.log("❌ Failed to stop dashboard:", err);
  }
}

async function showStatus() {
  if (existsSync(PID_FILE)) {
    const pid = readFileSync(PID_FILE, "utf-8").trim();
    console.log(`✅ Dashboard is running`);
    console.log(`   PID: ${pid}`);
    console.log(`   URL: http://localhost:${PORT}`);
  } else {
    console.log("⚠️  Dashboard is not running");
    console.log("   Run 'amalfa service dashboard start' to start it");
  }
}

async function openDashboard() {
  if (!existsSync(PID_FILE)) {
    console.log("⚠️  Dashboard is not running. Starting it now...");
    await startDashboard();
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const url = `http://localhost:${PORT}`;
  console.log(`🌐 Opening dashboard: ${url}`);

  // macOS
  Bun.spawnSync(["open", url]);
}

// Legacy export
export async function cmdDashboard(args: string[]) {
  if (dashboardCommand.run) {
    return dashboardCommand.run({
      rawArgs: args,
      args: { _: args, action: args[0] || "status" } as any,
      cmd: dashboardCommand,
      data: {},
    });
  }
}
