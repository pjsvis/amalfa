import { DaemonManager } from "@src/utils/DaemonManager";
import { discoverOllamaCapabilities } from "@src/utils/ollama-discovery";
import { defineCommand } from "citty";

export const sonarCommand = defineCommand({
  meta: {
    name: "sonar",
    description: "Manage Sonar AI agent",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform (start|stop|status|restart|chat)",
      default: "status",
    },
  },
  async run({ args }) {
    const { action } = args;
    const manager = new DaemonManager();

    switch (action) {
      case "status": {
        console.log("🔍 Checking status...");
        try {
          const ollama = await discoverOllamaCapabilities();
          if (ollama.available) {
            console.log(
              `✅ Ollama: Running (Model: ${ollama.model}, Size: ${ollama.size})`,
            );
          } else {
            console.log("❌ Ollama: Not detected");
          }
        } catch {
          console.log("❌ Ollama: Check failed");
        }

        const status = await manager.checkSonarAgent();
        if (status.running) {
          console.log(
            `✅ Sonar Agent: Running (PID: ${status.pid}, Port: ${status.port})`,
          );
          try {
            const res = await fetch(`http://localhost:${status.port}/health`);
            const health = await res.json();
            console.log(`   Health: ${JSON.stringify(health)}`);
          } catch {
            console.log("   Health: ⚠️  Unresponsive");
          }
        } else {
          console.log("❌ Sonar Agent: Stopped");
        }
        break;
      }
      case "start": {
        console.log("🚀 Starting Sonar Agent...");
        await manager.startSonarAgent();
        console.log("✅ Sonar Agent started");
        break;
      }
      case "stop": {
        console.log("🛑 Stopping Sonar Agent...");
        await manager.stopSonarAgent();
        console.log("✅ Sonar Agent stopped");
        break;
      }
      case "chat": {
        const { chatLoop } = await import("@src/cli/sonar-chat");
        await chatLoop();
        break;
      }
      case "restart": {
        console.log("🔄 Restarting Sonar Agent...");
        await manager.stopSonarAgent();
        await manager.startSonarAgent();
        console.log("✅ Sonar Agent restarted");
        break;
      }
      default:
        console.error(`❌ Invalid action: ${action}`);
        process.exit(1);
    }
  },
});

// Legacy export
export async function cmdSonar(args: string[]) {
  if (sonarCommand.run) {
    return sonarCommand.run({
      rawArgs: args,
      args: { _: args, action: args[1] || "status" } as any,
      cmd: sonarCommand,
      data: {},
    });
  }
}
