# Performance Baselines & Benchmarks

> **Last Updated:** 2025-12-16
> **Device:** Apple Silicon (M-series)
> **Node/Bun:** Bun v1.3.4+

## 1. Memory Footprint (Daemon)
The Daemon run-time consists of the `Core Kernel`, `VectorEngine (WASM)`, and `Data Graph`.

| Component | RAM Usage (RSS) | Scaling Nature | Notes |
| :--- | :--- | :--- | :--- |
| **AI Model (fastembed)** | **~252 MB** | 🛑 **Fixed** | Unavoidable one-time cost for local embedding. |
| **Daemon Runtime** | **~60 MB** | 🛑 **Fixed** | Bun runtime + SQLite + Kernel overhead. |
| **Graph Structure** | **~14 kB / node** | 🟢 **Variable** | Graphology in-memory graph representation. |
| **Raw Data** | **~9 kB / node** | 🟢 **Variable** | Text content and metadata objects. |
| **Vectors** | **~2 kB / node** | 🟢 **Variable** | Float32Arrays and normalized buffers. |

### Total Daemon Footprint
- **Empty State**: ~310 MB
- **Current State (429 nodes)**: ~320 MB
- **PROJECTED (10k nodes)**: ~560 MB

## 2. Storage Footprint (Disk)
Benchmarks from `public/resonance.db`.

| Metric | Size / Count | Notes |
| :--- | :--- | :--- |
| **DB File Size** | 6.09 MB | SQLite WAL mode enabled. |
| **Vector Data** | 1.42 MB | Blob storage. |
| **Text Content** | 1.00 MB | Raw text in `content` column. |
| **Node Count** | 429 | Including Experience & Persona domains. |

## 3. How to Measure
### Memory
1. Ensure `graphology` is installed (temporarily): `bun add graphology`.
2. Uncomment the graphology section in `scripts/profile_memory.ts`.
3. Run: `bun run scripts/profile_memory.ts`.
4. Revert: `bun remove graphology`.

### Disk / DB Stats
1. Run: `bun run scripts/assess_db_weight.ts`.

## 4. Ingestion Baselines (Comparison)

> **Baseline Source:** `_misc/ingestion-baseline.json` (2025-12-11)

| Metric | Baseline (Dec 11) | Current (Dec 16) | Delta | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Persona Nodes** | 185 | 185 | **0** | Stable. Core lexicon. |
| **Experience Nodes** | 128 | 244 | **+116** | Significant growth (new sessions/debriefs). |
| **Total Nodes** | 313 | 429 | **+116** | ~37% Growth. |
| **Total Edges** | 498 | 631 | **+133** | ~27% Growth. |
| **Total Vectors** | 289 | 242 | **-47** | 📉 **Intentional Optimization** |

### Insights
-   **Vector Efficiency**: Despite node growth (+37%), vector count dropped (-16%). This reflects the **"Narrative Vector Strategy"**, where only high-value content (Concepts, Playbooks) is vectorized, while structural nodes (Logs, raw fragments) are skipped.
-   **Graph Connectivity**: Edge growth (+27%) tracks closely with node growth, maintaining decent density.

## 5. Speed Benchmarks (Dec 16)

> **Environment**: Apple Silicon (M-series) | Bun v1.3.4

| Operation | Latency | Notes |
| :--- | :--- | :--- |
| **Model Load (Cold)** | **~192 ms** | One-time initialization cost. |
| **Vector Search** | **~71 ms** | Avg of 10 runs (Top-5 search). |
| **SQL Insert (Raw)** | **~0.001 ms/row** | Batch prepared statement (Buffered). |
| **SQL Insert (ORM)** | **~0.012 ms/row** | Drizzle ORM overhead (~12x slower than raw). |

## 6. Vector Inclusion Rules (Audit)

> **Policy:** "Everything in the folders noted in the settings file should be in the vector store."

**Audit Results (Dec 16):**

| Domain | Source | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Experience** | `debriefs/` | ✅ **100% Vectorized** | Narrative content. |
| **Experience** | `playbooks/` | ✅ **100% Vectorized** | Procedural knowledge. |
| **Experience** | `briefs/` | ✅ **100% Vectorized** | Context setting. |
| **Experience** | `docs/` | ✅ **100% Vectorized** | Project documentation. |
| **Persona** | `lexicon.json` | ⚪ **Excluded** | *Optimization*: Concepts matched via Keywords/Graph. |
| **Persona** | `cda.json` | ⚪ **Excluded** | *Optimization*: Directives matched via Keywords/Graph. |
| **Experience** | `test-artifacts` | ⚪ **Excluded** | *Transient*: `test-doc-1` & `test-doc-2` (from test scripts). |

**Conclusion:**
The logic complies with the rule. All folder-based narrative content is vectorized. File-based structured data (Persona) is excluded to save memory, as it is efficiently retrievable via exact graph traversal. The only un-vectorized `document` nodes are confirmed test artifacts.

