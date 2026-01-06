**Locus Tag:** `[Locus: Louvain_Automation_Veracity]`

This is the final automated step in your "Sovereign Stack."

By integrating the **Judicial Veracity** value as the *edge weight*, we ensure that the community detection doesn't just look at *connection*, but at *trusted connection*. A "High Veracity" link will pull nodes together more strongly than a "Speculative" one.

### 1. The Schema Update (Mental Check)

We assume your `edges` table now looks effectively like this. I have added `veracity` as a standard column.

```sql
-- Conceptual Schema Update
ALTER TABLE edges ADD COLUMN veracity REAL DEFAULT 1.0; 
-- 1.0 = Absolute Truth (e.g., "Socrates is Mortal")
-- 0.5 = Speculative (e.g., "AI might be conscious")

```

### 2. The Community Engine (`calc_communities.py`)

This script pulls the graph into Python memory, builds a `networkx` graph using `veracity` as the gravity, computes the communities, and writes the IDs back to your visual layout table.

I have added a **Resolution Slider** logic. To hit your "7 Communities" target, you can tweak the `RESOLUTION` constant:

* **Higher (> 1.0):** More, smaller communities (fractures the graph).
* **Lower (< 1.0):** Fewer, larger communities (merges the graph).

**Requirements:** `pip install networkx python-louvain`

```python
import sqlite3
import networkx as nx
import community as community_louvain # from 'python-louvain'
import sys

# --- Configuration ---
DB_FILE = "polyvis_runtime.db"
RESOLUTION = 1.0 # Tweak this to hit your "7 Communities" target
# If you get 20 communities, try 0.8. If you get 3, try 1.2.

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def compute_communities():
    print(f"--- 🧠 Starting Louvain Community Detection (Res={RESOLUTION}) ---")
    conn = get_db()
    
    # 1. Fetch Graph Data
    # We join nodes to get names (for the graph) and IDs
    print("   Loading graph from SQLite...")
    cursor = conn.cursor()
    
    # Fetch edges with their Veracity weight
    # We use COALESCE to ensure we never have None weights (crash prevention)
    cursor.execute("""
        SELECT 
            s.name as source, 
            t.name as target, 
            COALESCE(e.veracity, 1.0) * COALESCE(e.confidence, 1.0) as weight
        FROM edges e
        JOIN nodes s ON e.source_id = s.id
        JOIN nodes t ON e.target_id = t.id
    """)
    rows = cursor.fetchall()
    
    if not rows:
        print("❌ No edges found. Run the Harvester first.")
        return

    # 2. Build NetworkX Graph
    G = nx.Graph()
    for row in rows:
        # The 'weight' parameter is critical here.
        # It tells Louvain that 'High Veracity' edges are stronger bonds.
        G.add_edge(row['source'], row['target'], weight=row['weight'])
    
    print(f"   Graph built: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges.")

    # 3. Run Louvain
    # best_partition returns a dict: {node_name: community_id}
    try:
        partition = community_louvain.best_partition(
            G, 
            weight='weight',
            resolution=RESOLUTION,
            random_state=42 # Deterministic output for visual stability!
        )
    except Exception as e:
        print(f"❌ Louvain Error: {e}")
        return

    num_communities = len(set(partition.values()))
    print(f"   ✅ Detected {num_communities} communities.")
    
    if num_communities > 10:
        print("   ⚠️  Hint: Lower RESOLUTION to merge small clusters.")
    elif num_communities < 4:
        print("   ⚠️  Hint: Raise RESOLUTION to split large clusters.")

    # 4. Write Back to SQLite (Visual Layer)
    print("   Persisting to 'node_layout' table...")
    cursor.execute("BEGIN TRANSACTION;")
    
    update_count = 0
    for node_name, comm_id in partition.items():
        # We update the existing layout entry. 
        # If the node isn't in layout yet (rare), we insert a stub.
        cursor.execute("""
            INSERT INTO node_layout (node_name, community) VALUES (?, ?)
            ON CONFLICT(node_name) DO UPDATE SET community = excluded.community
        """, (node_name, comm_id))
        update_count += 1
        
    conn.commit()
    conn.close()
    print(f"   💾 Updated {update_count} nodes with community IDs.")
    print("--- Done. Refresh Graphology to see changes. ---")

if __name__ == "__main__":
    compute_communities()

```

### 3. Integrating into the Workflow

You can now add this to your `Makefile` or `run_ingest.sh` as the final step.

**Updated `run_ingest.sh` sequence:**

1. **Harvester:** Extracts Triples (Logic).
2. **Loader:** Hydrates SQLite (Truth).
3. **Community Engine:** Calculates Structure (Topology).
4. **Frontend:** Reads SQLite -> Renders Graph (Beauty).

### A Note on "Judicial Veracity"

This script multiplies `veracity` * `confidence`.

* **Confidence:** "The AI is 90% sure the text *says* this." (Extraction quality)
* **Veracity:** "The edge itself is 100% *true*." (Fact quality)

This compound weight ensures that your visualization clusters around **high-certainty truths**, while speculative or low-confidence noise is pushed to the periphery of the communities.

**Would you like me to now summarize this entire session into a single "Project Brief" artifact that you can save to your repository to document this architecture?**