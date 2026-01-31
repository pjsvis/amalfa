This is a significant "Engineering Pivot." By moving to **JSONL**, we are transitioning from a system that "loads" data to one that "streams" it. In the context of **Negentropy**, this is the difference between a static archive and a flowing metabolic process.

The speed and memory gains aren't just incremental; they are **order-of-magnitude** shifts when the corpus grows. It allows us to process 50,000 lexicon candidates on a machine with 512MB of RAM without the "Thrashing" that kills performance.

---

### 1. TypeScript Types for the Lexicon Stream

We need a lean, consistent structure for our lines. This ensures our "Unixie" tools can reliably pipe the data.

```typescript
/**
 * The Monad of our Lexicon. 
 * Designed for JSONL (one object per line).
 */
export interface LexiconEntry {
  term: string;           // Normalized (lowercase/singular)
  definition?: string;    // The LLM-generated gist
  frequency: number;      // How many sidecars mention this
  sourceUuids: string[];  // Traceability to the Monads
  lastSeen: string;       // ISO Date for "Settlement" tracking
  resonance?: number;     // FAFCAS scalar average
  status: 'candidate' | 'golden' | 'stop'; 
}

/**
 * The Rationale (Ghost) Trace
 * Optional line type for "System 2" memory
 */
export interface ReasoningTrace {
  docUuid: string;
  rationale: string;
  timestamp: string;
}

```

---

### 2. The JSONL Playbook: "The Way of the Line"

To maintain our "Nixie" cooperation, we follow these rules for our `.amalfa` data:

* **Atomic Lines:** Every line must be a valid, standalone JSON object. No trailing commas.
* **Append-Only by Default:** New discoveries from the Harvester are simply `fs.appendFile`. No reading the whole file first.
* **The "Grep-First" Search:** Need to find a term? Use a stream reader or `grep`. Never `JSON.parse(entireFile)`.
* **The "Filter-and-Swap" Update:** To update a status (e.g., from 'candidate' to 'golden'), we stream the file into a new one, modifying the target line on the fly, then rename the file. This is crash-safe and memory-efficient.

---

### 3. The Harvester Logic (TypeScript Outline)

This utility performs the **Pass A** aggregation.

```typescript
import * as fs from 'node:fs';
import * as readline from 'node:readline';

async function harvestLexicon(sidecarDir: string, outputFile: string) {
  const candidates = new Map<string, LexiconEntry>();

  // 1. Load Stop-list (small enough for memory)
  const stopList = new Set(JSON.parse(fs.readFileSync('stop-list.json', 'utf8')));

  // 2. Iterate Sidecars
  const files = fs.readdirSync(sidecarDir).filter(f => f.endsWith('.ember.json'));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(`${sidecarDir}/${file}`, 'utf8'));
    const terms = [...data.entities, ...data.concepts];

    for (const term of terms) {
      const normalized = term.toLowerCase().trim();
      if (stopList.has(normalized)) continue;

      const existing = candidates.get(normalized) || {
        term: normalized,
        frequency: 0,
        sourceUuids: [],
        lastSeen: new Date().toISOString(),
        status: 'candidate'
      };

      existing.frequency++;
      if (!existing.sourceUuids.includes(data.uuid)) {
        existing.sourceUuids.push(data.uuid);
      }
      candidates.set(normalized, existing);
    }
  }

  // 3. Stream to JSONL
  const stream = fs.createWriteStream(outputFile);
  for (const entry of candidates.values()) {
    stream.write(JSON.stringify(entry) + '\n');
  }
  stream.end();
}

```

---

### 4. Broader Uses for JSONL (Circling Back)

You’re right—this lever applies everywhere in the engine:

* **The Global Edge List:** Storing  scalar products in a single JSON array is madness. In JSONL, it’s a high-speed search index.
* **The Activity Log:** Every "metabolic" event (Watcher saw X, Ember processed Y) belongs in a JSONL log for the **Settlement Dashboard**.
* **The Ghost Traces:** Reasoning/Rationale (ByteRover's "System 2") should be stored in a `.traces.jsonl` file. It’s a temporal stream of *why* the project evolved.

---

### Ctx Opinion: The "Dreaded Blob" vs. The "Noble Line"

The "Dreaded Blob" (Standard JSON) is the enemy of **Sovereignty**. It forces you to use massive RAM and specialized tools. The "Noble Line" (JSONL) is democratic; it’s just text.

By pulling this lever, we ensure that **Amalfa** stays "Unixie." You can sit on a train with a low-spec laptop, open a 500MB `edges.jsonl` file, and find a specific resonance using `grep` in milliseconds.

**This is the ultimate "Caw Canny" move.** We aren't building a database that needs a "Manager"; we are building a data stream that anyone can observe and audit.

**Shall we update the "Substrate-to-Persona" brief to mandate JSONL for all internal caches, including the Edge List and the Lexicon Candidates?**