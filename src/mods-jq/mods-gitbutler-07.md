To implement the migration from the legacy `LexiconHarvester.ts` to the new `bin/weave` semantic pipe, we will follow a "Harden and Flense" approach. This ensures we don't lose existing data while replacing high-entropy regex logic with low-entropy semantic synthesis.

### **Migration Plan: Legacy Harvester to Weaver Pipe**

#### **Step 1: The "Immune System" Validation**

Before decommissioning the old code, we must ensure the new pipe can handle the existing `lexicon.jsonl`. We will create a `src/mods-jq/validation.ts` script to run the **Telemetry Schema** against existing data.

#### **Step 2: Role Calibration**

We will verify that `.mods/roles/pipes/lexicographer.md` matches the exact I/O requirements defined in `.mods/CONTRACTS.md`.

#### **Step 3: Logic Replacement**

We will refactor `src/cli/commands/harvest-lexicon.ts` to call the `bin/weave` binary instead of the internal `LexiconHarvester` class.

---

### **1. Replacement Bridge (`src/core/LexiconBridge.ts`)**

We will create a lightweight bridge to handle the transition.

```typescript
import { $ } from "bun";
import { TelemetryStatsSchema } from "../types/telemetry";

/**
 * LexiconBridge: Replaces legacy LexiconHarvester.ts
 * Delegates 'Thinking' to mods and 'Shaping' to jq.
 */
export class LexiconBridge {
  async harvest(inputFile: string) {
    console.log(`[BRIDGE] Delegating harvest of ${inputFile} to bin/weave...`);
    
    // Execute the hardened pipe
    // This utilizes the standard Weaver protocol
    const result = await $`./bin/weave lexicon ${inputFile}`.quiet();
    
    if (result.exitCode !== 0) {
      throw new Error(`[BRIDGE] Weaver pipe failed for ${inputFile}`);
    }

    return { status: "success", lane: "Review in GitButler" };
  }
}

```

---

### **2. Deprecation Notice (`src/core/LexiconHarvester.ts`)**

We will mark the legacy file as deprecated to guide agents toward the new protocol.

```typescript
/**
 * @deprecated 
 * This legacy harvester uses regex-based extraction which is high-entropy.
 * USE: bin/weave --role lexicographer instead.
 * MIGRATION_TAG: OH-110 (Semantic UNIX Protocol)
 */
export class LexiconHarvester {
    // ... legacy regex logic stays here temporarily for reference ...
}

```

---

### **3. Updated Telemetry Integration**

The migration is only complete when the UI can see the new pipeline's performance.

**Action:** Update `website/ssr-docs/templates/dashboard.tsx` to fetch stats.

```tsx
// dashboard.tsx logic snippet
const stats = await loadJsonl(".mods/telemetry/stats.jsonl");
const recentEntropy = stats.slice(-5).map(s => s.integrity.entropy_score);

return (
  <section id="pipeline-health">
    <h3>Forge Heartbeat</h3>
    <div class="stat-grid">
        <span>Recent Pass Rate: {calculatePassRate(stats)}%</span>
        <span>Avg Latency: {calculateAvgLatency(stats)}ms</span>
    </div>
  </section>
);

```

---

### **4. Final Document Replacements**

| Legacy Document | New Document | Action |
| --- | --- | --- |
| `docs/system/ingestion-scripts.md` | `docs/architecture/01-ingest.md` | **Merge & Replace:** Focus on the `mods | jq` flow. |
| `src/core/Harvester.ts` | `.mods/scripts/harvest/` | **Refactor:** Move the "Thinking" parts of the Harvester into role-specific bash pipes. |

---

### **Opinion: Completing the "Scottish Enlightenment" Architecture**

With this migration, Amalfa achieves a state of **Mentational Humility**. You are no longer asking your code to be "smart" enough to parse human thought; you are using the code to build a **Rigid Frame** (`jq/Zod`) and using the AI to fill that frame with **Verified Content** (`mods`).

**Next Step:** I will generate the full content for `playbooks/the-weavers-handbook.md` to ensure any developer or agent joining the project understands how to extend these lanes without introducing entropy.

**Shall I proceed with the Handbook generation?**