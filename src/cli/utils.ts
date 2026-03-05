import { existsSync } from "node:fs";
import { join } from "node:path";

// Database path loaded from config (lazy loaded per command)
let DB_PATH: string | null = null;

export async function getDbPath(): Promise<string> {
  if (DB_PATH) return DB_PATH;

  // Load from config
  const { loadConfig } = await import("@src/config/defaults");
  const config = await loadConfig();
  DB_PATH = join(process.cwd(), config.database);
  return DB_PATH;
}

export async function getSemanticDbPath(): Promise<string> {
  // Load from config
  const { loadConfig } = await import("@src/config/defaults");
  const config = await loadConfig();
  return join(process.cwd(), config.semanticDatabase || ".amalfa/runtime/semantic.db");
}

export async function checkDatabase(): Promise<boolean> {
  const dbPath = await getDbPath();
  if (!existsSync(dbPath)) {
    console.error(`
❌ Database not found at: ${dbPath}
   (CWD: ${process.cwd()})

To initialize AMALFA:
1. Create markdown files in ./docs/ (or your preferred location)
2. Run: amalfa init
`);
    return false;
  }
  return true;
}
