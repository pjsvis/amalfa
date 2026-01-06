## Task: Refactor Embedder for Dynamic Model Selection

**Objective:** Decouple the embedding model selection from the `Embedder` class logic to allow environment-driven configuration and upgrade the default model to `bge-small-en-v1.5` for improved semantic retrieval.

- [ ] **Configurability:** The system must allow the embedding model to be defined via the polyvis-settings.json file and/or an environment variable (e.g., `EMBEDDING_MODEL`), overriding the hardcoded default.
- [ ] **Modernization:** Change the default fallback model from the legacy `AllMiniLML6V2` to the more performant `bge-small-en-v1.5` (while maintaining `fastembed` compatibility).
- [ ] **Resilience:** Maintain the existing "Daemon First -> Local Fallback" reliability pattern, ensuring the new model configuration applies to the local fallback initialization.

## Key Actions Checklist:

- [ ] **Interface Update:** Define a configuration interface or type for the `Embedder` options to ensure type safety (per OH-084).
- [ ] **Refactor `init()`:** Modify the `init` method in `embedder.ts` to accept a model parameter, defaulting to `bge-small-en-v1.5` if no environment variable is present.
- [ ] **Env Var Integration:** Add logic to read `process.env.EMBEDDING_MODEL` during the singleton initialization.
- [ ] **Verification:** Verify that `fastembed` correctly downloads and initializes the new default model on a fresh run.
- [ ] **Daemon Compatibility Check:** Ensure the `embed` method's payload to the remote daemon is compatible (or explicitly passes the requested model if the daemon API supports it).

## Detailed Requirements

**Proposed Configuration Logic:**
The `init` logic should prioritize sources in this order:
1.  Runtime Argument (if added to `getInstance` or `init`)
2.  `process.env.EMBEDDING_MODEL`
3.  Hardcoded Default (`EmbeddingModel.BGE_SMALL_EN_V1_5`)

**Constraint:**
- The refactor must not break existing calls to `Embedder.getInstance().embed()`. The signature of the public `embed` method should ideally remain stable unless necessary.

## Code Examples

### embedder.ts

```typescript
// embedder.ts
import { join } from "node:path";
import { EmbeddingModel, FlagEmbedding } from "fastembed";

export class Embedder {
	private static instance: Embedder;
	private nativeEmbedder: FlagEmbedding | null = null;
	private daemonUrl = `http://localhost:${process.env.VECTOR_PORT || "3010"}`;
	private useRemote = true;

	// Default to a more modern model: BGE Small v1.5
	// This offers a better balance of latency vs. semantic quality than AllMiniLML6V2
	private currentModel: EmbeddingModel = EmbeddingModel.BGE_SMALL_EN_V1_5;

	private constructor() {
		this.configureModel();
	}

	public static getInstance(): Embedder {
		if (!Embedder.instance) {
			Embedder.instance = new Embedder();
		}
		return Embedder.instance;
	}

	/**
	 * Determines which model to use based on environment variables.
	 * Falls back to the class default (BGE Small) if not specified or invalid.
	 */
	private configureModel() {
		const envModel = process.env.EMBEDDING_MODEL;

		if (envModel) {
			const resolved = this.resolveModel(envModel);
			if (resolved) {
				this.currentModel = resolved;
			} else {
				console.warn(
					`[Embedder] Warning: Unknown model '${envModel}'. Falling back to default: ${this.currentModel}`,
				);
			}
		}
	}

	/**
	 * Helper to map string input to EmbeddingModel enum.
	 * This allows for easy switching via .env without code changes.
	 */
	private resolveModel(modelName: string): EmbeddingModel | undefined {
		// Normalize input to match enum keys or values roughly
		const normalized = modelName.toLowerCase().replace(/[^a-z0-9]/g, "");

		const map: Record<string, EmbeddingModel> = {
			allminilml6v2: EmbeddingModel.AllMiniLML6V2,
			bgesmallenv15: EmbeddingModel.BGE_SMALL_EN_V1_5,
			bgebaseenv15: EmbeddingModel.BGE_BASE_EN_V1_5,
			// Add other supported models here as needed
		};

		return map[normalized];
	}

	private async init() {
		if (!this.nativeEmbedder) {
			const cacheDir = join(process.cwd(), ".resonance/cache");
			
			console.log(`[Embedder] Initializing local embedding model: ${this.currentModel}`);
			
			this.nativeEmbedder = await FlagEmbedding.init({
				model: this.currentModel,
				cacheDir: cacheDir,
				showDownloadProgress: true,
			});
		}
	}

	public async embed(text: string, forceLocal = false): Promise<Float32Array> {
		// 1. Try Remote
		if (this.useRemote && !forceLocal) {
			try {
				const response = await fetch(`${this.daemonUrl}/embed`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					// We optionally pass the model name if the daemon supports dynamic switching,
					// otherwise, we assume the daemon is configured consistently.
					body: JSON.stringify({ 
						text, 
						model: this.currentModel 
					}),
					signal: AbortSignal.timeout(200), // Fast timeout: 200ms
				});

				if (response.ok) {
					const data = (await response.json()) as { vector: number[] };
					if (data.vector) {
						return new Float32Array(data.vector);
					}
				}
			} catch (_e) {
				// Daemon unreachable or timeout
				// console.warn("Vector Daemon unreachable, falling back to local.");
			}
		}

		// 2. Fallback to Local
		if (!this.nativeEmbedder) await this.init();

		const gen = this.nativeEmbedder?.embed([text]);
		if (!gen) throw new Error("Failed to initialize embedder");
		const result = await gen.next();

		const val = result.value?.[0];
		if (!val || val.length === 0) {
			throw new Error("Failed to generate embedding");
		}

		return new Float32Array(val);
	}
}
```

### verify-embedder.ts

```typescript
import { Embedder } from "./embedder"; // Adjust path if necessary
import { EmbeddingModel } from "fastembed";

