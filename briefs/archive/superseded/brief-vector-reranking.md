Here is the weaponised Project Brief for **AntiGravity**. It contains the architectural context, the operational directives, and the complete source code required for implementation.

---

# Project Brief: Semantic Relevance Filter (Integration of BGE-M3)

**Target:** AntiGravity Coding Agent
**Objective:** Implement a cross-encoder re-ranking step to reduce context window noise (Entropy Reduction: PHI-12).
**Method:** Deployment of `BAAI/bge-reranker-v2-m3` via ONNX Runtime in a pure TypeScript environment.

## 1. Architectural Context

Current vector search methods (Cosine Similarity) provide high recall but low precision. They retrieve "semantically adjacent" noise.
We are inserting a **Discriminator Node** between the Retrieval Layer and the Generation Layer.

* **Input:** User Query + Top 20-50 Raw Candidates (Vector/Graph results).
* **Process:** Deep cross-attention scoring using the `bge-m3` model.
* **Output:** Top 5-10 High-Relevance "Golden" Nodes.

## 2. Dependencies

Execute the following to provision the substrate:

```bash
bun add @xenova/transformers

```

## 3. Implementation Assets

### Asset A: The Core Service

**Destination:** `src/services/reranker.ts`
**Directives:**

* Implement as a Singleton to prevent model reload overhead.
* Use standard sigmoid normalization to map logits to a 0-1 confidence score.
* Lazy-load the model upon the first request.

```typescript
/**
 * src/services/reranker.ts
 * Implements the BAAI/bge-reranker-v2-m3 Cross-Encoder.
 * Used to filter high-entropy search results into low-entropy context.
 */
import { 
  AutoTokenizer, 
  AutoModelForSequenceClassification, 
  PreTrainedModel, 
  PreTrainedTokenizer 
} from '@xenova/transformers';

// Helper: Sigmoid function to map raw logits to [0, 1] probability
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

export interface RerankResult {
  text: string;
  score: number;
  originalIndex: number;
}

export class BgeReranker {
  private static instance: BgeReranker;
  private tokenizer: PreTrainedTokenizer | null = null;
  private model: PreTrainedModel | null = null;
  
  // The quantized ONNX model optimized for CPU inference
  private modelId = 'Xenova/bge-reranker-v2-m3'; 

  private constructor() {}

  /**
   * Singleton accessor. Ensures the heavy model is only loaded once per process.
   */
  public static async getInstance(): Promise<BgeReranker> {
    if (!BgeReranker.instance) {
      BgeReranker.instance = new BgeReranker();
      await BgeReranker.instance.init();
    }
    return BgeReranker.instance;
  }

  /**
   * Loads the model and tokenizer from the local cache or HuggingFace Hub.
   */
  private async init() {
    console.log(`[Reranker] Initializing ${this.modelId} (ONNX)...`);
    try {
      this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId);
      this.model = await AutoModelForSequenceClassification.from_pretrained(this.modelId);
      console.log(`[Reranker] Model operational.`);
    } catch (err) {
      console.error("[Reranker] Initialization failed:", err);
      throw err;
    }
  }

  /**
   * Re-ranks a list of candidate documents against a specific query.
   * * @param query The user's search intent.
   * @param documents The raw candidate strings (from Vector or Graph search).
   * @param topK (Optional) Number of results to return. Defaults to all.
   * @param threshold (Optional) Minimum score (0-1) to include. Defaults to 0.
   */
  public async rerank(
    query: string, 
    documents: string[], 
    topK?: number, 
    threshold: number = 0
  ): Promise<RerankResult[]> {
    if (!this.tokenizer || !this.model) throw new Error("Reranker not initialized. Call getInstance() first.");
    if (documents.length === 0) return [];

    // 1. Tokenize Pairs: [CLS] query [SEP] doc [SEP]
    const features = await this.tokenizer(
      new Array(documents.length).fill(query), 
      {
        text_pair: documents,
        padding: true,
        truncation: true,
        max_length: 512,
        return_tensors: 'pt'
      }
    );

    // 2. Inference: Run the cross-encoder
    // output.logits shape: [batch_size, 1]
    const output = await this.model(features);
    
    // 3. Extract scores
    const scores: number[] = output.logits.data; 

    // 4. Map, Normalize, Sort
    const results = documents
      .map((doc, index) => ({
        text: doc,
        score: sigmoid(scores[index]),
        originalIndex: index
      }))
      .filter(r => r.score >= threshold)
      .sort((a, b) => b.score - a.score);

    return topK ? results.slice(0, topK) : results;
  }
}

```

### Asset B: The Verification Script

**Destination:** `scripts/test-reranker.ts`
**Directives:**

* Use this script to verify the ONNX runtime is functioning correctly without spinning up the full Hono server.

```typescript
/**
 * scripts/test-reranker.ts
 * Standalone verification of the BGE-M3 integration.
 * Run with: bun run scripts/test-reranker.ts
 */
import { BgeReranker } from "../src/services/reranker";

async function main() {
  const query = "What is the primary function of Mentation?";
  
  const candidates = [
    "Mentation is the internal cognitive processing of stuff into things.", // High Relevance
    "Entropy is the measure of disorder in a system.", // Low Relevance
    "The weather in Scotland is often rainy.", // Noise
    "Mentation requires a Conceptual Lexicon to function effectively.", // Medium/High Relevance
  ];

  console.log(`Query: "${query}"`);
  console.log(`Candidates: ${candidates.length}\n`);

  const reranker = await BgeReranker.getInstance();
  
  // Measure latency
  const start = performance.now();
  const results = await reranker.rerank(query, candidates);
  const end = performance.now();

  console.log(`\n--- Results (Inference: ${(end - start).toFixed(2)}ms) ---`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. [Score: ${r.score.toFixed(4)}] ${r.text}`);
  });
}

main();

```

### Asset C: Integration Pattern

**Directive:** Use this pattern inside the main Request Handler or Graph Service.

```typescript
// Example usage inside a Service
import { BgeReranker } from './services/reranker';

export async function getOptimizedContext(query: string) {
  // 1. Retrieve broad set (High Recall)
  const rawNodes = await graphDatabase.hybridSearch(query, { limit: 50 });
  const rawTexts = rawNodes.map(n => n.content);

  // 2. Refine (High Precision)
  const reranker = await BgeReranker.getInstance();
  const refined = await reranker.rerank(query, rawTexts, 5, 0.25); // Top 5, min score 0.25

  // 3. Return strictly relevant text
  return refined.map(r => r.text);
}

```

## 4. Execution Protocol

1. **Install:** Run dependency command.
2. **Create:** Generate `src/services/reranker.ts`.
3. **Verify:** Run `bun run scripts/test-reranker.ts`.
4. **Observe:** Ensure the first run downloads the model (progress bars will appear). Subsequent runs should be instant.