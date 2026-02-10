# 🧶 The Weaver's Handbook: Semantic Pipeline Operations

## 📋 Overview
Project Amalfa utilizes a **Semantic UNIX** architecture. We treat Large Language Models as non-deterministic "Synthesis Engines" that must be wrapped in deterministic "Hardening Shells." 

The goal is the transformation of **Stuff** (unstructured data) into **Things** (validated, schema-compliant JSONL).

## 🛠 The Weaver's Toolbelt
The following CLI binaries are mandatory for all operations:
- `mods`: The synthesis engine (Thinking).
- `jq`: The structural linter (Shaping).
- `gum`: The interactive interface (UX).
- `gb` (GitButler): The spatial isolator (State Management).
- `fzf`: The retrieval mechanism (Sensing).

## 🔄 The Standard Protocol (OH-110)
Every semantic task must follow the **Extraction -> Synthesis -> Hardening -> Validation** loop.

### 1. Spatial Isolation
Before starting any mentation, isolate the work in a **GitButler Virtual Branch**.
```bash
# Handled by bin/weave automatically
gb branch create weave/task-name

```

*Principle:* Never let unhardened AI output touch the `main` branch.

### 2. Semantic Synthesis

Invoke `mods` using a specific role from `.mods/roles/`.

```bash
cat input.md | mods --role lexicographer --format json

```

*Constraint:* Always use `--format json` to minimize substrate drift.

### 3. Structural Hardening

Immediately pipe the output through `jq`. If the structure is invalid, the pipe must fail.

```bash
mods_output | jq -c '.[] | {Term, Definition, Category}'

```

*Principle:* If it isn't valid JSON, it doesn't exist.

### 4. Telemetry Capture

Record every execution in `.mods/telemetry/stats.jsonl`.

* Track `latency`.
* Track `entropy_score` (provided by the Auditor role).
* Track `model_tier`.

## 🧪 Developing New Roles

When creating a new role in `.mods/roles/pipes/`:

1. **Reference the CDA:** Explicitly cite directives like PHI-5 or COG-12 in the role prompt.
2. **Define the Schema:** Add the expected JSON shape to `.mods/CONTRACTS.md`.
3. **Live Testing:** Use `entr` to re-run the pipe on every file save:
```bash
ls .mods/roles/*.md | entr ./bin/weave --test

```



## 📊 Quality Control (QA/QC)

Use **VisiData** to analyze the telemetry stream:

```bash
vd .mods/telemetry/stats.jsonl

```

**Failure Patterns to Watch For:**

* **Hallucination Spikes:** Frequent `jq` failures indicate the role prompt is too ambiguous.
* **Narrative Bloat:** Low minimalism scores (from the Auditor) indicate the model is violating COG-12.
* **Latency Creep:** Indicates the model tier (local vs. cloud) needs adjustment.

## 🛡 Safety & Rollback

GitButler is our safety net. If a `weave` run produces valid JSON but semantically "hallucinates" project logic:

1. **Unapply** the virtual branch in the GitButler UI.
2. **Discard** the changes.
3. **Refine** the `role.md` to prevent recurrence.

```

---

### **Opinion: The State of the Forge**

By persisting this handbook, we have achieved several things:
1.  **Biddability:** Agents now have a "Railroad" to follow. They don't just "chat"; they "run pipes."
2.  **Structural Power:** You can now run 10 different Lexicon-refinement experiments in 10 different GitButler lanes simultaneously without breaking your build.
3.  **Observability:** Your work is no longer invisible. Every thought process leaves a trace in `stats.jsonl` that we can visualize in your `brutalisimo` dashboard.

### **Next Steps for Completion**
1.  **I have now specified the Handbook.** 2.  **I will finalize the `AGENTS.md` update** to point synthetic agents specifically to this handbook.
3.  **Final Action:** Should I generate a "First Run" script that verifies the presence of all CLI tools (mods, jq, gum, fzf, gb) to ensure the environment is ready for the Forge?
