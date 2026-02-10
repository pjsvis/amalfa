Implementing the **"Semantic UNIX" Agent Orchestration Layer** requires a combination of strict structural contracts and high-level behavioral protocols.

Below is the **Zod Telemetry Schema** to harden your QC process, the updated **`AGENTS.md` protocol**, and the specific **Document Audit** checklist.

---

### **1. The Telemetry Schema (`src/types/telemetry.ts`)**

Following **PHI-5 (Explicit Formulation)**, this schema ensures that every pipeline "Mentation" is empirically measurable and validatable by `jq` and Bun.

```typescript
import { z } from "zod";

/**
 * Amalfa Telemetry Schema: The "Forge" Heartbeat
 * Used to validate intermediate artifacts and stats.jsonl
 */
export const TelemetryStatsSchema = z.object({
  timestamp: z.string().datetime(),
  taskType: z.enum(["lexicon", "audit", "historian", "maintenance"]),
  branch: z.string().describe("The GitButler virtual branch ID"),
  
  // Performance Metrics
  performance: z.object({
    duration_ms: z.number().positive(),
    token_usage: z.number().optional(),
    model: z.string().describe("E.g., ollama/llama3.1 or gpt-4o"),
  }),

  // Structural Integrity (QC)
  integrity: z.object({
    raw_byte_count: z.number().nonnegative(),
    item_count: z.number().nonnegative(),
    jq_status: z.enum(["pass", "fail"]),
    zod_status: z.enum(["pass", "fail"]),
    entropy_score: z.number().min(0).max(1).optional(),
  }),

  // Metadata for the Historian
  context: z.object({
    input_file: z.string(),
    role_version: z.string().describe("Hash or version of the .mods/role file used"),
    commit_sha: z.string().optional(),
  })
});

export type TelemetryStats = z.infer<typeof TelemetryStatsSchema>;

```

---

### **2. Updated `AGENTS.md` Protocol**

This section must be appended to your root `AGENTS.md` to instruct all AI agents on how to use the new orchestration tools correctly.

```markdown
## 🤖 The Weaver Protocol (Semantic Orchestration)

This project uses a "Semantic UNIX" pipeline for knowledge management. Agents must NOT perform raw synthesis for Lexicon or Documentation tasks directly.

### 🛠 Tooling Requirements
- **Thinking:** Use `mods` for non-deterministic synthesis.
- **Hardening:** Always pipe `mods` output into `jq` for structural validation.
- **Isolation:** Use `bin/weave` to isolate all changes in a **GitButler Virtual Branch**.

### 📋 Interaction Rules
1. **Always use bin/weave:** For any task involving Lexicon extraction, Debrief generation, or CDA auditing, run `./bin/weave`.
2. **Commit via Butler:** Never commit directly to `main` for semantic tasks. Allow the orchestrator to create a virtual branch. Review the diff in the UI before merging.
3. **Telemetry is Mandatory:** Ensure the `telemetry/stats.jsonl` is updated at the end of every pipe execution.
4. **Biddability Check:** If a `jq` filter fails during the pipe, stop immediately and refine the `role.md` prompt. Do not try to "fix" the JSON manually in the file.

```

---

### **3. Document Audit & Replacement Checklist**

To fully operationalize this system, update these files in the next session:

| Document | Status | Action Required |
| --- | --- | --- |
| **`docs/setup/DEVELOPER_ONBOARDING.md`** | 🟡 Stale | Add the **Toolbelt Section**: `brew install charmbracelet/tap/mods charmbracelet/tap/gum jq fzf`. |
| **`playbooks/the-weavers-handbook.md`** | 🔴 Needs Creation | **Create:** Define the loop for writing new `.mods/roles/`, testing them with `entr`, and monitoring them with `VisiData`. |
| **`src/core/LexiconHarvester.ts`** | 🟡 Superseded | **Deprecate Logic:** Move the internal regex/parsing logic to a call to `mods --role lexicographer`. Use Zod for final validation. |
| **`website/ssr-docs/templates/dashboard.tsx`** | ⚪ New | **Update:** Add a "Pipeline Health" widget that reads `.mods/telemetry/stats.jsonl`. |
| **`TODO.md`** | 🟢 Active | **Add:** "Integrate GitButler MCP for automated branch lifecycle management in `bin/weave`." |

---

### **Opinion: The Shift to "Industrialized Thinking"**

By persisting these roles and the `weave` script, you have moved from "Chatting with an AI" to **"Operating a Semantic Factory."** * **Reliability:** `jq` acts as a physical barrier. If the AI "dreams," the factory stops.

* **Traceability:** GitButler branches allow you to see the "Thinking" lanes visually.
* **Visibility:** Telemetry allows your UI to become a true Dashboard for "Mental Health" (Conceptual Entropy).

**Next Step:** I can generate the initial **`.mods/CONTRACTS.md`** to specify the exact JSON shapes for your roles if you're ready to lock down the I/O.