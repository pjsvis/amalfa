import { DaemonManager } from "@src/utils/DaemonManager";
import { defineCommand } from "citty";

export const rerankerCommand = defineCommand({
  meta: {
    name: "reranker",
    description: "Manage reranker daemon",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform (start|stop|status|restart)",
      default: "status",
    },
  },
  async run({ args }) {
    const { action } = args;
    const manager = new DaemonManager();

    switch (action) {
      case "status": {
        const status = await manager.checkRerankerDaemon();
        if (status.running) {
          console.log(
            `✅ Reranker Daemon: Running (PID: ${status.pid}, Port: ${status.port})`,
          );
        } else {
          console.log("❌ Reranker Daemon: Stopped");
        }
        break;
      }
      case "start": {
        console.log("🚀 Starting Reranker Daemon...");
        await manager.startRerankerDaemon();
        console.log("✅ Reranker Daemon started");
        break;
      }
      case "stop": {
        console.log("🛑 Stopping Reranker Daemon...");
        await manager.stopRerankerDaemon();
        console.log("✅ Reranker Daemon stopped");
        break;
      }
      case "restart": {
        console.log("🔄 Restarting Reranker Daemon...");
        await manager.stopRerankerDaemon();
        await manager.startRerankerDaemon();
        console.log("✅ Reranker Daemon restarted");
        break;
      }
      default:
        console.error(`❌ Invalid action: ${action}`);
        process.exit(1);
    }
  },
});

// Legacy export
export async function cmdReranker(args: string[]) {
  if (rerankerCommand.run) {
    return rerankerCommand.run({
      rawArgs: args,
      args: { _: args, action: args[1] || "status" } as any,
      cmd: rerankerCommand,
      data: {},
    });
  }
}
