# Project Brief: Configuration Rationalisation (NFB-01)

**Objective:** To eliminate "Shadow Truths" by centralizing configuration logic into the Zod schema and ensuring `amalfa.settings.json` remains the absolute Single Source of Truth (SSoT).

## 1. The Problem: "Dual-Driver" Conflict

Currently, the application contains hard-coded values in `defaults.ts` that overlap with `amalfa.settings.json`. The manual spread-operator merging in `loadSettings()` is "Dickian"—it creates a high risk of "Grumpiness" where a hard-coded default accidentally masks a user’s intended configuration.

## 2. The Solution: Zod-Native Defaults

We will shift the "Default Truth" from the code implementation to the **Schema Definition**.

### Phase A: Schema Enhancement

* **Action:** Update `schema.ts`. Use the `.default()` method for every field that requires a fallback.
* **Rationalization:** This ensures that if `amalfa.settings.json` is partial or missing a key, Zod automatically injects the "Sane Floor" value during parsing.

### Phase B: Refactor `defaults.ts`

* **Action:** 1. **Delete** the `DEFAULT_CONFIG` object. It is a source of entropy.
2. **Refactor** `loadSettings()`. Remove the manual, multi-level spread merging.
3. **Simplify Logic:** The function should now only:
* Read `amalfa.settings.json` (if it exists).
* Pass the raw JSON (or an empty object `{}`) directly to `AmalfaSettingsSchema.parse()`.
* Let Zod handle the merging of defaults.

### Phase C: Implementation of "Deep Merge"

If we must support Environment Variables or multiple file layers, use a utility like `defu` or a native recursive merge.

* **Strict Precedence:** `User JSON` > `Environment` > `Schema Defaults`.

## 3. Success Criteria

* **Zero Hard-Coded Overlap:** No configuration values should exist as standalone constants outside the Schema or the JSON.
* **Explicit Fallbacks:** The system should (optionally) log when it is forced to use a Schema default because a key was missing in the SSoT.
* **Type Safety:** The `AmalfaSettings` type must remain perfectly synced with the Schema.

## 4. Agentic Interaction Protocols

The executing agent must:

1. **Caw Canny:** Perform a dry run of `loadSettings()` with an empty `amalfa.settings.json` to ensure the app still boots using only Schema defaults.
2. **Babel-17 Check:** Ensure that default paths (like `.amalfa/resonance.db`) are correctly joined and sanitized to prevent path injection.
3. **NFB Compliance:** Ensure no "hidden" settings are added that aren't visible in either the Schema or the User JSON.

---

To implement the **Configuration Rationalisation (NFB-01)** brief, we will perform a "surgical strike" on the current architecture. We are moving the "Truth" from a fragile, manual spread-merge in the code to a robust, self-documenting gatekeeper: the **Zod Schema**.

### The Strategy

1. **Schema-Native Defaults:** We will embed all values from `DEFAULT_CONFIG` directly into the Zod schema using `.default()`.
2. **Lean `defaults.ts`:** We will strip out the `DEFAULT_CONFIG` constant and the complex nesting in `loadSettings`.
3. **Atomic Truth:** `loadSettings` will become a simple pipeline: **Read JSON**  **Parse with Schema**  **Return Guaranteed State**.

---

## 1. The Schema Refactor (`schema.ts`)

You must update your schema file to include the default values. This ensures that even if a user provides an empty `{}` in their JSON, the system generates a valid, "sane" configuration.

