# Embeddings README

semantic-graph-ts/outputs/embeddings-portable/README.md#L1-240
## Embeddings Portable — Lift & Shift Guide

This directory contains a self-contained, portable embeddings helper and a small example you can lift into another repo (for example `ctx-assimilation-mcp`). The implementation was designed to be dependency-light and to support two routes:

- OpenAI embeddings (HTTP) — preferred when `OPENAI_API_KEY` is available.
- Ollama generation-based reranker — fallback path for re-ranking when embeddings aren't available or when you want model-based reranking.

Files included
- `src/llm/embeddings.ts` — the portable embeddings client (main artifact to lift).
- `examples/rerank-example.ts` — example script that uses the client and persists results.
- This `README.md`.

Why this file is safe to lift
- Minimal runtime assumptions: uses `fetch` (available in Bun and modern Node runtimes). If your runtime lacks `fetch`, polyfill it or adapt calls to your HTTP client.
- No heavy platform-specific dependencies are required to run the core logic.
- Defensive: validates embedding shapes and falls back to the Ollama path if the OpenAI route fails.

Quick usage summary
- Copy `src/llm/embeddings.ts` into your target repo (recommended path: `src/llm/embeddings.ts`).
- Ensure your runtime exposes `fetch` or provide a polyfill.
- Configure environment variables:
  - `OPENAI_API_KEY` to enable OpenAI embeddings.
  - Optionally `OPENAI_EMBEDDING_MODEL` (defaults to `text-embedding-3-small`).
  - `OLLAMA_BASE_URL` to enable Ollama reranker (optional).
  - Optionally `OLLAMA_MODEL` (defaults to `gemma3:270m` or your deployment's model id).
- Run the example to verify everything works in your environment.

Lift-and-shift checklist
1. Copy file
   - Copy `src/llm/embeddings.ts` into your new project at `src/llm/embeddings.ts`.
2. Example (optional)
   - Copy `outputs/embeddings-portable/examples/rerank-example.ts` into your project (e.g., `scripts/rerank-example.ts`) to test quickly.
3. Configure env
   - Set `OPENAI_API_KEY` and/or `OLLAMA_BASE_URL`.
4. Ensure fetch
   - If your environment doesn't provide `fetch`, install a polyfill or replace `fetch` calls with your HTTP library.
5. Run the example
   - Example run (Bun / tsx):
```semantic-graph-ts/outputs/embeddings-portable/README.md#L241-266
bunx tsx semantic-graph-ts/outputs/embeddings-portable/examples/rerank-example.ts --query "What is the Code of Practice?"
```
6. Inspect persisted output
   - The example writes results to `outputs/embeddings-portable/examples/results/*.json`.

API summary (what you get after lifting)
- `EmbeddingsClient` class (default export instance available as `defaultClient`):
  - `embedWithOpenAI(texts: string[])` → `FloatVector[]`
  - `rankCandidatesByEmbedding(queryVec, candidates, topK)` → ranked candidate list
  - `rankWithOpenAI(query, candidates, opts)` → compute query embedding + rank
  - `ollamaRerank(query, candidates, opts)` → generation-based rerank via Ollama
  - `rerankWithHybrid(query, candidates, opts)` → prefer OpenAI; fallback to Ollama

Integration points and recommended places to plug embeddings
- Keyword extraction & node insertion:
  - If you persist embeddings, doing it during insertion (e.g., alongside `insertNodes`) is convenient so each node has a stable vector.
- Retrieval / RAG:
  - When handling queries, compute the query embedding and perform k-NN against your vector store, then use `rerankWithHybrid` to re-rank the shortlist.
- Suggested functions to modify in your project (examples from original repo):
  - `insertNodes` (place to attach `embedding` to node metadata)
  - `generateEdgesFromTags` (if you want to create semantic links based on vector similarity)
  - `extractKeywords` (could be augmented to produce candidate text for embeddings)

Persistence recommendations (do NOT store vectors as free-form JSON in a TEXT column)
- Avoid the anti-pattern of storing large arrays as opaque JSON strings inside general-purpose text columns. This causes:
  - Poor performance for similarity search
  - No indexing support
  - Dimension-mismatch debug headaches
- Preferred approaches:
  - Use a vector-capable store (production): Milvus, FAISS (disk-backed via an index), Vectra, Qdrant, or a managed service (Pinecone, Weaviate, etc.).
  - If you must store on-disk for prototyping: use a typed, compact format (e.g., NDJSON / JSONL where each line is { id, embedding: [floats], metadata }) and document the embedding dimension. Keep one vector per line and write an accompanying index or precompute a faiss/annoy index as a separate artifact.
  - Always store explicit `embedding_dim` and `embedding_version` metadata so you can validate dimensions at load time.

Anti-patterns and hard lessons (from earlier debriefs)
- Inconsistent embedding dimensions across records — always validate shapes when ingesting and before indexing.
- Storing vectors solely as JSON strings in an SQL TEXT field without a vector index — avoid this for anything beyond tiny prototypes.
- Relying on a single embedding shape without enforcement — add a `validateEmbeddings()` check at ingest time and fail fast if shapes do not match expected dims.

Testing guidance
- Unit tests:
  - Mock `fetch` responses for OpenAI to avoid network calls.
  - For Ollama reranker, either run against a local dev Ollama instance in CI or stub the HTTP response.
- Integration tests:
  - Run `rerank-example.ts` against a small set of documents and verify output JSON contains `score` or `similarity` fields.
  - Add a test that intentionally feeds mismatched dimensions into the vector ingestion code path and asserts validation fails.
- Performance:
  - When embedding many small documents, batch requests to OpenAI to reduce overhead.
  - Cache embeddings for static documents to avoid repeated embedding costs.

Operational notes
- OpenAI
  - Rate limits and cost matter. Batch inputs but respect provider limits and consider retry/backoff strategy.
- Ollama
  - Ollama generation-based reranking is typically slower than direct embedding similarity. Use Ollama when you need semantic re-ranking that benefits from model judgment, but prefer embeddings + ANN for low-latency retrieval.
- Security
  - Do not commit `OPENAI_API_KEY` or any secrets to source control. Use environment or secret management.

Troubleshooting tips
- If `embedWithOpenAI` fails with unexpected response shape:
  - Log the returned JSON (in a safe environment) and confirm `json.data[*].embedding` exists.
- If Ollama responses are noisy or not JSON:
  - Confirm your model prompt or model version; some models may add text. The helper extracts the first JSON array substring — if your deployment returns a different envelope, adjust parsing.
- If candidate vectors are missing from your index:
  - Ensure your index actually persisted vectors (run a small lookup and inspect returned `vector`); if not, look at your ingest path to confirm embeddings were created and saved.

Example snippets (how to instantiate)
```semantic-graph-ts/outputs/embeddings-portable/README.md#L267-300
// import the client after you lift the file to src/llm/embeddings.ts
import EmbeddingsClient from './src/llm/embeddings';

const client = new EmbeddingsClient();
// then:
const results = await client.rerankWithHybrid("Who invented the compiler?", candidates);
```

Adapting for ctx-assimilation-mcp
1. Copy `src/llm/embeddings.ts` into `ctx-assimilation-mcp/src/llm/embeddings.ts`.
2. Copy the example if you want a runnable smoke test.
3. Wire environment variables in your deployment/CI.
4. Preferably: add persistent storage for embeddings in a vector store, and update your ingestion pipeline to emit vectors at write time (not lazily at query time).

Contact / next steps
- If you want, I can:
  - Create a small test scaffold that runs embedding + persist to NDJSON (for quick verification).
  - Add a patch to your target project (`ctx-assimilation-mcp`) that integrates this file into `insertNodes` and stores vectors into a `vectors/` JSONL file as a first-stage index.
  - Create unit tests that mock OpenAI/Ollama responses for CI.

Happy to continue — tell me which of the next steps above you want me to produce (test scaffold, integration patch, or CI-friendly unit tests).