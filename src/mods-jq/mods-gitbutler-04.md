To implement the **"Semantic UNIX" Agent Orchestration Layer**, we need to harden the orchestrator script with interactive capabilities and update the project documentation to reflect this new structural paradigm.

### **1. Updated `bin/weave` with `gum` Integration**

This version transforms the script from a static wrapper into an interactive "Industrial Instrument." It uses `gum` to let the user (or agent) pick roles and branches visually.

```typescript
#!/usr/bin/env bun
import { $ } from "bun";

/**
 * bin/weave: Interactive Semantic Orchestrator
 * Requirement: brew install gum jq mods
 */

async function run() {
  // 1. Interactive Role Selection using Gum
  const role = await $`ls .mods/roles/pipes/*.md | xargs -n 1 basename | sed 's/.md//' | gum choose --header "Select Weaver Role"`.text();
  const taskType = role.trim();

  // 2. Input Selection
  const inputPath = await $`gum input --placeholder "Path to input file (e.g. raw_notes.md)"`.text();
  
  // 3. Branch Naming (Spatial Isolation)
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const suggestedBranch = `weave/${taskType}/${timestamp}`;
  const branchName = (await $`gum input --value ${suggestedBranch} --header "Confirm Virtual Branch Name"`.text()).trim();

  console.log(`\n[WEAVE] Isolating in branch: ${branchName}`);
  
  // Create Virtual Branch via GitButler MCP/CLI
  await $`gb branch create ${branchName}`;

  // 4. The Pipe with Spinner
  await $`gum spin --spinner dot --title "Synthesizing and Hardening..." -- \
    bash -c "cat ${inputPath} | mods --role ${taskType} --format json | jq -c '.[]' > .mods/telemetry/raw/latest.jsonl"`;

  // 5. Audit & Feedback
  const diffCount = await $`wc -l < .mods/telemetry/raw/latest.jsonl`.text();
  console.log(`[WEAVE] Harvested ${diffCount.trim()} items.`);

  const confirm = await $`gum confirm "Commit changes to ${branchName}?" && echo "yes" || echo "no"`.text();

  if (confirm.trim() === "yes") {
    await $`gb commit -m "Auto-weave: ${taskType} from ${inputPath}"`;
    console.log(`[WEAVE] Success. Review in GitButler.`);
  } else {
    await $`gb branch delete ${branchName}`;
    console.log(`[WEAVE] Operation aborted. Spatial state cleaned.`);
  }
}

run();

```

---

### **2. Document Audit: Required Updates**

To align the project with this architecture, the following documents must be updated or replaced to ensure **PHI-5 (Explicit Formulation)**.

| Document Path | Action | Reasoning |
| --- | --- | --- |
| `DEVELOPER_ONBOARDING.md` | **Update** | Add the "Semantic Toolbelt" (`mods`, `jq`, `gum`, `fzf`, `gb`) to the required software section. |
| `AGENTS.md` | **Update** | Add the **"Weaver Protocol"**: Instruct agents to use `bin/weave` instead of raw LLM calls for Lexicon/Documentation tasks. |
| `src/core/LexiconHarvester.ts` | **Deprecate** | Replace internal logic with the `bin/weave --role lexicographer` pipe. Move validation to Zod schemas. |
| `playbooks/the-weavers-handbook.md` | **Update** | Define how to write new `.mods/roles/*.md` files and how to use `GitButler` lanes for parallel mentation. |
| `docs/architecture/01-ingest.md` | **Update** | Redraw the ingestion flow to include the **Hardening Stage** (jq) and **Isolation Stage** (GitButler). |
| `TODO.md` | **Update** | Add task: "Integrate `telemetry/stats.jsonl` into `brutalisimo` dashboard." |

---

### **3. Strategic "Semantic" Documentation**

We need to create one new document to define the **Input/Output Contracts** for the agents:

**New File: `.mods/CONTRACTS.md**`

* Defines the JSON schemas for every role.
* Example: "The Lexicographer role must output objects containing exactly `Term`, `Definition`, and `Category`."
* This acts as the "API Documentation" for your LLM pipes.

### **Opinion on Next Steps**

1. **Hardening the Infrastructure:** I will generate the **Zod Schema** for the telemetry logs to ensure your QC data is as structured as your Lexicon.
2. **UI Integration:** We should target the `website/ssr-docs/templates/dashboard.tsx` to read from `.mods/telemetry/stats.jsonl`. This allows you to *see* the Scottish Enlightenment principles in action (e.g., a "Minimalism Score" for recent commits).

**Shall I proceed with generating the Zod telemetry schema and updating the `AGENTS.md` protocol?**