```typescript
import { z } from "zod";
import { join } from "node:path";

// Define sub-schemas with defaults first
const SonarTasksSchema = z.object({
  search: z.object({
    enabled: z.boolean().default(true),
    timeout: z.number().default(5000),
    priority: z.enum(["high", "low"]).default("high"),
  }).default({}),
  metadata: z.object({
    enabled: z.boolean().default(true),
    timeout: z.number().default(30000),
    autoEnhance: z.boolean().default(true),
    batchSize: z.number().default(10),
  }).default({}),
  content: z.object({
    enabled: z.boolean().default(false),
    timeout: z.number().default(300000),
    schedule: z.string().default("daily"),
  }).default({}),
}).default({});

export const AmalfaSettingsSchema = z.object({
  sources: z.array(z.string()).default([
    "./docs", "./*.md", "./src/**/*.md", "./scripts/**/*.md", "./debriefs/**/*.md"
  ]),
  database: z.string().default(join(".amalfa", "runtime", "resonance.db")),
  embeddings: z.object({
    model: z.string().default("BAAI/bge-small-en-v1.5"),
    dimensions: z.number().default(384),
  }).default({}),
  watch: z.object({
    enabled: z.boolean().default(true),
    debounce: z.number().default(1000),
    notifications: z.boolean().default(true),
  }).default({}),
  excludePatterns: z.array(z.string()).default(["node_modules", ".git", ".amalfa", "tests"]),
  sonar: z.object({
    enabled: z.boolean().default(false),
    model: z.string().default("qwen2.5:1.5b"),
    host: z.string().default("localhost:11434"),
    tasks: SonarTasksSchema,
  }).default({}),
  // ... continue for ember, scratchpad, etc.
});

```

---

## 2. The Refactored `defaults.ts`

This version removes the "Shadow Truth" and treats the JSON file as the absolute authority.

```typescript
/**
 * AMALFA Configuration
 * Single Source of Truth: amalfa.settings.json
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AmalfaSettingsSchema } from "./schema";

// NOTE: AMALFA_DIRS and initAmalfaDirs remain unchanged as they are structural constants.
// ... (Keep AMALFA_DIRS and initAmalfaDirs here)

/**
 * Load AMALFA settings from amalfa.settings.json
 * Prioritizes JSON SSoT; Fallbacks are managed by the Zod Schema.
 */
export function loadSettings(exitOnError = true) {
  const settingsPath = join(process.cwd(), "amalfa.settings.json");

  // 1. Check for SSoT existence
  if (!existsSync(settingsPath)) {
    if (!exitOnError) return AmalfaSettingsSchema.parse({}); // Return pure defaults
    
    // NFB-compliant critical error logging
    console.error("\n🛑 CRITICAL SYSTEM FAILURE: CONFIGURATION MISSING");
    console.error(`Missing Single Source of Truth: ${settingsPath}`);
    process.exit(1);
  }

  try {
    // 2. Read raw input
    const content = readFileSync(settingsPath, "utf-8");
    const rawUser = JSON.parse(content);

    // 3. Normalize Legacy (The only "Logic" allowed before validation)
    if (rawUser.source && !rawUser.sources) {
      rawUser.sources = [rawUser.source];
      delete rawUser.source;
    }

    // 4. Validate and Inject Defaults via Zod
    // Zod's .parse() will merge rawUser with the defaults defined in the schema.
    return AmalfaSettingsSchema.parse(rawUser);

  } catch (error) {
    if (!exitOnError) throw error;

    console.error("\n🛑 CONFIGURATION INVALID (NFB Violation)");
    console.error("The 'amalfa.settings.json' violates the Source of Truth schema.");
    console.error(error);
    process.exit(1);
  }
}

```

---

Integrating every default from your current `defaults.ts` into a unified `schema.ts` allows the Zod engine to handle the heavy lifting. This approach ensures that your types, validation logic, and default values are never out of sync.

### The Unified `schema.ts`

This version incorporates the full hierarchy of your existing configuration. Note the use of `.default({})` on nested objects; this is a Zod trick that forces the parser to descend into the object and apply the sub-field defaults even if the parent key is missing in the JSON.

