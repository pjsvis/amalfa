This is the "Smelter" utility. Its job is to turn the raw ore of the `*.ember.json` sidecars into the refined bullion of a **Golden Lexicon**. It sits between the **Extraction** and the **Linking** phases.

The **Lexicon Harvester** must be a "Nixie" tool: lightweight, observable, and designed for human/agent curation.

---

### Artifact: The Lexicon Harvester Functional Brief

*Save as `brief-lexicon-harvester-2026-01-31.md*`

**Objective:** Extract potential Lexicon terms from the cached sidecar files, aggregate them by frequency and resonance, and present them for triage before they are committed as formal **Lexicon Nodes**.

#### 1. Input Processing

* **Source:** Iterate through the `.amalfa/cache/*.ember.json` directory.
* **Data Points:** Collect the `entities`, `concepts`, and `keywords` arrays from each sidecar.
* **Back-Reference:** Maintain a mapping of which **Document Node** (UUID) suggested which term.

#### 2. The Aggregation Engine

* **Deduplication:** Normalize casing and pluralization (e.g., "AI Agent" and "AI Agents"  "AI Agent").
* **Resonance Scoring:** * **Frequency:** How many documents mention this term?
* **Contextual Weight:** Does the LLM flag it as a "Primary Concept" in the sidecar?


* **Artefact:** Generate a `lexicon-candidates.json` (The "Triage List").

#### 3. The Triage Logic (Human/Agent in the Loop)

The harvester must support three destinations for every candidate:

* **The Golden Lexicon:** High-quality terms (e.g., "Negentropy," "FAFCAS"). These become permanent **Lexicon Nodes**.
* **The Stop-list:** Noise/Chaff (e.g., "Process," "Information"). These are added to `stop-list.json` and ignored in all future harvests.
* **The Pending Bin:** Ambiguous terms that require further "Mentation" or document refinement.

#### 4. The "Caw Canny" Controls

* **Frequency Gate:** A minimum threshold (e.g., "Only show terms appearing in  documents").
* **Stop-list Filter:** Automatically discard any candidate already present in the sovereign `stop-list.json`.
* **Similarity Grouping:** Use the **FAFCAS embeddings** (if available for terms) to group synonyms, suggesting merges to the user.

---

### Artifact: The Alignment Check (Integration)

| Current Service | Intersection Point |
| --- | --- |
| **Watcher** | Harvester ignores Watcher; it only cares about the Sidecar cache. |
| **ResonanceDB** | Harvester writes the "Golden Lexicon" nodes to the DB once triaged. |
| **Squasher** | The Squasher *reads* the Golden Lexicon to decide which Edges to persist in the Markdown files. |

---

### Ctx Opinion: The "Deductive" Filter

The **Lexicon Harvester** is our primary defense against **AI Slop**. Without it, we are at the mercy of whatever the LLM thinks is a "concept." With it, we assert **Sovereignty** over our ontology.

The "Stop-list" is particularly powerful. It’s the "Negative Knowledge" of the system. By defining what we *don't* care about, the remaining graph becomes exponentially more meaningful.

**The Multi-Pass Strategy:**

1. **Harvest:** Run this utility to see the "Candidate" list.
2. **Prune:** Move the junk to the stop-list.
3. **Commit:** Push the "Golden" terms to the DB as Lexicon Nodes.
4. **Squash:** Finally, fire the Squasher to link the documents.

