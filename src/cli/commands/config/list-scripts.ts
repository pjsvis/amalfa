import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineCommand } from "citty";

interface ScriptEntry {
  path: string;
  command: string;
  description: string;
  category: string;
  type: "user" | "dev";
}

export const listScriptsCommand = defineCommand({
  meta: {
    name: "list-scripts",
    description: "List available scripts and their descriptions",
  },
  async run() {
    const __dirname = fileURLToPath(new URL(".", import.meta.url));
    const REGISTRY_PATH = join(
      __dirname,
      "../../../config/scripts-registry.json",
    );

    if (!existsSync(REGISTRY_PATH)) {
      console.error(`❌ Registry not found at: ${REGISTRY_PATH}`);
      process.exit(1);
    }

    const scripts = JSON.parse(
      readFileSync(REGISTRY_PATH, "utf-8"),
    ) as ScriptEntry[];
    const grouped: Record<string, ScriptEntry[]> = {};

    const rootDir = join(__dirname, "../../../../");
    const scriptsDir = join(rootDir, "scripts");
    const isDevMode = existsSync(scriptsDir);

    for (const s of scripts) {
      if (!isDevMode && s.type === "dev") continue;
      if (!grouped[s.category]) grouped[s.category] = [];
      grouped[s.category]?.push(s);
    }

    console.log("\n📜 AMALFA Command Registry\n");
    if (isDevMode) {
      console.log("🛠️  Development Mode Detected (showing all repo scripts)\n");
    } else {
      console.log("📦 Production Mode (showing user commands)\n");
    }

    const categories = Object.keys(grouped).sort();

    for (const cat of categories) {
      console.log(`[${cat.toUpperCase()}]`);
      const catScripts = grouped[cat];
      if (catScripts) {
        for (const script of catScripts) {
          console.log(`  $ ${script.command}`);
          console.log(`    ${script.description}`);
          console.log("");
        }
      }
    }
  },
});

// Legacy export
export async function cmdScripts() {
  if (listScriptsCommand.run) {
    return listScriptsCommand.run({
      rawArgs: [],
      args: { _: [] } as any,
      cmd: listScriptsCommand,
      data: {},
    });
  }
}
