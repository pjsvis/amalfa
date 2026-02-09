/**
 * AMALFA Configuration
 * Single Source of Truth: amalfa.settings.json
 *
 * NFB-01: Configuration Rationalisation
 * - DEFAULT_CONFIG has been removed (was a source of "Shadow Truths")
 * - loadSettings() delegates all merging to Zod's .parse()
 * - See schema.ts for all default values
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { type AmalfaSettings, AmalfaSettingsSchema } from "./schema";

/** AMALFA directory structure */
export const AMALFA_DIRS = {
  base: ".amalfa",
  get logs() {
    return join(this.base, "logs");
  },
  get runtime() {
    return join(this.base, "runtime");
  },
  get agent() {
    return join(this.base, "agent");
  },
  get cache() {
    return join(this.base, "cache");
  },
  get scratchpad() {
    return join(this.base, "cache", "scratchpad");
  },
  get tasks() {
    return {
      pending: join(this.base, "agent", "tasks", "pending"),
      processing: join(this.base, "agent", "tasks", "processing"),
      completed: join(this.base, "agent", "tasks", "completed"),
    };
  },
} as const;

/** Initialize AMALFA directory structure */
export function initAmalfaDirs(): void {
  const dirs = [
    AMALFA_DIRS.base,
    AMALFA_DIRS.logs,
    AMALFA_DIRS.runtime,
    AMALFA_DIRS.cache,
    AMALFA_DIRS.scratchpad,
    AMALFA_DIRS.tasks.pending,
    AMALFA_DIRS.tasks.processing,
    AMALFA_DIRS.tasks.completed,
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

// Re-export types from schema
export type {
  AmalfaConfig,
  AmalfaSettings,
  EmberConfig,
  FixturesConfig,
  GraphConfig,
  LangExtractConfig,
  ScratchpadConfig,
  SonarConfig,
} from "./schema";

// Re-export SubstrateError
export { SubstrateError, type SubstrateFailure } from "./schema";

/**
 * Load AMALFA settings from amalfa.settings.json
 *
 * NFB-01: This function delegates all default injection to Zod's .parse().
 * The schema.ts file is the Single Source of Truth for all default values.
 *
 * Precedence: User JSON > Schema Defaults
 */
export function loadSettings(exitOnError = true): AmalfaSettings {
  const settingsPath = join(process.cwd(), "amalfa.settings.json");

  // Check for SSoT existence
  if (!existsSync(settingsPath)) {
    if (!exitOnError) {
      // Return pure schema defaults (for testing or CLI with --help)
      return AmalfaSettingsSchema.parse({});
    }

    // NFB-compliant critical error logging
    console.error("\n🛑 CRITICAL SYSTEM FAILURE: CONFIGURATION MISSING");
    console.error("==================================================");
    console.error("The Single Source of Truth file is missing:");
    console.error(`   ${settingsPath}`);
    console.error("--------------------------------------------------");
    console.error("The system cannot operate without this file.");
    console.error("To fix this immediately:");
    console.error("   cp amalfa.settings.example.json amalfa.settings.json");
    console.error("==================================================\n");
    process.exit(1);
  }

  try {
    // Read raw input from SSoT
    const content = readFileSync(settingsPath, "utf-8");
    const rawUser = JSON.parse(content);

    // Normalize Legacy (The only "Logic" allowed before validation)
    // Convert legacy 'source' to 'sources' array
    if (rawUser.source && !rawUser.sources) {
      rawUser.sources = [rawUser.source];
      delete rawUser.source;
    }
    if (!rawUser.sources || rawUser.sources.length === 0) {
      rawUser.sources = ["./docs"];
    }

    // Validate and Inject Defaults via Zod
    // Zod's .parse() will merge rawUser with the defaults defined in the schema.
    return AmalfaSettingsSchema.parse(rawUser);
  } catch (error) {
    if (!exitOnError) throw error;

    console.error("\n🛑 CONFIGURATION INVALID");
    console.error("==================================================");
    console.error(
      "The 'amalfa.settings.json' violates the Source of Truth schema.",
    );
    console.error("Please fix the errors below:");
    console.error("--------------------------------------------------");
    console.error(error);
    console.error("==================================================\n");
    process.exit(1);
  }
}

// Backward compatibility alias
export const loadConfig = loadSettings;
