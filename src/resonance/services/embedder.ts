import { join } from "node:path";
import { toFafcas } from "@src/resonance/db";
import { EmbeddingModel, FlagEmbedding } from "fastembed";

export interface EmbedderConfig {
  model?: EmbeddingModel;
}

export class Embedder {
  private static instance: Embedder;
  private nativeEmbedder: FlagEmbedding | null = null;
  private daemonUrl = `http://localhost:${process.env.VECTOR_PORT || "3010"}`;
  private useRemote = true;

  // Default to a more modern model: BGE Small v1.5
  // This offers a better balance of latency vs. semantic quality than AllMiniLML6V2
  private currentModel: EmbeddingModel = EmbeddingModel.BGESmallENV15;

  private constructor() {
    this.configureModel();
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
      bgesmallenv15: EmbeddingModel.BGESmallENV15,
      bgebaseenv15: EmbeddingModel.BGEBaseENV15,
      bgesmallen: EmbeddingModel.BGESmallEN,
      bgebaseen: EmbeddingModel.BGEBaseEN,
      // Add other supported models here as needed
    };
    return map[normalized];
  }

  public static getInstance(): Embedder {
    if (!Embedder.instance) {
      Embedder.instance = new Embedder();
    }
    return Embedder.instance;
  }

  private async init() {
    if (!this.nativeEmbedder) {
      const cacheDir = join(process.cwd(), ".amalfa/cache");
      console.log(
        `[Embedder] Initializing local embedding model: ${this.currentModel}`,
      );
      this.nativeEmbedder = await FlagEmbedding.init({
        model: this.currentModel,
        cacheDir,
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
          body: JSON.stringify({
            text,
            model: this.currentModel,
          }),
          signal: AbortSignal.timeout(200), // Fast timeout: 200ms
        });

        if (response.ok) {
          const data = (await response.json()) as { vector: number[] };
          if (data.vector) {
            // FAFCAS Protocol: Normalize at generation boundary
            const raw = new Float32Array(data.vector);
            return new Float32Array(toFafcas(raw).buffer);
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

    // FAFCAS Protocol: Normalize at generation boundary
    // Note: FastEmbed usually returns normalized vectors, but we enforce it here
    const raw = new Float32Array(val);
    return new Float32Array(toFafcas(raw).buffer);
  }
}
