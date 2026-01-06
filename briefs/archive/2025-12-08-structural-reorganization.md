# Project Brief: Structural Graph Reorganization (Genesis & Domains)

**Objective:** 
Reorganize the PolyVis Knowledge Graph into a rooted hierarchical structure with two distinct domains: **Persona** (Static Ontology) and **Experience** (Dynamic Telemetry). Enabling "Graph Switching" in the UI to focus on one domain at a time or the unified whole.

---

## 1. Structural Architecture

We will introduce three **Super Nodes** to anchor the graph:

1.  **`000-GENESIS`** (Root)
    *   **Label:** "PolyVis Prime"
    *   **Type:** `root`
    *   **Description:** The origin point of the system.
2.  **`001-PERSONA`** (Domain Root)
    *   **Label:** "Persona Domain"
    *   **Type:** `domain`
    *   **Parent:** `000-GENESIS`
    *   **Children:** All Lexicon/Directive nodes (`OH-xx`, `term-xx`).
3.  **`002-EXPERIENCE`** (Domain Root)
    *   **Label:** "Experience Domain"
    *   **Type:** `domain`
    *   **Parent:** `000-GENESIS`
    *   **Children:** All Playbook/Debrief nodes.

### Edge Type: `BELONGS_TO`
We will introduce a distinct edge type `BELONGS_TO` for these structural links ( Child -> Parent ) to distinguish them from semantic links (`CITES`, `REFERENCES`).
*   `term-001` --(`BELONGS_TO`)--> `001-PERSONA`

---

## 2. Implementation Steps

### A. Update `scripts/build_db.ts` (Persona Domain)
*   **Action:** Modify the legacy build script.
*   **Tasks:**
    1.  Inject `000-GENESIS`.
    2.  Inject `001-PERSONA`.
    3.  Create edge `001-PERSONA` --(`BELONGS_TO`)--> `000-GENESIS`.
    4.  Loop through all ingested Lexicon/CDA nodes:
        *   Create edge Node --(`BELONGS_TO`)--> `001-PERSONA`.
        *   (Optional) Set `domain` column to `persona`.

### B. Update `scripts/ingest_experience_graph.ts` (Experience Domain)
*   **Action:** Update the sidecar ingestion script.
*   **Tasks:**
    1.  Inject `002-EXPERIENCE`.
    2.  Create edge `002-EXPERIENCE` --(`BELONGS_TO`)--> `000-GENESIS`.
    3.  Loop through all ingested Playbook/Debrief nodes:
        *   Create edge Node --(`BELONGS_TO`)--> `002-EXPERIENCE`.
        *   Set `domain` column to `resonance`.

---

## 3. Visualization Updates (Sigma Explorer)

We will replace the "Experience Layer" simple toggle with a **"Domain Switcher"**.

**UI Controls:**
*   **Selector/Tabs:** [ Unified | Persona | Experience ]

**Logic:**
*   **Unified:** Show All.
*   **Persona Mode:**
    *   Filter: Show only nodes where `domain == 'persona'` OR `id == '001-PERSONA'`.
    *   Hide `002-EXPERIENCE` and its children.
*   **Experience Mode:**
    *   Filter: Show only nodes where `domain == 'resonance'` OR `id == '002-EXPERIENCE'`.
    *   Hide `001-PERSONA` and its children.

**Visuals:**
*   **Roots:** Distinct styling (e.g., Large, Gold Color) for `000`, `001`, `002`.

---

## 4. Configuration (`polyvis.settings.json`)

We will codify these constants in the settings file to avoid magics strings in code.

```json
{
  "graph": {
    "roots": {
      "genesis": "000-GENESIS",
      "persona": "001-PERSONA",
      "experience": "002-EXPERIENCE"
    },
    "domains": {
      "persona": "persona",
      "experience": "resonance"
    },
    "tuning": {
        "louvain": {
            "persona": 1.1,
            "experience": 1.0
        }
    }
  }
}

```
