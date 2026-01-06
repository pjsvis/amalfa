This is a classic graph engineering trap. If you simply link everything chronologically (`Node A (10:00)` -\> `Node B (10:01)`), you create a "single long string" that tangles up your graph layout, obscuring the semantic clusters.

Here is the strategy to establish timelines without the hairball, plus the "Low Hanging Fruit" of structural grounding.

### The Strategy: "Scoped Streams & Structural Spine"

1.  **Scoped Timelines (The Streams):** Never create a "Global Timeline." Instead, create parallel time streams based on **Type** or **Context**.

      * *Debrief Stream:* `Debrief A` -\> `Debrief B`
      * *Playbook Stream:* `Playbook v1` -\> `Playbook v2`
      * *The Rule:* Only link Node A to Node B if they are chronologically adjacent **AND** semantically similar (same type/tag).

2.  **Directory Structure (The Spine):** This is the **number one** piece of "low hanging fruit" missing from most graph RAGs.

      * Your files live in folders. Those folders represent human-organized clustering.
      * If you ingest the **Folders** as nodes and link files to them (`File` -\> `INSIDE` -\> `Folder`), you create a stable "spine" for your graph. This prevents the "hairball" by physically anchoring nodes to their directory clusters.

-----

### 1\. Upgrade: `TimelineWeaver.ts` (Generic & Scoped)

I have refactored your weaver to be generic. It can now weave multiple distinct timelines (e.g., one for `debriefs`, one for `reports`) without crossing the streams. I also added a secondary sort (Title) to prevent "shimmering" (random reordering) when dates are identical.

```typescript
import { ResonanceDB } from "@resonance/src/db";

export class TimelineWeaver {
  /**
   * Weaves chronological edges for specific node types.
   * Creates isolated streams: Debriefs -> Debriefs, Reports -> Reports.
   */
  static weave(db: ResonanceDB, types: string[] = ["debrief", "report", "journal"]) {
    console.log("⏳ TimelineWeaver: Initializing...");

    for (const type of types) {
      this.weaveStream(db, type);
    }
  }

  private static weaveStream(db: ResonanceDB, type: string) {
    // 1. Fetch
    const nodes = db.getNodesByType(type);
    if (nodes.length < 2) return;

    // 2. Extract Dates & Sort
    const datedNodes = nodes
      .map((node) => {
        let dateStr = node.meta?.date;

        // Fallback: Filename Regex (YYYY-MM-DD)
        if (!dateStr && node.meta?.source) {
          const basename = node.meta.source.split("/").pop() || "";
          const match = basename.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) dateStr = match[1];
        }

        return {
          ...node,
          dateObj: dateStr ? new Date(dateStr) : null,
        };
      })
      .filter((n) => n.dateObj && !isNaN(n.dateObj.getTime()));

    // 3. Stable Sort (Newest First)
    // Primary: Date, Secondary: Title (Deterministic tie-breaking)
    datedNodes.sort((a, b) => {
        const timeDiff = b.dateObj!.getTime() - a.dateObj!.getTime();
        if (timeDiff !== 0) return timeDiff;
        return (a.title || "").localeCompare(b.title || "");
    });

    // 4. Weave Edges
    let edgesAdded = 0;
    for (let i = 0; i < datedNodes.length - 1; i++) {
      const current = datedNodes[i];   // Newer
      const previous = datedNodes[i + 1]; // Older

      // Edge: Current SUCCEEDS Previous
      if (current && previous) {
        // Prevent duplicate edges if run multiple times
        // (Assuming db.insertEdge handles existence check or we use a unique constraint)
        db.insertEdge(current.id, previous.id, "SUCCEEDS");
        edgesAdded++;
      }
    }

    if (edgesAdded > 0) {
        console.log(`   > Linked ${edgesAdded} '${type}' nodes in chronological chain.`);
    }
  }
}
```

-----

### 2\. New Component: `StructureWeaver.ts` (The Spine)

This is the **missing low hanging fruit**. By creating nodes for your directories, you give your graph "gravity."

**Create file:** `src/core/StructureWeaver.ts`

