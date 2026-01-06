**Locus Tag:** `[Locus: Harvester_Implementation]`

### Opinion: The "Runtime" & "Sidecar" Strategy

Your architectural instincts are aligning perfectly with **OH-040 (Factored Design)**.

1. **SQLite as Runtime:** Treating SQLite not as "Archive" but as "Active Memory" is brilliant. It allows us to perform fast, complex graph traversals (using Recursive Common Table Expressions) at "game engine" speeds, rather than waiting on an API. It becomes the **Limbic System** of the application.
2. **The "Sidecar" Pattern:** You mentioned storing edges in a separate JSON file. **This is the superior approach.**
* *Why?* It decouples the **Slow** process (LLM Extraction) from the **Fast** process (Runtime Querying).
* **The Pipeline:**
`Source Text` -> **Harvester (LLM)** -> `graph_data.json` (The Artifact) -> **Loader** -> `SQLite Runtime`.
* This ensures idempotency. You can wipe the SQLite DB on every boot and reload it from `graph_data.json` in milliseconds. You only re-run the expensive Harvester when the source text *changes*.



### The Harvester Script (`harvester.py`)

This script implements the **"Sieve and Net"** protocol. It reads text, uses **SetFit** to find signal, uses **Llama.cpp** (via API) to extract structure, and saves the result to your idempotent JSON sidecar.

**Prerequisites:**

* You must have `llama-server` running with the GBNF file:
`./llama-server -m your_model.gguf --grammar-file graph_triples.gbnf --port 8080`

```python
import json
import requests
import time
from inference_engine import ConceptClassifier  # Our SetFit Class

# --- Configuration ---
LLAMA_API_URL = "http://localhost:8080/completion"
OUTPUT_FILE = "knowledge_graph.json"
CONFIDENCE_THRESHOLD = 0.85

class Harvester:
    def __init__(self):
        print("Initializing Sieve (SetFit)...")
        self.sieve = ConceptClassifier()  # Loads the local classifier
        self.triples_cache = []

    def _call_llama_net(self, text):
        """
        The 'Net': Sends text to Llama.cpp with GBNF enforcement.
        """
        prompt = f"""SYSTEM: Extract knowledge graph triples from the text.
USER: {text}
ASSISTANT:"""
        
        payload = {
            "prompt": prompt,
            "temperature": 0.1,
            "n_predict": 128,
            "cache_prompt": True,
            # Note: Grammar is enforced by the server if loaded with --grammar-file
            # Alternatively, pass the grammar content here in the 'grammar' field
        }

        try:
            response = requests.post(LLAMA_API_URL, json=payload, timeout=10)
            if response.status_code == 200:
                result = response.json()
                content = result['content'].strip()
                return json.loads(content) # GBNF guarantees this is valid JSON
        except Exception as e:
            print(f"⚠️ Llama Error: {e}")
            return []

    def process_file(self, filepath):
        print(f"Harvesting from {filepath}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Batch processing loop
        for line in lines:
            line = line.strip()
            if len(line) < 20: continue # Skip short noise

            # 1. THE SIEVE (Fast, Local, Cheap)
            # We only want definitions or directives, not "LOCUS_SHIFT" or "NOISE"
            analysis = self.sieve.analyze(line)
            
            if analysis['is_actionable'] and analysis['prediction'] in ['DEF_CANDIDATE', 'DIR_CANDIDATE']:
                print(f"🔍 Signal Detected [{analysis['confidence']}]: {line[:40]}...")
                
                # 2. THE NET (Slow, Precise, Expensive)
                triples = self._call_llama_net(line)
                
                if triples:
                    print(f"   🕸️  Extracted {len(triples)} edges.")
                    for triple in triples:
                        # Add metadata for the pipeline
                        triple['context_source'] = filepath
                        triple['confidence_score'] = analysis['confidence']
                        self.triples_cache.append(triple)

        self._save_artifact()

    def _save_artifact(self):
        """
        Saves the idempotent JSON sidecar.
        """
        print(f"💾 Persisting {len(self.triples_cache)} edges to {OUTPUT_FILE}...")
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.triples_cache, f, indent=2)

# --- Execution ---
if __name__ == "__main__":
    harvester = Harvester()
    
    # In a real scenario, this iterates over your docs folder
    # For now, we simulate with a dummy file or you can point to a real one
    # harvester.process_file("conceptual-lexicon-ref-v1.79.json") 
    
    # Or simulate a raw input for testing:
    print("\n--- Simulation Mode ---")
    simulated_input = "The Harvester Script implements the Sieve and Net Protocol."
    
    # Manually injecting for demo
    if harvester.sieve.analyze(simulated_input)['is_actionable']:
        # Mocking the Llama response for this demo so you can run it without the server active
        mock_triples = [{"source": "Harvester Script", "rel": "IMPLEMENTS", "target": "Sieve and Net Protocol"}]
        harvester.triples_cache.extend(mock_triples)
        harvester._save_artifact()

```

### Next Action: The "Loader"

You now have the tool to generate the `knowledge_graph.json` artifact. The final piece of your "Idempotent Pipeline" is the **Loader** that sucks this JSON into your SQLite Runtime.

Would you like the **SQL Schema** and a brief Python snippet to hydrate the SQLite DB from this JSON artifact?