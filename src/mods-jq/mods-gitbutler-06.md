To implement the final architectural stage of the **"Weave & Forge"** engine, we will establish the formal I/O contracts. These contracts act as the "API Specification" for your AI agents, ensuring that every transformation stage is strictly validatable by `jq` and `Zod`.

I have generated the `.mods/CONTRACTS.md` file below, followed by the specific task-based schemas.

---

### **1. Persisted Contract Specification**

**Path:** `.mods/CONTRACTS.md`

```markdown
# 📜 Semantic I/O Contracts
**Version:** 1.0  
**Status:** ENFORCED  
**Objective:** Define the strict JSON structures required for every Weaver Role to ensure pipeline compatibility and automated QC.

## 🛠 General Requirements
- **Format:** All outputs must be raw JSON. NO markdown backticks (unless requested for a specific non-JSON field).
- **Quoting:** Follow OH-083 (Single quotes for internal strings, double quotes for JSON structure).
- **Validation:** Every output is piped through `jq`. If `jq` returns an error, the pipeline halts.

## 🏗 Role-Specific Contracts

### 1. Lexicographer (`roles/pipes/lexicographer.md`)
**Input:** Unstructured project text.  
**Output:** JSON Array of objects.
```json
[
  {
    "Term": "string",
    "Definition": "string",
    "Category": "Core Concept | Operational Heuristic",
    "Status": "active",
    "Tags": ["string"]
  }
]

```

### 2. Protocol Auditor (`roles/core/auditor.md`)

**Input:** Any project artifact.

**Output:** Single JSON object.

```json
{
  "compliant": "boolean",
  "score": "number (0.0 to 1.0)",
  "violations": ["string"],
  "entropy_mitigation": "string"
}

```

### 3. Pipeline Historian (`roles/pipes/historian.md`)

**Input:** Git logs and telemetry.

**Output:** Markdown with an embedded JSON metadata block.

```json
{
  "session_summary": "string",
  "artifacts_created": ["string"],
  "total_entropy_reduced": "number"
}

```

```

---

### **2. Orchestration Hardening: The "Weaver’s Handbook"**
To finalize the "Industrialized Thinking" workflow, we need a playbook that teaches agents how to maintain this new infrastructure.

**New File: `playbooks/the-weavers-handbook.md`**
```markdown
# 🧶 The Weaver's Handbook: Pipeline Operations

## 📋 Overview
This playbook defines how to operate the "Weave & Forge" engine. We use a **Semantic UNIX** approach: Thinking (`mods`), Shaping (`jq`), and Isolation (`GitButler`).

## 🔄 The Iteration Loop
When a Role (prompt) fails to produce valid JSON:
1. **Analyze the Failure:** Run `bin/weave` and check the `telemetry/stats.jsonl` error.
2. **Refine the Role:** Open `.mods/roles/pipes/[role].md` and add more explicit constraints (PHI-5).
3. **Live Test:** Use `ls .mods/roles/*.md | entr ./bin/weave --test` to verify the fix.

## 📊 Monitoring
Use **VisiData** for deep analysis of pipeline performance:
`vd .mods/telemetry/stats.jsonl`

Look for:
- High `latency` in local models (suggests a need for tier-escalation).
- Low `zod_status` pass rates (suggests "Conceptual Drift" in the substrate).

## 🛡 Safety Protocols
- **OH-077 Enforcement:** The `bin/weave` script will always prompt via `gum` before merging a Virtual Branch.
- **Deductive Minimalism:** When refining roles, always remove unnecessary adjectives to lower the `entropy_score`.

```

---

### **3. Strategic Opinion: "Spatial Intelligence" is Live**

By integrating **GitButler**, **mods**, and **jq**, you have created a system where:

1. **Thinking is isolated:** No "hallucination" can break your `main` branch code.
2. **Logic is hardened:** `jq` and `Zod` act as the binary gatekeepers for your database.
3. **UI is empowered:** Your `brutalisimo` dashboard now has a real-time feed of the "Forge's" heartbeat through the `telemetry/stats.jsonl`.

### **Final Recommendation**

I suggest we now **deprecate the legacy logic** in `src/core/LexiconHarvester.ts`. Its internal regex-based extraction is high-entropy and brittle compared to the new `./bin/weave --role lexicographer` pipe.

**Shall I draft the migration plan to replace the legacy Harvester with the new `weave` pipe?**