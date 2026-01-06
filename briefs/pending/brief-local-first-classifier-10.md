**Locus Tag:** `[Locus: Graph_Stability_Strategy]`

### Opinion: The Sparsity Trap & The "Magic Number 7"

Your strategy of targeting ~7 communities (aligning with **Miller's Law** of cognitive load: ) is sound for *human* consumption. However, applying **Louvain Community Detection** to a graph with "not many edges" introduces a specific risk: **The Sparsity Instability**.

1. **The Algorithmic Risk:** Louvain optimizes for *modularity* (density of edges inside a community vs. outside). In a sparse graph, modularity is brittle. Adding a single edge via the Harvester could cause two of your "7 Communities" to suddenly merge, or one to shatter. This violates your goal of "keeping parameters constant" because the *topology itself* is volatile.
2. **The "Archipelago" Effect:** With few edges, you likely don't have a single connected component; you have disconnected "islands." Force-directed layouts (like ForceAtlas2, commonly used with Sigma) will push these islands infinitely far apart unless bounded.
3. **Strategic Fix:** Your visual stability relies on **Densification**. The "Harvester" pipeline we just designed is not just for adding data; it is structural reinforcement. You need more `RELATED_TO` edges to act as the "gravity" that holds the 7 communities together.

### The Solution: Non-Destructive "Smart Upsert"

To maintain your "Constant Visual Parameters" while the Harvester aggressively adds new nodes and edges, we must implement the **Separation of Concerns** schema.

This loader ensures that when you re-run the pipeline, **Sigma.js's layout data (x, y, color)** is preserved, while the **SQLite runtime** gets the fresh data.

### Artifact: The Smart Hydrator (`loader_v2.py`)

This script replaces the previous simple loader. It uses `UPSERT` logic (valid in SQLite 3.24+) to update semantic data without touching visual data.

```python
import json
import sqlite3
import os

# --- Configuration ---
JSON_ARTIFACT = "knowledge_graph.json"
DB_FILE = "polyvis_runtime.db"

# 1. THE SCHEMA (Applied if not exists)
SCHEMA_SQL = """
-- SEMANTIC LAYER (The Truth)
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'concept'
);

CREATE TABLE IF NOT EXISTS edges (
    source_id INTEGER,
    target_id INTEGER,
    relation TEXT,
    confidence REAL,
    context_source TEXT,
    UNIQUE(source_id, target_id, relation) ON CONFLICT REPLACE
);

-- VISUAL LAYER (The Beauty - Persistent)
-- Note: 'node_name' links back to 'nodes.name'
CREATE TABLE IF NOT EXISTS node_layout (
    node_name TEXT PRIMARY KEY,
    x REAL,
    y REAL,
    color TEXT,
    size REAL,
    community INTEGER -- Store your Louvain result here to persist it!
);
"""

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def hydrate():
    if not os.path.exists(JSON_ARTIFACT):
        print("⚠️  Artifact not found.")
        return

    print(f"🔄 Smart-Loading {JSON_ARTIFACT}...")
    with open(JSON_ARTIFACT, 'r') as f:
        triples = json.load(f)

    conn = get_db()
    conn.executescript(SCHEMA_SQL)
    cursor = conn.cursor()

    cursor.execute("BEGIN TRANSACTION;")
    
    nodes_seen = set()
    edges_count = 0

    try:
        for item in triples:
            src = item['source']
            tgt = item['target']
            rel = item['rel'].upper()
            
            # 1. UPSERT NODES (Semantic Only)
            # We ignore 'type' updates here for brevity, but you could update them.
            cursor.execute("INSERT OR IGNORE INTO nodes (name) VALUES (?)", (src,))
            cursor.execute("INSERT OR IGNORE INTO nodes (name) VALUES (?)", (tgt,))
            
            # Get IDs for edge creation
            cursor.execute("SELECT id FROM nodes WHERE name = ?", (src,))
            src_id = cursor.fetchone()[0]
            cursor.execute("SELECT id FROM nodes WHERE name = ?", (tgt,))
            tgt_id = cursor.fetchone()[0]

            # 2. UPSERT EDGES
            # We use REPLACE to update confidence/source if it changes
            cursor.execute("""
                INSERT INTO edges (source_id, target_id, relation, confidence, context_source)
                VALUES (?, ?, ?, ?, ?)
            """, (src_id, tgt_id, rel, item.get('confidence_score', 1.0), item.get('context_source')))
            
            # 3. INITIALIZE LAYOUT (If New)
            # We insert a default layout ONLY if the node is new. 
            # Existing x/y/color from Sigma.js are untouched.
            cursor.execute("""
                INSERT OR IGNORE INTO node_layout (node_name, x, y, color, size)
                VALUES (?, RANDOM(), RANDOM(), '#999', 10)
            """, (src,))
            cursor.execute("""
                INSERT OR IGNORE INTO node_layout (node_name, x, y, color, size)
                VALUES (?, RANDOM(), RANDOM(), '#999', 10)
            """, (tgt,))
            
            edges_count += 1

        conn.commit()
        print(f"✅ Smart Load Complete. {edges_count} edges processed.")
        print("   Visual state preserved in 'node_layout' table.")

    except Exception as e:
        conn.rollback()
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    hydrate()

```

### The "Visual REPL" Workflow

With this loader, your workflow becomes:

1. **Ingest:** Run `make ingest`. The graph updates with new edges.
2. **Visualize:** Open your Graphology/Sigma app.
* *New nodes* appear at random positions (gray).
* *Old nodes* stay exactly where you left them (colored by your manual Louvain assignment).


3. **Compute:** Run Louvain **inside the browser** (Graphology) or via a Python script that updates the `node_layout.community` column.
4. **Save:** If you calculate Louvain in Python, write the result back to `node_layout`.

**Would you like a Python snippet to run the Louvain algorithm on this SQLite data and write the community IDs back to the `node_layout` table, effectively automating your "7 Communities" target?**