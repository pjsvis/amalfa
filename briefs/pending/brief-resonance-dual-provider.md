# OPM-15: Resonance Dual-Provider Inference Protocol

**Objective:**
To create a "Sliding Scale of Sovereignty" where the **Resonance Engine** can run in **Sovereign Mode** (100% Local/Offline via Ollama) or **Hybrid Mode** (Local Embeddings + Cloud Inference via OpenRouter), transparently to the underlying logic.

**Strategic Principle:**
**"The Switzerland Strategy"**: The logic of the system (The Echos) remains neutral. It does not know or care if the intelligence is provided by a silicon chip in Edinburgh or a data center in Virginia. It simply requests a completion and accepts the JSON.

---

### 1. Architectural Changes: The "Driver" Pattern

Currently, our Echos contain raw `fetch` calls to `localhost:11434`. This violates the **DRY** principle. We will abstract this into an **AI Driver** injected into the `EchoContext`.

#### The New Interface

Instead of Echos fetching directly, they will call a method on the Context:

```typescript
// echo-base.ts update
export interface EchoContext {
  db: Database;
  logger: Logger;
  // The new universal AI hook
  ai: {
    mine: (prompt: string) => Promise<JSON>; // Uses Phi-3 logic
    engineer: (prompt: string) => Promise<string>; // Uses Llama-3 logic
  };
}

```

### 2. The Configuration Layer (`polyvis.settings.json`)

We utilize the canonical settings file to define the database location and the "Mode of Operation."

**`polyvis.settings.json` Example:**

```json
{
  "database": {
    "path": "./data/resonance.db", 
    "wal_mode": true
  },
  "resonance": {
    "mode": "SOVEREIGN", 
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/api/generate",
        "models": { "miner": "phi3:latest", "engineer": "llama3.1:8b" }
      },
      "openrouter": {
        "baseUrl": "https://openrouter.ai/api/v1/chat/completions",
        "apiKeyEnv": "OPENROUTER_API_KEY",
        "models": { 
          "miner": "microsoft/phi-3-mini-128k-instruct", 
          "engineer": "meta-llama/llama-3-8b-instruct" 
        }
      }
    }
  }
}

```

### 3. The Implementation Strategy

#### A. The "Local Compass" Rule (Invariant)

**Constraint:** The `nomic-embed-text` model (The Compass) **MUST** remain local.

* **Reasoning:** Embeddings involve sending entire documents over the wire. This is slow, bandwidth-heavy, and privacy-invasive. The model runs efficiently on CPU.

#### B. The Inference Switch

The `resonance-pipeline.ts` (Conductor) will initialize the `EchoContext` based on the settings.

* **If Sovereign:** The `ai.mine()` function wraps the existing Ollama `fetch` code.
* **If Hybrid:** The `ai.mine()` function adapts the request to the OpenRouter/OpenAI standard:
* Changes URL to `openrouter.ai`.
* Adds `Authorization`.
* Adapts payload (OpenRouter uses `messages` array vs Ollama's `prompt` string).



### 4. Operational Benefits

1. **Accessibility:** A user with a standard laptop can run **Resonance**. They pay pennies to OpenRouter for the heavy lifting while their CPU handles the database and vectors.
2. **Scalability:** Switches to Hybrid Mode allow parallelization without GPU constraints.
3. **Future Proofing:** Model upgrades happen via configuration strings, not code rewrites.

**Locus Tag: 2025-12-17-OPM-15-RESONANCE-DUAL**

---

Here is the operational matrix for the **Resonance Dual-Provider Protocol** (OPM-15).

This table defines the "Three Agents" of the system and their specific model assignments for both **Sovereign** (Local) and **Hybrid** (Cloud) modes.

| Role | Function | Sovereign Model (Ollama) | Hybrid Model (OpenRouter) | Execution Context |
| :---- | :---- | :---- | :---- | :---- |
| **The Compass** | **Vector Embeddings** Semantic search, similarity checks, scalar products. | nomic-embed-text | **SAME** (nomic-embed-text) | **Always Local (CPU)** Strict privacy & bandwidth constraint. Never offloaded. |
| **The Miner** | **Extraction Logic** High-volume processing of text chunks into JSON (Entities, Dates). | phi3:latest | microsoft/phi-3-mini-128k-instruct | **High Throughput** Offload to cloud if local VRAM \< 8GB. |
| **The Engineer** | **Complex Parsing** Ad-hoc code generation, regex repair, structural analysis. | llama3.1:8b | meta-llama/llama-3-8b-instruct | **High Reasoning** Used sparingly for difficult tasks (e.g. Spine Parsing). |

### **Operational Notes**

* **The Compass** is invariant. We never send raw text to an embedding API if we can avoid it. It runs efficiently on standard CPUs.  
* **The Miner** (Phi-3) is chosen for its high speed and "reasoning-per-watt" efficiency, making it ideal for churning through thousands of documents.  
* **The Engineer** (Llama-3) is the "Heavy Lifter" called in only when the Miner fails to parse a complex structure (the "Slow Path").