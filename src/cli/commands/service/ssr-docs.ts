import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { defineCommand } from "citty";

// Service configuration for SSR docs server
const SSR_DOCS_CONFIG = {
  name: "SSR-Docs",
  pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid"),
  logFile: join(AMALFA_DIRS.logs, "ssr-docs.log"),
  entryPoint: "website/ssr-docs/server.ts",
};

const ssrDocsLifecycle = new ServiceLifecycle(SSR_DOCS_CONFIG);

export const ssrDocsCommand = defineCommand({
  meta: {
    name: "ssr-docs",
    description: "Manage SSR documentation server",
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

    switch (action) {
      case "status": {
        await ssrDocsLifecycle.status();
        break;
      }
      case "start": {
        console.log("🚀 Starting SSR Docs Server...");
        await ssrDocsLifecycle.start();
        console.log("✅ SSR Docs Server started");
        break;
      }
      case "stop": {
        console.log("🛑 Stopping SSR Docs Server...");
        await ssrDocsLifecycle.stop();
        console.log("✅ SSR Docs Server stopped");
        break;
      }
      case "restart": {
        console.log("🔄 Restarting SSR Docs Server...");
        await ssrDocsLifecycle.stop();
        await new Promise((resolve) => setTimeout(resolve, 500));
        await ssrDocsLifecycle.start();
        console.log("✅ SSR Docs Server restarted");
        break;
      }
      default:
        console.error(`❌ Invalid action: ${action}`);
        process.exit(1);
    }
  },
});

// Legacy export
export async function cmdSsrDocs(args: string[]) {
  if (ssrDocsCommand.run) {
    return ssrDocsCommand.run({
      rawArgs: args,
      args: { _: args, action: args[1] || "status" } as any,
      cmd: ssrDocsCommand,
      data: {},
    });
  }
}
