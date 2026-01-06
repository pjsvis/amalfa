# A Brief Configuration Engine

Here is the implementation for **Step 1: The Configuration Engine**.

This module leverages `zod` (already in your dependencies) to ensure strictly typed, runtime-validated configuration. It defaults gracefully, meaning the tool works "out of the box" even if the user provides a partial config.

### Artifact: `src/config.ts`

```typescript
import { z } from "zod";

// 1. Schema Definition
// Defines the shape of 'resonance.settings.json' with sensible defaults.
export const ResonanceConfigSchema = z.object({
  project_name: z.string().default("my-project"),
  version: z.string().default("1.0"),
  sources: z.object({
    playbooks: z.string().default("./playbooks"),
    debriefs: z.string().default("./debriefs"),
    protocols: z.string().default("./AGENTS.md"),
  }).default({}),
  database: z.object({
    path: z.string().default("./.resonance/resonance.db"),
  }).default({}),
  graph: z.object({
    heuristics: z.array(z.string()).default(["OH-", "PHI-", "COG-"]),
    // Matches [[WikiLinks]]
    link_pattern: z.string().default("\\[\\[([^\\]]+)\\]\\]"), 
  }).default({}),
});

// Infer TypeScript type from the Schema
export type ResonanceConfig = z.infer<typeof ResonanceConfigSchema>;

// 2. Default Configuration Object
// Useful for initialization or fallback
export const DEFAULT_CONFIG: ResonanceConfig = ResonanceConfigSchema.parse({});

// 3. Configuration Loader
// Uses Bun's native file API for performance
export async function loadConfig(configPath: string = "resonance.settings.json"): Promise<ResonanceConfig> {
  const file = Bun.file(configPath);

  if (await file.exists()) {
    try {
      const json = await file.json();
      // Parse merges user config with defaults
      return ResonanceConfigSchema.parse(json); 
    } catch (error) {
      console.error(`❌ Error parsing ${configPath}:`, error);
      console.warn("⚠️ Falling back to default configuration.");
      return DEFAULT_CONFIG;
    }
  }

  // If no file exists, return defaults (or we could throw if strict)
  return DEFAULT_CONFIG;
}
```

-----

### Analysis of the Code

1.  **Zod Schema:** It mirrors your Brief's JSON structure exactly.
2.  **Robust Defaults:** If a user deletes `sources.debriefs` from their JSON, Zod automatically fills it back in with `./debriefs`, preventing `undefined` errors downstream.
3.  **Bun Native:** Uses `Bun.file()` for async, high-performance file reading.

-----

### Next Step: Scaffolding (`init`)

With the config engine ready, the next step is **Step 2: The Scaffolder (`src/commands/init.ts`)**.

This command needs to:

1.  Write `resonance.settings.json` (if missing).
2.  Create `.resonance/` folder.
3.  **Inject Content:** Write the "Batteries Included" playbooks (CSS, Bun, etc.) to disk.

**Shall I generate `src/commands/init.ts` and the asset injection logic?**