```typescript
import { ResonanceDB } from "@resonance/src/db";

export class StructureWeaver {
    static weave(db: ResonanceDB) {
        console.log("📂 StructureWeaver: Building directory spine...");
        
        // 1. Get all nodes that have a source path
        const fileNodes = db.getAllNodes().filter(n => n.meta?.source);
        const folders = new Set<string>();
        let edgesAdded = 0;

        for (const node of fileNodes) {
            const sourcePath = node.meta.source as string;
            // e.g. "docs/architecture/pipeline.md"
            const parts = sourcePath.split('/');
            
            // Pop the filename, leave the folder path
            parts.pop(); 
            
            if (parts.length === 0) continue; // Root file

            // Create Folder Nodes & Edges recursively
            // Path: docs/architecture
            // 1. Link Node -> "docs/architecture"
            // 2. Link "docs/architecture" -> "docs"
            
            let currentPath = "";
            let childId = node.id;
            let isFile = true;

            // Walk backwards from file to root
            // Logic: We build the path string incrementally
            
            // Simpler approach: Parent Directory Only
            // This avoids creating deep hierarchies if not needed, 
            // but for a full spine, we want full recursion.
            
            const parentDir = parts.join('/');
            const parentId = `folder:${parentDir}`;

            // Ensure Parent Folder Node Exists
            if (!folders.has(parentId)) {
                db.insertNode({
                    id: parentId,
                    type: "folder",
                    label: parts[parts.length - 1] + "/",
                    content: `Directory: ${parentDir}`,
                    domain: "structure",
                    layer: "physical",
                    embedding: undefined,
                    meta: { path: parentDir }
                });
                folders.add(parentId);
            }

            // Link File to Folder
            db.insertEdge(parentId, node.id, "CONTAINS");
            edgesAdded++;
            
            // Optional: Link Folder to Grandparent (Recursive Spine)
            // This connects "docs/architecture" to "docs"
            if (parts.length > 1) {
                const grandParentParts = parts.slice(0, -1);
                const grandParentPath = grandParentParts.join('/');
                const grandParentId = `folder:${grandParentPath}`;
                
                if (!folders.has(grandParentId)) {
                     db.insertNode({
                        id: grandParentId,
                        type: "folder",
                        label: grandParentParts[grandParentParts.length - 1] + "/",
                        content: `Directory: ${grandParentPath}`,
                        domain: "structure",
                        layer: "physical",
                        embedding: undefined,
                        meta: { path: grandParentPath }
                    });
                    folders.add(grandParentId);
                }
                
                db.insertEdge(grandParentId, parentId, "CONTAINS");
            }
        }
        
        console.log(`📂 StructureWeaver: Connected nodes to ${folders.size} folders.`);
    }
}
```

### 3\. Integration in `ingest.ts`

Update your `main` function in `scripts/pipeline/ingest.ts` to include these two weavers at the end.

```typescript
// ... existing imports
import { TimelineWeaver } from "@src/core/TimelineWeaver";
import { StructureWeaver } from "@src/core/StructureWeaver"; // New import

// ... inside main(), after basic processing loop

    // 4.5 Timeline Weaving (Scoped Streams)
    try {
        // Now explicit about WHAT to weave
        TimelineWeaver.weave(db, ["debrief", "playbook", "report"]); 
    } catch (e) {
        console.warn("⚠️ Timeline Weaver failed:", e);
    }

    // 4.7 Structure Weaving (The Spine)
    try {
        StructureWeaver.weave(db);
    } catch (e) {
        console.warn("⚠️ Structure Weaver failed:", e);
    }

// ... existing validation and cleanup
```

### Why this is better

1.  **Reduced Noise:** `debriefs` talk to `debriefs`. You won't accidentally traverse from a "Business Strategy" to a "Bug Fix" just because they happened on Tuesday.
2.  **Spatial Stability:** The `StructureWeaver` creates a visual map. If you visualize this in Sigma.js/Cosmograph, you will see clusters forming naturally around your file folders (e.g., all `playbooks` will cluster around the `playbooks/` folder node).
3.  **Deterministic:** The added sort by Title prevents graph edges from flipping randomly between ingestion runs for items created on the same day.

---
You are absolutely correctly identifying the **"Triad of Context"**:

1.  **Time:** (Chronological Streams) → *Sequence*
2.  **Space:** (Directory Spine) → *Location*
3.  **Similarity:** (Vectors/Embeddings) → *Vibe*

Is that all? **No.**
In my opinion, you are missing the **"Hidden"** layer. This is where a graph goes from being a "file explorer" to a "discovery engine."

Here are the two missing digestive processes that add massive value without adding massive cost:

### 1\. The "Desire Lines" (Implication)

Users are lazy. They write "See the *Deployment Guide*" but forget to wrap it in `[[brackets]]`.
A smart ingestion pipeline should detect these **Unlinked Mentions**. If a phrase in Document A exactly matches the title of Document B, a "soft edge" should be woven automatically.

  * **Value:** Finds connections you forgot to make.

### 2\. The "Social Network" (Topology)