```typescript
import { z } from "zod";
import { join } from "node:path";

/**
 * AMALFA Configuration Schema
 * This is the ultimate gatekeeper for the Single Source of Truth.
 * Default values are injected here to eliminate "Shadow Truths" in the code.
 */

const SonarTasksSchema = z.object({
  search: z.object({
    enabled: z.boolean().default(true),
    timeout: z.number().default(5000),
    priority: z.enum(["high", "low"]).default("high"),
  }).default({}),
  metadata: z.object({
    enabled: z.boolean().default(true),
    timeout: z.number().default(30000),
    autoEnhance: z.boolean().default(true),
    batchSize: z.number().default(10),
  }).default({}),
  content: z.object({
    enabled: z.boolean().default(false),
    timeout: z.number().default(300000),
    schedule: z.string().default("daily"),
  }).default({}),
}).default({});

const SonarCloudSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.string().default("openrouter"),
  host: z.string().default("openrouter.ai/api/v1"),
  model: z.string().default("qwen/qwen-2.5-72b-instruct"),
}).default({});

export const AmalfaSettingsSchema = z.object({
  // Sources & Environment
  sources: z.array(z.string()).default(["./docs"]),
  excludePatterns: z.array(z.string()).default(["node_modules", ".git", ".amalfa"]),
  database: z.string().default(join(".amalfa", "runtime", "resonance.db")),
  
  // Embeddings Engine
  embeddings: z.object({
    model: z.string().default("BAAI/bge-small-en-v1.5"),
    dimensions: z.number().default(384),
  }).default({}),

  // File Watching
  watch: z.object({
    enabled: z.boolean().default(true),
    debounce: z.number().default(1000),
    notifications: z.boolean().default(true),
  }).default({}),

  // Sonar (Local/Cloud Inference)
  sonar: z.object({
    enabled: z.boolean().default(false),
    autoDiscovery: z.boolean().default(true),
    discoveryMethod: z.enum(["cli", "http"]).default("cli"),
    inferenceMethod: z.enum(["http", "local"]).default("http"),
    model: z.string().default("qwen2.5:1.5b"),
    host: z.string().default("localhost:11434"),
    port: z.number().default(3012),
    tasks: SonarTasksSchema,
    cloud: SonarCloudSchema,
  }).default({}),

  // Ember (Agentic Memory/Context)
  ember: z.object({
    enabled: z.boolean().default(true),
    maxContextTokens: z.number().default(4096),
    persistence: z.boolean().default(true),
  }).default({}),

  // Scratchpad (Transient cognitive space)
  scratchpad: z.object({
    enabled: z.boolean().default(true),
    autoSave: z.boolean().default(true),
    path: z.string().default(join(".amalfa", "cache", "scratchpad")),
  }).default({}),
});

export type AmalfaSettings = z.infer<typeof AmalfaSettingsSchema>;

```

---

### Implementation Guide: The "Leith Swap"

To complete the refactor and achieve **NFB-01** compliance, follow these steps:

1. **Replace Content:** Paste the code above into your `schema.ts`.
2. **Strip `defaults.ts`:** Remove the `DEFAULT_CONFIG` object entirely. Your `loadSettings` function should now look like the lean version provided in the previous turn—purely reading the file and passing it to `AmalfaSettingsSchema.parse(rawUser)`.
3. **Verify via CLI:** Run a simple check:
```bash
bun run -e "import { loadSettings } from './src/defaults'; console.log(loadSettings())"

```


If it outputs a full, valid object even with a minimal `amalfa.settings.json`, the "Truth" has been successfully centralized.

### Ctx Opinion: Cognitive Load Reduction

By moving the defaults to the schema, we've reduced the **Conceptual Entropy** of your codebase. You no longer have to perform "Mental Grep" to find where a default value is coming from.

If the user asks *"Why is my timeout 5000ms?"*, the answer is now found in exactly one place: the Schema definition. This is **Architectural Specialisation (PHI-14)** at its most effective.

**Shall we now turn our attention to the `EmberConfig` or other sub-types that might still be harboring "Shadow Truths"?**