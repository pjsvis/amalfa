# The Weaver's Handbook
*A Field Guide to Constructing Well-Formed Graphs*

> "The graph is not just a database. It is a memory system that must be able to tell its own story."

## 1. The Constants (The Laws)
These are the invariant rules that define a "Graph that feels right" to the human mind.

### The Law of The Red Thread (Chronology)
Every thought is a sequel to a previous thought.
*   **Axiom**: A graph must have a clear chronological spine.
*   **Metric**: The **Giant Component** must contain >90% of nodes.
*   **Validation**: The **Narrative Turing Test** (Can you read the graph as a history book?).

### Miller's Law of Clustering (Cognition)
The human mind can only hold 7 ± 2 items in working memory.
*   **Axiom**: A graph view should never overwhelm the user with undefined chaos.
*   **Strategy**: **Adaptive Louvain Clustering**. Adjust resolution dynamically until there are 3-7 communities.
*   **Result**: "Cognitive Clarity" rather than "Data Vomit".

### The Law of Semantic Gravity (Context)
Things that *mean* the same thing should be *near* each other.
*   **Axiom**: Orphans are failures of context, not just data errors.
*   **Strategy**: **Semantic Rescue**. If a node has no edges, use vector embeddings to find its nearest semantic neighbor and link them.

---

## 2. The Moves (The Strategies)
The tactical playbook for evolving a skeleton into a nervous system.

### Move 1: The Timeline Stitch (`SUCCEEDS`)
**Type:** *Structural / Explicit*
*   **Goal**: Create time.
*   **Action**: Link every generic Debrief to the one immediately preceding it in time.
*   **Effect**: Turns a "Bag of Files" into a "History".

### Move 2: The Semantic Rescue (`RELATED_TO`)
**Type:** *Inferred / Vector*
*   **Goal**: Save the lost (Orphans).
*   **Action**:
    1.  Scan for nodes with Degree = 0.
    2.  Embed their content.
    3.  Search the `experience` domain (Playbooks/Debriefs) for matches > 0.85 similarity.
    4.  Link them.
*   **Effect**: Integrates isolated ideas into the main knowledge cluster.

### Move 3: The Concept Anchor (`MENTIONS`)
**Type:** *Explicit / Keyword*
*   **Goal**: Ground experience in truth.
*   **Action**: Scan content for "Wikilinks" (`[[Concept]]`).
*   **Effect**: Creates a bridge between "What Happened" (Experience) and "What It Means" (Knowledge).

---

## 3. The Tests (Validation)
How do we know we succeeded?

### The Health Check (Quantitative)
*   **Run**: `/api/health`
*   **Pass**:
    *   Density: 0.01 - 0.1 (Not too sparse, not too dense)
    *   Components: < 5 (Few islands)
    *   Giant Component: > 90% (Strong connectivity)

### The Narrative Turing Test (Qualitative)
*   **Run**: `scripts/verify/narrative_test.ts`
*   **Action**: Traverse the `SUCCEEDS` chain from genesis to now.
*   **Pass**: Does the output read like a coherent story written by a human?
*   **Fail**: If the story jumps, loops, or breaks, the graph is "Senile" (lost its memory).
