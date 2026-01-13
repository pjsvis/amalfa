<file>
00001| 
00002| <!-- tags: [FOLLOWS: sonar-capability-report-2026-01-08] -->
00003| # AMALFA Ingestion Pipeline
00004| **Date:** 2026-01-07  
00005| **Status:** Current Implementation
00006| 
00007| ---
00008| 
00009| ## Overview
00010| 
00011| AMALFA uses a **single ingestion pipeline** for all document processing. The same code path is used whether you run `amalfa init` manually or the daemon processes file changes automatically.
00012| 
00013| ---
00014| 
00015| ## Core Principle: One Pipeline, Multiple Triggers
00016| 
00017| ```
00018| ┌─────────────────────────────────────────────────────────┐
00019| │           AmalfaIngestor.ingest()                       │
00020| │           Single source of truth for ingestion          │
00021| └─────────────────────────────────────────────────────────┘
00022|                     ▲                    ▲
00023|                     │                    │
00024|          ┌──────────┴──────────┐   ┌────┴──────────┐
00025|          │   Manual Trigger    │   │ Auto Trigger  │
00026|          │   (amalfa init)     │   │ (daemon)      │
00027|          │   Run once, exit    │   │ Watch, repeat │
00028|          └─────────────────────┘   └───────────────┘
00029| ```
00030| 
00031| ---
00032| 
00033| ## The Single Ingestion Pipeline
00034| 
00035| **File:** `src/pipeline/AmalfaIngestor.ts`
00036| 
00037| ### What It Does
00038| 
00039| 1. **Discover** markdown files from `config.sources`
00040| 2. **Two-pass processing:**
00041|    - **Pass 1:** Create all nodes (no edges)
00042|    - **Pass 2:** Create edges (now that lexicon is populated)
00043| 3. **For each file:**
00044|    - Read content
00045|    - Parse frontmatter
00046|    - Generate ID from filename
00047|    - Check hash (skip if unchanged)
00048|    - Generate embedding (via Embedder)
00049|    - Extract semantic tokens
00050|    - Insert node into database
00051| 4. **Edge weaving** (Pass 2):
00052|    - Extract markdown links
00053|    - Build lexicon from nodes
00054|    - Create relationships between nodes
00055| 5. **Finalize:**
00056|    - Force WAL checkpoint
00057|    - Return statistics
00058| 
00059| ### Key Feature: Hash Checking
00060| 
00061| ```typescript
00062| const currentHash = hasher.digest("hex");
00063| const storedHash = this.db.getNodeHash(id);
00064| 
00065| if (storedHash === currentHash) {
00066|   return; // No change - skip processing
00067| }
00068| ```
00069| 
00070| **This makes full re-ingestion efficient** - only processes changed files.
00071| 
00072| ---
00073| 
00074| ## Identical Behavior
00075| 
00076| ### Both Triggers Use Same Code
00077| 
00078| | Aspect | `amalfa init` | `amalfa daemon` |
00079| |--------|---------------|-----------------|
00080| | Ingestion class | `AmalfaIngestor` | `AmalfaIngestor` |
00081| | Method called | `ingest()` | `ingest()` |
00082| | File processing | Identical | Identical |
00083| | Embedding generation | Same | Same |
00084| | Hash checking | Yes | Yes |
00085| | Edge weaving | Yes | Yes |
00086| | Database updates | Identical | Identical |
00087| 
00088| **No differences in accuracy, completeness, or quality.**
00089| 
00090| **ONLY difference:** *When* it runs (manual vs automatic)
00091| 
00092| ---
00093| 
00094| ## Full Ingestion Every Time
00095| 
00096| **Important:** The daemon does NOT do incremental ingestion.
00097| 
00098| ```typescript
00099| // Daemon detects 1 file changed
00100| pendingFiles.add("docs/new-file.md");
00101| 
00102| // But runs FULL ingestion
00103| await ingestor.ingest(); // Scans ALL files
00104| ```
00105| 
00106| ### Why?
00107| 
00108| 1. **Simplicity** - One code path
00109| 2. **Correctness** - Always consistent
00110| 3. **Edge updates** - May affect other files
00111| 4. **Performance** - Hash checking makes it fast
00112| 5. **Safety** - No risk of missing dependencies
00113| 
00114| **Performance:** 75 files, 1 changed = ~1.2 seconds total
00115| 
00116| ---
00117| 
00118| ## Config Reload
00119| 
00120| **Key insight:** Daemon reloads config on every trigger.
00121| 
00122| ```typescript
00123| // Daemon on file change:
00124| const config = await loadConfig(); // Fresh config!
00125| const ingestor = new AmalfaIngestor(config, db);
00126| ```
00127| 
00128| **Without restart, these changes are picked up:**
00129| - ✅ `database` path
00130| - ✅ `embeddings.model`
00131| - ✅ `excludePatterns`
00132| 
00133| **Requires restart:**
00134| - ❌ `sources` array (watchers set at startup)
00135| 
00136| ---
00137| 
00138| ## Embedder: Same Everywhere
00139| 
00140| Both triggers use identical embedding logic:
00141| 
00142| ```
00143| 1. Call Embedder.embed(text)
00144| 2. Try Vector Daemon (200ms timeout)
00145| 3. Fallback to local FastEmbed
00146| 4. Return normalized Float32Array
00147| ```
00148| 
00149| **Same model, same algorithm, same results.**
00150| 
00151| ---
00152| 
00153| ## Architecture Benefits
00154| 
00155| ### Single Code Path
00156| 
00157| - **Maintainability** - Fix bugs once
00158| - **Testability** - Test once
00159| - **Consistency** - Same results everywhere
00160| - **Simplicity** - No special cases
00161| 
00162| ### Separation of Concerns
00163| 
00164| **What** (ingestion logic) is separate from **When** (trigger mechanism).
00165| 
00166| ```
00167| Core Logic (What)  ──uses──▶  AmalfaIngestor
00168| Triggers (When)    ──use──▶   Core Logic
00169| ```
00170| 
00171| ---
00172| 
00173| ## Performance
00174| 
00175| **`amalfa init` (all files):**
00176| - Cold: ~15s (with model loading)
00177| - Hot: ~5-7s (Vector Daemon running)
00178| 
00179| **`amalfa daemon` (1 file changed):**
00180| - Detection + debounce: 1000ms
00181| - Hash check all: ~100ms
00182| - Process changed: ~100ms
00183| - **Total: ~1.2s**
00184| 
00185| ---
00186| 
00187| ## Comparison Table
00188| 
00189| | Aspect | amalfa init | amalfa daemon |
00190| |--------|-------------|---------------|
00191| | Execution | Foreground | Background |
00192| | Frequency | Once | Continuous |
00193| | Config reload | Once | Every trigger |
00194| | Error handling | Exit | Retry 3x |
00195| | Notifications | No | Yes |
00196| | **Ingestion code** | **Identical** | **Identical** |
00197| 
00198| ---
00199| 
00200| ## Key Takeaways
00201| 
00202| 1. **Same pipeline everywhere** - One truth
00203| 2. **Hash checking** - Makes full scan efficient
00204| 3. **Config reload** - Daemon picks up changes
00205| 4. **Embedder fallback** - Same everywhere
00206| 5. **Perfect separation** - What vs When
00207| 
00208| **This is excellent architecture.**
00209| 
00210| ---
00211| 
00212| ## References
00213| 
00214| - Implementation: `src/pipeline/AmalfaIngestor.ts`
00215| - CLI trigger: `src/cli.ts`
00216| - Daemon trigger: `src/daemon/index.ts`
00217| - Embedder: `src/resonance/services/embedder.ts`
00218| 

### Model Selection
The system defaults to `all-MiniLM-L6-v2` (384-dim) for optimal performance in local-first workflows. Alternate models (e.g., `bge-small-en-v1.5`, `m3e-large`) are available by updating `config.embeddings.model` and re-ingesting. Tradeoffs:
- ✅ Smaller models (≤500MB) minimize cold-start latency
- ⚠️ Larger models increase recall at CPU/RAM cost
- 📉 Higher dimensions require FAFCAS protocol compliance (unit normalization)
