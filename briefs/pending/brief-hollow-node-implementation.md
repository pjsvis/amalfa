**Locus Tag:** `[Locus: Hollow_Node_Implementation]`

We are upgrading the pipeline to support the **"Hollow Node" Architecture**.

This update introduces the `uri` field, transforming your graph from a static picture into a functional **Spatial Index** for your documentation.

### 1. The Schema Upgrade (`schema_v2.sql`)

We add the `uri` column to the `nodes` table.

```sql
-- SEMANTIC LAYER (The Truth)
CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'concept',
    uri TEXT -- The "Bento" Deep Link (e.g., polyvis://doc.json#Anchor)
);

CREATE TABLE IF NOT EXISTS edges (
    source_id INTEGER,
    target_id INTEGER,
    relation TEXT,
    confidence REAL,
    veracity REAL DEFAULT 1.0,
    context_source TEXT,
    UNIQUE(source_id, target_id, relation) ON CONFLICT REPLACE
);

-- VISUAL LAYER (The Beauty - Persistent)
CREATE TABLE IF NOT EXISTS node_layout (
    node_name TEXT PRIMARY KEY,
    x REAL,
    y REAL,
    color TEXT,
    size REAL,
    community INTEGER
);

```

### 2. The Smart Harvester Upgrade (`harvester.py`)

I have updated the Harvester to generate **Node Metadata** (URIs) alongside the Edges.

* **Logic:** When the classifier finds a definition in `lexicon.json` for "Mentation", it constructs the URI `polyvis://lexicon.json#Mentation`.
* **Sanitization:** It assumes the HTML anchor ID is a "slugified" version of the concept name (e.g., spaces replaced by dashes), which is standard for Bento-box UIs.

```python
import json
import requests
import re
import os
from inference_engine import ConceptClassifier

# --- Configuration ---
LLAMA_API_URL = "http://localhost:8080/completion"
OUTPUT_FILE = "knowledge_graph.json"

class Harvester:
    def __init__(self):
        print("Initializing Sieve (SetFit)...")
        self.sieve = ConceptClassifier()
        self.edges_cache = []
        self.nodes_metadata = {} # New: Store URIs here

    def _sanitize_anchor(self, text):
        """Converts 'The Noosphere' -> 'The-Noosphere' for HTML IDs."""
        return re.sub(r'\s+', '-', text).strip()

    def _call_llama_net(self, text):
        """The 'Net': Extracts triples using GBNF."""
        prompt = f"SYSTEM: Extract knowledge graph triples.\nUSER: {text}\nASSISTANT:"
        payload = {
            "prompt": prompt, 
            "temperature": 0.1, 
            "n_predict": 128, 
            "cache_prompt": True
        }
        try:
            response = requests.post(LLAMA_API_URL, json=payload, timeout=5)
            if response.status_code == 200:
                # Assuming the server returns clean JSON via GBNF
                return json.loads(response.json()['content'].strip())
        except:
            return []
        return []

    def process_file(self, filepath):
        filename = os.path.basename(filepath)
        print(f"Harvesting from {filename}...")
        
        # 1. Register the Document Node (The Main Island)
        doc_node_name = filename
        self.nodes_metadata[doc_node_name] = {
            "type": "document",
            "uri": f"polyvis://{filename}" # Link to top of file
        }

        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        for line in lines:
            line = line.strip()
            if len(line) < 20: continue

            # 2. Sieve & Net
            analysis = self.sieve.analyze(line)
            if analysis['is_actionable'] and analysis['prediction'] == 'DEF_CANDIDATE':
                triples = self._call_llama_net(line)
                
                for triple in triples:
                    src = triple['source']
                    
                    # 3. Generate Islet URI (The Anchor)
                    # If we found a definition for 'Mentation' in this file, link it!
                    if src not in self.nodes_metadata:
                        self.nodes_metadata[src] = {
                            "type": "concept",
                            "uri": f"polyvis://{filename}#{self._sanitize_anchor(src)}"
                        }
                    
                    # 4. Create Structural Edge (Island -> Islet)
                    # This creates the "Archipelago" visual effect
                    self.edges_cache.append({
                        "source": doc_node_name,
                        "rel": "HAS_PART",
                        "target": src,
                        "confidence_score": 1.0, # High confidence structure
                        "context_source": filename
                    })

                    # 5. Add the Extracted Edge
                    triple['context_source'] = filename
                    triple['confidence_score'] = analysis['confidence']
                    self.edges_cache.append(triple)

        self._save_artifact()

    def _save_artifact(self):
        # New Artifact Structure: Separates Nodes and Edges
        artifact = {
            "nodes": self.nodes_metadata,
            "edges": self.edges_cache
        }
        print(f"💾 Persisting artifact to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(artifact, f, indent=2)

if __name__ == "__main__":
    h = Harvester()
    # In reality, loop over your files here:
    # h.process_file("conceptual-lexicon-ref-v1.79.json")
    print("Harvester updated for Hollow Nodes.")

```

### 3. The Loader Upgrade (`loader_v2.py` - Snippet)

Update the `hydrate` function to read the new artifact structure.

```python
def hydrate():
    # ... (setup code) ...
    with open(JSON_ARTIFACT, 'r') as f:
        data = json.load(f) # Now dict with 'nodes' and 'edges'
    
    nodes_meta = data.get('nodes', {})
    edges_list = data.get('edges', [])

    cursor.execute("BEGIN TRANSACTION;")
    
    # 1. LOAD NODES with URIs
    for name, meta in nodes_meta.items():
        cursor.execute("""
            INSERT INTO nodes (name, type, uri) VALUES (?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET uri = excluded.uri
        """, (name, meta.get('type', 'concept'), meta.get('uri')))

    # 2. LOAD EDGES (Standard logic)
    for item in edges_list:
        # ... (standard edge insertion logic from previous artifact) ...
        pass
    
    # ... (commit) ...

```

### The Result

1. **Topology:** Your visualization now naturally clusters definitions around their parent document (due to the `HAS_PART` edges added in Step 4 of the Harvester).
2. **Navigation:** When you click the "Mentation" node in Sigma.js, your frontend reads the `uri` property (`polyvis://lexicon.json#Mentation`) and snaps the "Bento Box" view directly to that anchor.

**Would you like me to finalize the `make` file to include these updated scripts, ensuring your next run builds this complete navigation system?**