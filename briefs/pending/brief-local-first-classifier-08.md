**Locus Tag:** `[Locus: SQLite_Loader_Schema]`

This is the final component of the **Idempotent Pipeline**.

The strategy here is **"Nuke and Pave"** (or robust Upsert). Because your extraction pipeline is repeatable and stored in a sidecar (`knowledge_graph.json`), we can treat the database as ephemeral. On application boot, we can drop the tables and reload them in milliseconds, ensuring the "Runtime" is always perfectly synced with your artifacts.

### Artifact 1: The Schema (`schema.sql`)

This SQL structure is optimized for graph traversals. We use strict foreign keys and unique constraints to ensure data integrity.

```sql
-- 1. CLEAN SLATE (Idempotency)
-- If we are treating this as a runtime cache, we drop old tables to ensure 
-- no "ghost" edges remain from deleted documents.
DROP TABLE IF EXISTS edges;
DROP TABLE IF EXISTS nodes;

-- 2. NODES
-- The atoms of the Noosphere.
CREATE TABLE nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL COLLATE NOCASE, -- 'Polyvis' == 'polyvis'
    type TEXT DEFAULT 'concept',       -- e.g., 'concept', 'heuristic', 'person'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure we never have duplicate nodes for the same concept
    CONSTRAINT name_unique UNIQUE (name)
);

-- 3. EDGES
-- The molecular bonds.
CREATE TABLE edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    target_id INTEGER NOT NULL,
    relation TEXT NOT NULL,            -- e.g., 'IMPLEMENTS', 'IS_A'
    confidence REAL DEFAULT 1.0,       -- Derived from SetFit score
    context_source TEXT,               -- Which file/chat log this came from
    
    FOREIGN KEY(source_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target_id) REFERENCES nodes(id) ON DELETE CASCADE,
    
    -- Prevent duplicate identical edges
    CONSTRAINT edge_unique UNIQUE (source_id, target_id, relation)
);

-- 4. INDEXES
-- Crucial for fast recursive traversal (finding all children/parents)
CREATE INDEX idx_edges_source ON edges(source_id);
CREATE INDEX idx_edges_target ON edges(target_id);

```

### Artifact 2: The Hydrator (`loader.py`)

This Python script reads your sidecar JSON and aggressively inserts it into the SQLite Runtime. It uses **Transactions** (`BEGIN`...`COMMIT`) to ensure it runs at maximum speed (thousands of nodes per second).

```python
import json
import sqlite3
import os

# --- Configuration ---
JSON_ARTIFACT = "knowledge_graph.json"
DB_FILE = "polyvis_runtime.db" # Or ":memory:" for pure RAM speed
SCHEMA_FILE = "schema.sql"

def get_db_connection():
    """Establishes connection and enables Foreign Keys."""
    conn = sqlite3.connect(DB_FILE)
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_schema(conn):
    """Applies the Nuke and Pave schema."""
    print("initializing schema...")
    with open(SCHEMA_FILE, 'r') as f:
        conn.executescript(f.read())

def get_or_create_node(cursor, name):
    """
    Idempotent Node Insertion.
    Returns the ID of the node (whether it was just created or already existed).
    """
    # 1. Try to Insert
    try:
        cursor.execute("INSERT INTO nodes (name) VALUES (?)", (name,))
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        # 2. If it exists, Fetch ID
        cursor.execute("SELECT id FROM nodes WHERE name = ?", (name,))
        result = cursor.fetchone()
        return result[0] if result else None

def hydrate():
    if not os.path.exists(JSON_ARTIFACT):
        print(f"⚠️ Artifact {JSON_ARTIFACT} not found. Run Harvester first.")
        return

    print(f"Loading {JSON_ARTIFACT} into {DB_FILE}...")
    
    with open(JSON_ARTIFACT, 'r', encoding='utf-8') as f:
        triples = json.load(f)

    conn = get_db_connection()
    init_schema(conn)
    cursor = conn.cursor()

    # BEGIN TRANSACTION for speed
    cursor.execute("BEGIN TRANSACTION;")
    
    count = 0
    try:
        for item in triples:
            # 1. Resolve Nodes
            source_id = get_or_create_node(cursor, item['source'])
            target_id = get_or_create_node(cursor, item['target'])
            
            # 2. Insert Edge
            # INSERT OR IGNORE handles cases where the exact same edge appears twice
            cursor.execute("""
                INSERT OR IGNORE INTO edges 
                (source_id, target_id, relation, confidence, context_source)
                VALUES (?, ?, ?, ?, ?)
            """, (
                source_id, 
                target_id, 
                item['rel'].upper(), # Normalize relations
                item.get('confidence_score', 1.0),
                item.get('context_source', 'unknown')
            ))
            count += 1
            
        conn.commit()
        print(f"✅ Hydration Complete. Ingested {count} relationships.")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error during hydration: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    hydrate()

```

### Operational Note: The "Super-Query"

Now that the data is in SQLite, you can perform queries that would be impossible with a simple vector search.

For example, **"Find the full dependency tree of 'Polyvis'"** (Recursive Common Table Expression):

```sql
WITH RECURSIVE descendants(id, name, depth) AS (
    -- Base Case: Start at 'Polyvis'
    SELECT n.id, n.name, 0
    FROM nodes n WHERE n.name = 'Polyvis'
    
    UNION ALL
    
    -- Recursive Step: Find everything 'Polyvis' relates to
    SELECT n.id, n.name, d.depth + 1
    FROM nodes n
    JOIN edges e ON e.target_id = n.id
    JOIN descendants d ON e.source_id = d.id
    WHERE d.depth < 5 -- Safety brake
)
SELECT * FROM descendants;

```

**Would you like me to package this entire "Sieve, Net, Loader" workflow into a single `make` target or shell script (e.g., `./run_ingest.sh`) for one-click execution?**