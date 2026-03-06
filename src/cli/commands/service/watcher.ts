import { DaemonManager } from "@src/utils/DaemonManager";
import { defineCommand } from "citty";

export const watcherCommand = defineCommand({
  meta: {
    name: "watcher",
    description: "Manage file watcher daemon",
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
        const status = await manager.checkFileWatcher();
        if (status.running) {
          console.log(`✅ File Watcher: Running (PID: ${status.pid})`);
        } else {
          console.log("❌ File Watcher: Stopped");
        }
        break;
      }
      case "start": {
        console.log("🚀 Starting File Watcher...");
        await manager.startFileWatcher();
        console.log("✅ File Watcher started");
        break;
      }
      case "stop": {
        console.log("🛑 Stopping File Watcher...");
        await manager.stopFileWatcher();
        console.log("✅ File Watcher stopped");
        break;
      }
      case "restart": {
        console.log("🔄 Restarting File Watcher...");
        await manager.stopFileWatcher();
        await manager.startFileWatcher();
        console.log("✅ File Watcher restarted");
        break;
      }
      default:
        console.error(`❌ Invalid action: ${action}`);
        process.exit(1);
    }
  },
});

// Legacy export
export async function cmdWatcher(args: string[]) {
  if (watcherCommand.run) {
    return watcherCommand.run({
      rawArgs: args,
      args: { _: args, action: args[1] || "status" } as any,
      cmd: watcherCommand,
      data: {},
    });
  }
}
