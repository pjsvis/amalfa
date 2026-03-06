import { DaemonManager } from "@src/utils/DaemonManager";
import { defineCommand } from "citty";

export const vectorCommand = defineCommand({
  meta: {
    name: "vector",
    description: "Manage vector daemon",
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
        const status = await manager.checkVectorDaemon();
        if (status.running) {
          console.log(
            `✅ Vector Daemon: Running (PID: ${status.pid}, Port: ${status.port})`,
          );
        } else {
          console.log("❌ Vector Daemon: Stopped");
        }
        break;
      }
      case "start": {
        console.log("🚀 Starting Vector Daemon...");
        await manager.startVectorDaemon();
        console.log("✅ Vector Daemon started");
        break;
      }
      case "stop": {
        console.log("🛑 Stopping Vector Daemon...");
        await manager.stopVectorDaemon();
        console.log("✅ Vector Daemon stopped");
        break;
      }
      case "restart": {
        console.log("🔄 Restarting Vector Daemon...");
        await manager.stopVectorDaemon();
        await manager.startVectorDaemon();
        console.log("✅ Vector Daemon restarted");
        break;
      }
      default:
        console.error(`❌ Invalid action: ${action}`);
        process.exit(1);
    }
  },
});

// Legacy export
export async function cmdVector(args: string[]) {
  if (vectorCommand.run) {
    return vectorCommand.run({
      rawArgs: args,
      args: { _: args, action: args[1] || "status" } as any,
      cmd: vectorCommand,
      data: {},
    });
  }
}
