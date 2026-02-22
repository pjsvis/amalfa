To implement the final stage of this real-world test, we will create a **"Slim Lexicon"** utility. This ensures the `mods` pipeline remains token-efficient while maintaining the semantic gravity of the Ctx persona.

Following **PHI-14 (Architectural Specialisation)**, we colocate this utility within the intelligence service directory.

### 1. The Lexicon Slimmer (`scripts/services/slim-lexicon.ts`)

This script extracts only the core definitions required for high-quality mentation, stripping metadata that the LLM doesn't need for distillation.

```typescript
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const INTEL_DIR = join(homedir(), ".amalfa", "intel");
const SOURCE_LEXICON = "conceptual-lexicon-ref-v1.79.json"; // Path to your master file
const TARGET_LEXICON = join(INTEL_DIR, "conceptual-lexicon.json");

function slim() {
  try {
    const raw = JSON.parse(readFileSync(SOURCE_LEXICON, "utf-8"));
    
    // Filter for core concepts and operational heuristics only
    const slimmed = {
      version: raw.lexicon_version,
      entries: raw.entries
        .filter((e: any) => ["Core Concept", "Operational Heuristic"].includes(e.Category))
        .map((e: any) => ({
          term: e.Term,
          definition: e.Definition
        }))
    };

    writeFileSync(TARGET_LEXICON, JSON.stringify(slimmed, null, 2));
    console.log(`[Lexicon] Slimmed version deployed to ${TARGET_LEXICON}`);
  } catch (e) {
    console.error("[Lexicon] Slimming failed. Ensure master file is present.");
  }
}

slim();

```

### 2. Final Implementation Brief (Project Milestone)

```markdown
---
date: 2026-02-10
tags: [milestone, service, charm, wui, lexicon]
status: deployment-ready
---

## Task: Integrated Daily Intelligence Sidecar (V1)

**Objective:** Deploy a self-contained AI news pipeline that leverages the Charm toolchain for TUI "forging" and the SSR server for WUI "display," grounded by a colocated Conceptual Lexicon.

- [x] [Service] `intel-fetcher.ts` aggregates raw JSONL to `~/.amalfa/intel`.
- [x] [Forge] `bin/amalfa-intel` uses `gum` and `mods` to create Distilled Artifacts.
- [x] [Persona] `slim-lexicon.ts` ensures `mods` uses terms like 'Mentation' correctly.
- [x] [Gallery] `src/components/IntelligenceCard.tsx` renders artifacts in the WUI.
- [x] [Route] `api/server.ts` provides a `/intel` endpoint for global project access.

## Interaction Flow:
1. **Cron/Manual:** `bun run scripts/services/intel-fetcher.ts`
2. **Mentation:** `amalfa-intel` (In Terminal)
3. **Observation:** Refresh Dashboard -> `/intel` (In Browser)

## Technical Notes:
- **Zero Ingestion:** Preserves graph integrity during the 7-day test period.
- **Colocation:** Service is fully portable within `~/.amalfa/intel/`.
- **Brutalisimo:** UI adheres to monochromatic, industrial standards.

```

### 3. Opinion: The "Intelligence Resonance"

By colocating the lexicon, you have effectively created a **Semantic Sidecar**. This setup allows the intelligence service to "resonate" with your project without actually being "part" of it.

If, after 7 days, you find that the **Hollow Nodes** identified by the service are consistently valuable, we can then implement a "Promotion" command: `amalfa intel promote 2026-02-10`. This would follow **OH-103 (Version Gap-Analysis)** to move the "Thing" from the sidecar into your permanent project nodes.

**The test environment is now fully architected. You can begin the Day 1 fetch at your discretion.**