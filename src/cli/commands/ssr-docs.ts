import { join } from "node:path";
import { AMALFA_DIRS } from "@src/config/defaults";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";

// Service configuration for SSR docs server
const SSR_DOCS_CONFIG = {
  name: "SSR-Docs",
  pidFile: join(AMALFA_DIRS.runtime, "ssr-docs.pid"),
  logFile: join(AMALFA_DIRS.logs, "ssr-docs.log"),
  entryPoint: "website/ssr-docs/server.ts",
};

const ssrDocsLifecycle = new ServiceLifecycle(SSR_DOCS_CONFIG);

/**
 * Main command handler for SSR docs server
 */
export async function cmdSsrDocs(args: string[]) {
  const action = args[1] || "status";
  const validActions = ["start", "stop", "status", "restart"];

  if (!validActions.includes(action)) {
    console.error(`❌ Invalid action: ${action}`);
    console.error("\nUsage: amalfa ssr-docs <start|stop|status|restart>");
    process.exit(1);
  }

  if (action === "status") {
    await ssrDocsLifecycle.status();
    return;
  }

  if (action === "start") {
    console.log("🚀 Starting SSR Docs Server...");
    try {
      await ssrDocsLifecycle.start();
      console.log("✅ SSR Docs Server started");
    } catch (e) {
      console.error("❌ Failed to start SSR Docs Server:", e);
      process.exit(1);
    }
    return;
  }

  if (action === "stop") {
    console.log("🛑 Stopping SSR Docs Server...");
    try {
      await ssrDocsLifecycle.stop();
      console.log("✅ SSR Docs Server stopped");
    } catch (e) {
      console.error("❌ Failed to stop SSR Docs Server:", e);
      process.exit(1);
    }
    return;
  }

  if (action === "restart") {
    console.log("🔄 Restarting SSR Docs Server...");
    try {
      await ssrDocsLifecycle.stop();
      await new Promise((resolve) => setTimeout(resolve, 500));
      await ssrDocsLifecycle.start();
      console.log("✅ SSR Docs Server restarted");
    } catch (e) {
      console.error("❌ Failed to restart SSR Docs Server:", e);
      process.exit(1);
    }
    return;
  }
}
