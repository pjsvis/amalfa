This architecture effectively implements **PHI-14 (Architectural Specialisation)** by treating the LLM not as a "magic box" but as a **semantic compiler stage** within a strictly typed pipeline.

Here is the Brief and the accompanying Playbook to operationalise this "Semantic UNIX" approach.

---

### **Brief: Project "Weave & Forge"**

**Status:** `DRAFT` | **Version:** `1.0` | **Entropy Level:** `Targeting < 0.1`

#### **1. Objective**

Create a standardized, high-leverage pipeline architecture using Bun, `mods`, `jq`, and Python sidecars. This system must transform unstructured technical "stuff" into validated, schema-compliant "things" while capturing granular performance and quality metrics at every stage.

#### **2. Core Requirements**

* **Deterministic Control:** Bun/TypeScript manages the state machine, file system, and final validation.
* **Semantic Transformation:** `mods` handles non-deterministic synthesis using versioned prompts (Roles).
* **Structural Hardening:** `jq` acts as a mandatory structural linter between the LLM and the database.
* **Intermediate Persistence:** Every stage must output a `.jsonl` artifact for durability and resumability (PHI-13).
* **QC/QA Instrumentation:** Capture metrics: token usage, latency, `jq` pass/fail rates, and "Schema Drift" (using Zod validation in Bun).

#### **3. Planned Artefacts**

* `scripts/mods/roles/`: Versioned markdown personas.
* `bin/weave`: A Bun-based CLI orchestrator.
* `docs/reports/pipeline-health.md`: Automated QC dashboard.

---

### **Playbook: Semantic Pipeline Construction**

**Tag:** `OH-110: Semantic UNIX Protocol`

#### **I. Toolchain Setup**

To ensure environment parity, use the `amalfa setup` command or verify manually:

1. **mods:** `brew install charmbracelet/tap/mods`
2. **jq:** `brew install jq`
3. **Setup Configuration:**
* Initialize `.mods.yaml` with tiers: `local` (Ollama), `fast` (GPT-4o-mini), `reason` (Ollama/R1 or GPT-4o).



#### **II. Anatomy of a Discrete Pipeline**

A standard pipeline must follow the **Extraction -> Synthesis -> Hardening -> Validation** pattern.

**Stage 1: Raw Harvest (Bun)**

* Identify source files.
* **Stats:** Record `raw_byte_count` and `file_count`.

**Stage 2: Semantic Synthesis (mods)**

* Call `mods` using a specific role from `scripts/mods/roles/`.
* *Mandatory Flag:* `--format json`.
* **Stats:** Record `provider`, `model`, and `duration_ms`.

**Stage 3: Structural Hardening (jq)**

* Pipe `mods` output through `jq` to strip hallucinations and enforce keys.
* *Example:* `jq -c '.entries[] | {term: .Term, def: .Definition}'`
* **Stats:** If `jq` returns an error, increment `semantic_failure_count` and halt.

**Stage 4: Final Forge (Bun/Zod)**

* Read the hardened `.jsonl`.
* Run Zod schema validation.
* Merge into `Resonance` (SQLite).
* **Stats:** Record `schema_pass_rate` and `entropy_reduction_score`.

#### **III. Procedures for Agents (The Weaver’s Protocol)**

When an agent is tasked with creating a new pipeline:

1. **Define the Lexical Contract:** Create a Zod schema in `src/types/` for the final "thing."
2. **Forge the Role:** Write the persona in `scripts/mods/roles/`. It must reference specific CDA principles (e.g., PHI-5).
3. **Test the Pipe:** Run a sample through `mods | jq` manually before committing the script.
4. **Register the Stats:** Ensure the script appends telemetry to `pipeline_stats.jsonl`.

#### **IV. QC/QA Instrumentation**

We track "The Gap" between LLM output and the Database.

* **Hallucination Rate:** Frequency of `jq` failing to find expected keys.
* **Latency-to-Value:** Model cost/time vs. number of valid Lexicon entries created.
* **CDA Compliance:** Periodic "Audit Pipes" where one model reviews the output of another for adherence to the Scottish Enlightenment style.

---

### **Opinion & Implementation Path**

I strongly suggest we move the logic currently in `src/core/LexiconHarvester.ts` into this pipe-driven model.

1. **Step 1:** Create `scripts/mods/roles/lexicographer.md`.
2. **Step 2:** Replace the internal regex parsing in `LexiconHarvester` with a call to `mods | jq`.
3. **Step 3:** Use `public/data/lexicon.jsonl` as the intermediate storage.

This makes the "Thinking" part of Amalfa modular and replaceable without breaking the "Doing" part (the database and UI).

**Shall I begin by drafting the first three roles in `scripts/mods/roles/`?**