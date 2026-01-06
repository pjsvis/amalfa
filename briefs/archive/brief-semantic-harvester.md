### Opinion: The "Non-Invasive Miner" Strategy

You are absolutely correct. We should **not** vandalism our own source documents by retroactively inserting `tag-` prefixes.

Your distinction between **Active Tagging** (for new work) and **Passive Mining** (for existing work) is the final architectural key.

Here is why your "Metadata Association" model is the superior approach for the **Cold Start**:

### 1. No Destructive Edits (Brownfield Safety)
* **The Idea:** You suggested we don't need to add hyphens/tags to the original text.
* **The Validation:** Correct. The "Bento Box" is a Container. We can attach **Metadata** to that container (in the Graph Database) without modifying the Markdown file itself.
* **The Mechanism:**
    1.  **Miner:** Reads `letter-A.md`.
    2.  **Analysis:** Identifies "Statutory Demand."
    3.  **Storage:** Updates the **Graph Node** for that section, adding a property `concepts: ["statutory-demand"]`.
    4.  **File:** Remains untouched.

### 2. Semantic Expansion (The "Draft Definition")
You noted we should mine the *Description* as well as the Token.
* **Why:** A token alone (`circular-logic`) is ambiguous.
* **Value:** If the Miner extracts: *"{Term: Circular Logic, Context: The bank argues X because of Y...}"*, it makes your **Ratification Phase** infinitely faster. You aren't just approving a word; you are approving a *meaning*.

### 3. The Unified Workflow
This creates a clean dual-pipeline:

* **Pipeline A (Active/Greenfield):**
    * Agent writes `tag-risk`.
    * Harvester sees tag.
    * Promotes to Lexicon.

* **Pipeline B (Passive/Brownfield):**
    * Agent scans text.
    * Identifies "Risk".
    * Extracts Definition.
    * User Ratifies.
    * Promotes to Lexicon.

**The Convergence:**
Once a term is in the **Lexicon** (Persona Domain), the **Edge Weaver** works exactly the same way for both pipelines. It scans the text for "Canonical Terms" and draws the edges. It doesn't care if the term came from a Tag or a Mine.

***

### Updated Artifact: Brief #4 (Complete)

I have updated **Brief #4** to include **Phase 0: The Cold Start Miner**. This operationalises the "Non-Invasive" extraction of tokens and definitions.

#### [vibe-agent/4-brief-semantic-harvester.md]

# Project Brief: The Semantic Harvester (Discovery Engine)

**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a "Discovery Engine" that populates the Knowledge Graph. It combines **Active Discovery** (Explicit Tagging) for new work and **Passive Mining** (Concept Extraction) for existing corpus, managed via an "Air-Lock" ratification workflow.

**Core Philosophy:** "The Smart Garden."
We do not let AI pollute the graph with noise. We use AI to *propose* concepts (Scaffolding), and Human Architects to *ratify* them (Canon).

---

## 1. Phase 0: The Cold Start Miner (Passive Discovery)
*For processing existing "Brownfield" documents without editing them.*

**The Protocol:**
1.  **Scan:** The Vibe Agent reads the corpus (Bento by Bento).
2.  **Extract:** It identifies recurring Domain Terms (Entities, Risks, Heuristics).
3.  **Expand:** It extracts a **Draft Definition** based on context.
    * *Example:* `{ "term": "procedural-default", "definition": "A default triggered by failure to follow process rather than missed payment.", "source": "letter-nov20.md" }`
4.  **Staging:** It dumps these candidates into `_staging.md` (The Air-Lock).
5.  **Constraint:** It **DOES NOT** edit the source files. The link is established via the Lexicon, not inline tags.

---

## 2. Phase 1: The Active Tagging Protocol (Greenfield)
*For new work created by Agents or Humans.*

**The Protocol:**
1.  **Write:** Agent/User inserts `tag-{slug}` (e.g., `tag-statutory-harm`) while drafting.
2.  **Signal:** This prefix acts as a "Flare," explicitly requesting inclusion in the graph.
3.  **Harvest:** The system regex-scans for `tag-*` and adds them to `_staging.md`.

---

## 3. Phase 2: The Air-Lock (Ratification)
*The Gateway between Noise and Signal.*

**The Tool:** `resonance promote` (CLI).
**The Workflow:**
The Architect reviews `_staging.md`. For each candidate (Mined or Tagged):
1.  **Review Definition:** Accept or refine the AI-generated definition.
2.  **Assign Domain:**
    * **Persona Domain:** Universal Concepts $\to$ `conceptual-lexicon.json`.
    * **Experience Domain:** Specific Entities $\to$ `entity-index.json`.
3.  **Persist:** The Term becomes Canon.

---

## 4. Phase 3: The Weaving (Graph Construction)
*How the edges are drawn.*

**The Logic:**
The **Edge Weaver** loads the Canon (Lexicon + Index). It scans all Bento Boxes.
* **Match:** If `Content` contains `Canonical Term` (e.g., "Procedural Default"):
* **Action:** Create Edge: `Section Node` $\xrightarrow{\text{EXEMPLIFIES}}$ `Concept Node`.

**Result:**
We get a rich graph *without* needing to maintain `tag-` prefixes in the final text. The Text remains readable; the Graph becomes intelligent.

---

## 5. Implementation Plan

1.  **`scripts/mine.ts`:** Uses LLM to extract `{term, definition}` from a file list.
2.  **`scripts/harvest.ts`:** Uses Regex to extract `tag-*` from new files.
3.  **`scripts/promote.ts`:** CLI for user ratification.
4.  **`scripts/weave.ts`:** Matches Canon Terms against Corpus Text.

## 6. Success Criteria
* [ ] The Miner successfully extracts "Statutory Demand" + Definition from the BBL corpus.
* [ ] `_staging.md` supports both "Mined" (with defs) and "Tagged" (raw) candidates.
* [ ] The Weaver connects a document to a Concept even if the `tag-` prefix is missing (relying on the Canon match).