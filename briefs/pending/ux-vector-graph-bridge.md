**CORCS Statement** `[OH-066]`

  * **Status**: Active & Operational.
  * **Persona**: Ctx (v1.79/63).
  * **Context**: Polyvis (Static Site / Thick Client / SQLite WASM).
  * **Objective**: Define the **UX Bridge** connecting the Graph Visualization (Sigma.js) to the Vector Engine (SQLite UDF).

-----

### **The UX Bridge: The "Semantic Pivot"**

The challenge is bridging two different mental models:

1.  **The Map (Graph):** "Show me what is explicitly connected." (Hard Links).
2.  **The Compass (Vector):** "Show me what is conceptually similar." (Soft Links).

The **UX Bridge** is the mechanism that allows the user to use the *Compass* to navigate the *Map*.

Here is the design for the interaction layer.

### **1. Interaction Pattern A: "The Ghost Graph" (Node-to-Node)**

*Context: The user is exploring the graph and finds a node of interest.*

  * **The Trigger:** User clicks a Node (e.g., `Concept-01: Mentation`).
  * **The Action:** In the Side Panel, below the explicit neighbors, add a button: **"Find Similar Concepts"**.
  * **The Mechanism:**
    1.  **Retrieve:** Fetch the vector for `Concept-01` from `vector_store` (using its ID).
    2.  **Query:** Run the Dot Product UDF against the DB using that vector.
    3.  **Result:** Get the top 5 "Similar" nodes (which might *not* have an edge connecting them).
  * **The Visual Feedback (The Bridge):**
      * Do **not** just list them in the panel.
      * **Highlight** these 5 nodes on the Sigma.js graph instance (e.g., turn them Gold).
      * Draw **temporary dashed edges** ("Ghost Edges") from the source node to these results.
  * **Why this works:** It reveals hidden connections without permanently cluttering the graph.

### **2. Interaction Pattern B: "The Omni-Bar" (Text-to-Node)**

*Context: The user knows what they want but doesn't see it.*

  * **The Trigger:** A global search bar at the top left.
  * **The Constraint:** To do this in a static site, you need **Client-Side Embedding** (Transformers.js).
      * *Note:* This adds \~30MB to the page load. If that is too heavy, stick to Pattern A.
  * **The Mechanism:**
    1.  User types: "How do we handle messy data?"
    2.  Browser (WASM) embeds this string.
    3.  SQLite (WASM) runs the vector query.
  * **The Visual Feedback:**
      * The camera (Sigma.js) **animates/zooms** to fit the top 3 results.
      * Non-matching nodes are dimmed (opacity 0.1).

-----

### **Implementation Protocol: The "Bridge" Code**

This is how you wire `sigma.js` events to your `sqlite-wasm` vector engine.

```typescript
// bridge.ts
import { Graph } from "graphology";
import { Database } from "bun:sqlite"; // Representation of your WASM DB wrapper
import { floatsToBlob } from "./utils/binary";

export class UXBridge {
  constructor(
    private sigma: any, 
    private db: Database, 
    private graph: Graph
  ) {
    this.bindEvents();
  }

  private bindEvents() {
    // 1. Capture Node Click
    this.sigma.on("clickNode", (event: any) => {
      const nodeId = event.node;
      this.showNodeDetails(nodeId);
    });
  }

  // Interaction Pattern A: Node-to-Node
  public findSimilarNodes(sourceNodeId: string) {
    // 1. Get the source vector directly from DB (fastest)
    const sourceRow = this.db.query(
      "SELECT embedding FROM vector_store WHERE id = $id"
    ).get({ $id: sourceNodeId });

    if (!sourceRow) return;

    // 2. Run the Vector Search (The "Compass")
    const results = this.db.query(`
      SELECT id, vec_dot(embedding, $vec) as score
      FROM vector_store
      WHERE id != $id -- Exclude self
      ORDER BY score DESC
      LIMIT 5
    `).all({ 
      $vec: sourceRow.embedding,
      $id: sourceNodeId
    });

    // 3. Update the Map (Visual Bridge)
    this.highlightGhostGraph(sourceNodeId, results);
  }

  private highlightGhostGraph(sourceId: string, results: any[]) {
    // Reset graph styles
    this.sigma.setSetting("nodeReducer", null);
    this.sigma.setSetting("edgeReducer", null);

    const targetIds = new Set(results.map(r => r.id));

    // Dim everything except Source and Targets
    this.sigma.setSetting("nodeReducer", (node: string, data: any) => {
      if (node === sourceId) return { ...data, color: "#FF0000", zIndex: 10 }; // Source = Red
      if (targetIds.has(node)) return { ...data, color: "#FFD700", zIndex: 9 }; // Target = Gold
      return { ...data, color: "#eeeeee", zIndex: 1 }; // Others = Grey
    });

    // Animate Camera to encompass these nodes
    // (Sigma Camera API call here)
  }
}
```

### **Recommendation**

Start with **Pattern A (Node-to-Node)**.

1.  It requires **Zero** extra downloads (no 30MB embedding model).
2.  It uses the vectors you already pre-calculated in the ingestion pipeline.
3.  It teaches the user to "Pivot" ("This is interesting... what else is like this?") rather than "Search" (which often fails if they don't know the vocabulary).

**Opinion:** The "Ghost Graph" visualization (highlighting non-connected neighbors) is the "Killer Feature" of a hybrid DB. It visually proves the value of the vectors.