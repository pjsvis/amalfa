# Debrief: Harvester Caching Layer Implementation (2026-01-29)

## 🎯 Objective
Decouple the expensive and slow AI extraction process from the fast graph construction process. This enables rapid iteration on graph algorithms ("squashing") without re-incurring AI latency and costs.

## 🏗️ Achievements
1.  **Implemented `HarvesterCache`**: A persistent, content-addressable store (CAS) using SHA-256 hashing.
2.  **Integrated Caching**: Updated `LangExtractClient` to transparently check the cache before making API calls.
3.  **CLI Tooling**: Created `amalfa harvest` command to systematically process the codebase.
4.  **Resilience Strategy**: Adopted a reliable "Sequential + Persistent Cache" approach to handle remote API latency and potential interruptions.
5.  **Cost Efficiency**: Verified that re-running the harvest on processed files is instant and free (Cache Hit).

## 🛠️ Technical Details

### Architecture
-   **Store**: `.amalfa/cache/lang-extract/`
-   **Format**: JSON files named by `SHA256(file_content).json`.
-   **Mechanism**: Atomic writes (write-to-temp + rename) to prevent corruption.

### Component Updates
-   `src/core/HarvesterCache.ts`: New class handling hash generation and FS operations.
-   `src/services/LangExtractClient.ts`: Added caching logic to `extract()` and public `checkCache()` method.
-   `src/cli/commands/harvest.ts`: New command iterating over `.ts` and `.md` files.
-   `amalfa.config.json`: Updated defaults to use `openrouter` and `google/gemini-2.5-flash-lite`.

### Performance & Reliability
-   **Concurrency**: Set to **1** (Sequential) to ensure stability with Stdio transport.
-   **Speed**: ~15-20s per file (Remote API latency).
-   **Resume-ability**: 100% resilient. Interrupted runs resume instantly from where they left off.

## 📝 Usage

```bash
# Harvest a specific directory
LANGEXTRACT_PROVIDER=openrouter amalfa harvest src/core

# Harvest a single file
LANGEXTRACT_PROVIDER=openrouter amalfa harvest src/main.ts
```

## 🚀 Next Steps
1.  **Full Harvest**: Execute the harvest command across the entire repository (estimated ~2-3 hours for 500 files sequentially).
2.  **Squash Iteration**: Once harvested, develop sophisticated graph construction logic using the cached data.
3.  **CI/CD**: Potentially integrate harvesting into CI pipeline for changed files only.

## 📚 Updated Specifications
- `playbooks/lang-extract-playbook.md`: Updated with cost tracking and caching sections.
- `amalfa.config.json`: Standardized on OpenRouter.

**Status**: ✅ COMPLETE