Once you have edges, you can calculate **Centrality**.

  * **Degree Centrality:** Which notes have the most connections? (These are your "Pillars").
  * **Community Detection:** Which notes form a tight "clique"? (e.g., The "CSS Refactor" cluster).
  * **Value:** Allows you to visually scale nodes based on importance, not just date.

-----

### New Component: `DesireLineWeaver.ts`

*Adds "Soft Edges" where strict links were forgotten.*

```typescript
import { ResonanceDB } from "@resonance/src/db";

export class DesireLineWeaver {
    static weave(db: ResonanceDB) {
        console.log("🕸️ DesireLineWeaver: Scanning for unlinked mentions...");

        // 1. Build the "Target Dictionary"
        // We only want to auto-link to meaningful things (Concepts, Playbooks, Debriefs)
        // Linking to every random "scratchpad" creates noise.
        const targets = db.getAllNodes()
            .filter(n => ["concept", "playbook", "debrief"].includes(n.type))
            .filter(n => n.title && n.title.length > 4); // Skip short words like "Log"

        // Create a massive Regex for one-pass scanning (Escaping regex chars)
        // Sort by length (descending) so "Advanced Graph Theory" matches before "Graph"
        const sortedTitles = targets
            .map(n => n.title!)
            .sort((a, b) => b.length - a.length);

        if (sortedTitles.length === 0) return;

        // Create map for Title -> ID Lookup
        const titleMap = new Map<string, string>();
        targets.forEach(n => titleMap.set(n.title!.toLowerCase(), n.id));

        // 2. The Scanner
        const nodes = db.getAllNodes().filter(n => n.content);
        let edgesAdded = 0;

        for (const source of nodes) {
            const contentLower = source.content!.toLowerCase();
            
            // Check each target title
            // (For <5k nodes, simple loop inclusion check is often faster/safer than a mega-regex)
            for (const target of targets) {
                if (source.id === target.id) continue; // Don't link to self

                const targetTitle = target.title!.toLowerCase();
                
                // Heuristic: Must contain the title surrounded by spaces or punctuation
                // We use a simple indexOf check first for speed
                const idx = contentLower.indexOf(targetTitle);
                
                if (idx !== -1) {
                    // Verify boundaries (don't match "Graph" inside "Graphology")
                    const before = contentLower[idx - 1] || " ";
                    const after = contentLower[idx + targetTitle.length] || " ";
                    
                    if (isBoundary(before) && isBoundary(after)) {
                        // Check if edge already exists? (db.insertEdge usually handles idempotency)
                        db.insertEdge(source.id, target.id, "MENTIONS");
                        edgesAdded++;
                    }
                }
            }
        }

        console.log(`🕸️ DesireLineWeaver: Wove ${edgesAdded} implied connections.`);
    }
}

function isBoundary(char: string): boolean {
    return /[\s.,;:!?()\[\]{}"']/.test(char);
}
```

### 3\. Calculating "Importance" (Post-Processing)

Add this small routine at the very end of your pipeline. It updates the metadata of your nodes so your UI can render important nodes *larger*.

```typescript
// Add to scripts/pipeline/ingest.ts or a new GraphAnalyst.ts

export function calculateCentrality(db: ResonanceDB) {
    console.log("📊 GraphAnalyst: Calculating node centrality...");
    
    // 1. Get raw counts (In-degree + Out-degree)
    // Bun SQLite makes this easy
    const scores = db['db'].query(`
        SELECT id, count(*) as degree 
        FROM (
            SELECT source as id FROM edges
            UNION ALL
            SELECT target as id FROM edges
        )
        GROUP BY id
    `).all() as { id: string, degree: number }[];

    // 2. Update Metadata
    const updateStmt = db['db'].prepare(
        "UPDATE nodes SET meta = json_patch(meta, ?) WHERE id = ?"
    );

    for (const row of scores) {
        // Normalize? Or just store raw degree
        const patch = JSON.stringify({ centrality: row.degree });
        updateStmt.run(patch, row.id);
    }
    
    console.log(`📊 GraphAnalyst: Updated centrality for ${scores.length} nodes.`);
}
```

### Summary of the "Full Digest"

If you implement these, your graph pipeline looks like this:

1.  **Ingest (BentoBox):** Breaks matter into atomic units.
2.  **Space (StructureWeaver):** Anchors units to folders (Gravity).
3.  **Time (TimelineWeaver):** Links units chronologically (Flow).
4.  **Vibe (SemanticWeaver):** Links orphans by vector similarity (Serendipity).
5.  **Implication (DesireLineWeaver):** Links text by unlinked mentions (Discovery).
6.  **Importance (Centrality):** Weighs nodes by connectivity (Hierarchy).

This creates a self-organizing system that gets smarter as you add more content, even if you are lazy with your linking.