/**
 * Verification Script for Embedder Refactor
 * * Usage:
 * 1. Default (BGE Small): npx tsx verify-embedder.ts
 * 2. Custom Model: EMBEDDING_MODEL=allminilml6v2 npx tsx verify-embedder.ts
 */

async function verify() {
    console.log("🔍 Starting Embedder Verification Protocol...");

    // 1. Inspect Environment
    const envModel = process.env.EMBEDDING_MODEL || "(Not Set - using default)";
    console.log(`📋 Configuration: EMBEDDING_MODEL=${envModel}`);

    try {
        // 2. Initialize Embedder
        // We force local usage to ensure we are testing the library, not the daemon
        const embedder = Embedder.getInstance();
        
        const testPhrase = "The Scottish Enlightenment was a period of intellectual outpouring.";
        console.log(`🧪 Embedding phrase: "${testPhrase.substring(0, 25)}..."`);

        const start = performance.now();
        // Force local=true to bypass daemon and test the actual fastembed integration
        const vector = await embedder.embed(testPhrase, true); 
        const duration = (performance.now() - start).toFixed(2);

        // 3. Validate Output
        console.log(`✅ Embedding generated in ${duration}ms`);
        console.log(`📏 Vector Dimensions: ${vector.length}`);

        // 4. Model Specific Validation
        // BGE-Small and AllMiniLM are both 384, but we verify we got a valid vector
        if (vector.length === 384) {
            console.log("✨ SUCCESS: Dimension matches expected 384 for BGE-Small/MiniLM.");
        } else {
            console.warn(`⚠️ WARNING: Unexpected dimension ${vector.length}. Check model configuration.`);
        }

        console.log("\n[Verification Complete]");
        
    } catch (error) {
        console.error("❌ FAILURE:", error);
        process.exit(1);
    }
}

verify();
```
### Daemon Patch Instructions (Manual)

Since I cannot edit the daemon file, please verify if your daemon uses the Embedder class or fastembed directly.

If it uses Embedder class: You just need to rebuild/restart the daemon. It will inherit the logic from the updated embedder.ts.

If it uses fastembed directly: You must apply the same logic I added to embedder.ts (the resolveModel method and process.env check) to the daemon's initialization code.

Next Steps
Run the verification: npx tsx verify-embedder.ts

Observe the download: On the first run, you should see fastembed downloading the bge-small-en-v1.5 artifacts (approx. 130MB).

Deploy: Once verified, restart your vector daemon.

## References

- [How to choose the right Embedding models for RAG](https://levelup.gitconnected.com/how-to-choose-the-right-embedding-model-for-your-rag-application-44e30876d382)
- [How to choose an embeddings model](https://www.youtube.com/watch?v=tXkHfbr1ZzY&t=7s)
- [FastEmbed: Fast & Lightweight Embedding Generation ](https://www.youtube.com/watch?v=e67jLAx_F2A)