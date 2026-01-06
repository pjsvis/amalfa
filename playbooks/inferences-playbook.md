# 📁 Folder Strategy: The "Inference" Output Buffer

We will adopt the `inference` folder as the standardized output buffer for all automated analysis, creating the **"Standard Report Set"** to give the user a running start.

**New Folder Structure:**

```text
/inference
├── answers/             # Human-driven, final syntheses (e.g., "Answer to Q1").
├── standard_reports/    # Machine-generated, recurring structural analysis.
│   ├── gaps.md          # Gaps in The Triangle of Truth (e.g., Doc without a Brief).
│   ├── islands.json     # Nodes with zero edges (semantic or structural).
│   ├── timeline.json    # The deduced chronological sequence of events.
│   ├── centrality.json  # Node importance ranking (Degree Centrality).
│   └── connections.md   # Bridges between two distinct Collections (Bucket A <-> Bucket B).
├── queries/             # Storage for effective, reusable query prompts (The Playbook Questions).
│   ├── standard_q_1_gap_analysis.md
│   └── standard_q_2_context_drift.md
└── README.md            # Explains how to interpret the reports.
```

-----

##  📖 Proposal: The Inferences Playbook (Techniques)

The system should provide **Techniques** alongside **Tools**. The Inferences Playbook provides the methodology for leveraging the standard reports.

| Technique | Objective | Question Type | Related Report/Tool |
| :--- | :--- | :--- | :--- |
| **I. Timeline Correlation** | Find causation / sequence errors. | "Did event X happen before/after the decision to abandon Y?" | `timeline.json` |
| **II. Isolation Audit** | Identify irrelevant or orphaned knowledge. | "What documents are completely disconnected from our core concepts?" | `islands.json` |
| **III. Context Drift** | Verify alignment between intent and execution. | "Is the content of the 'Brief' semantically similar to the content of the 'Reference' doc?" | `gaps.md` / `SemanticWeaver` |
| **IV. Bridge Discovery** | Locate the high-value point of intersection between two document sets. | "Which document in the new 'Competitor' collection strongly links to our 'Pricing' strategy?" | `connections.md` |
| **V. Pillar Identification** | Rank documents by knowledge dependency. | "Which documents are cited or mentioned the most often?" | `centrality.json` |

This combination of **Process (Playbook)** and **Output (Reports)** gives the user an immediate path to insight, satisfying your need for a running start.