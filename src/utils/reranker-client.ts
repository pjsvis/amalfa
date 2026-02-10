/**
 * Reranker Client Utility
 *
 * Provides singleton access to HfBgeReranker with availability checking
 * and graceful degradation. Similar pattern to sonar-client.ts.
 */

import { HfBgeReranker } from "@src/services/reranker-hf";
import { log } from "./Logger";

let rerankerInstance: HfBgeReranker | null = null;
let initializationPromise: Promise<HfBgeReranker> | null = null;
let initializationFailed = false;

const RERANKER_DAEMON_URL = "http://localhost:3011";

/**
 * Try to use reranker daemon for reranking (faster, no local model loading)
 */
async function rerankViaDaemon(
  query: string,
  documents: Array<{ id: string; content: string; score: number }>,
  topK: number,
): Promise<Array<{
  id: string;
  content: string;
  score: number;
  rerankScore?: number;
}> | null> {
  try {
    const response = await fetch(`${RERANKER_DAEMON_URL}/rerank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        documents: documents.map((d) => d.content),
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const daemonResult = (await response.json()) as {
      results: Array<{ text: string; score: number; originalIndex: number }>;
    };

    // Map daemon results back to original documents
    const rerankedDocs = daemonResult.results.slice(0, topK).map((result) => {
      const original = documents[result.originalIndex];
      if (!original) {
        throw new Error(
          `Invalid originalIndex ${result.originalIndex} in daemon rerank results`,
        );
      }
      return {
        id: original.id,
        content: original.content,
        score: result.score, // Use rerank score as primary
        rerankScore: result.score,
      };
    });

    log.info(
      {
        query,
        docCount: documents.length,
        topK,
        method: "daemon",
      },
      "Daemon reranking complete",
    );

    return rerankedDocs;
  } catch (error) {
    log.debug({ error }, "Daemon reranker unavailable");
    return null;
  }
}

/**
 * Get or create the reranker instance
 */
async function getReranker(): Promise<HfBgeReranker | null> {
  // If initialization already failed, don't retry
  if (initializationFailed) {
    return null;
  }

  // If instance exists, return it
  if (rerankerInstance) {
    return rerankerInstance;
  }

  // If initialization in progress, wait for it
  if (initializationPromise) {
    try {
      return await initializationPromise;
    } catch {
      return null;
    }
  }

  // Start initialization
  initializationPromise = HfBgeReranker.getInstance();

  try {
    rerankerInstance = await initializationPromise;
    log.info("Reranker initialized successfully");
    return rerankerInstance;
  } catch (error) {
    initializationFailed = true;
    log.warn({ error }, "Reranker initialization failed - will skip reranking");
    return null;
  } finally {
    initializationPromise = null;
  }
}

/**
 * Check if reranker is available
 */
export async function isRerankerAvailable(): Promise<boolean> {
  const reranker = await getReranker();
  return reranker !== null;
}

/**
 * Rerank documents by query relevance
 *
 * @param query - Search query
 * @param documents - Documents with content
 * @param topK - Number of results to return (default: 20)
 * @returns Reranked results or original order if reranker unavailable
 */
export async function rerankDocuments(
  query: string,
  documents: Array<{ id: string; content: string; score: number }>,
  topK = 20,
): Promise<
  Array<{ id: string; content: string; score: number; rerankScore?: number }>
> {
  // Try daemon first (faster, no model loading)
  try {
    const daemonResult = await rerankViaDaemon(query, documents, topK);
    if (daemonResult) {
      return daemonResult;
    }
  } catch (error) {
    log.debug({ error }, "Daemon reranker failed, trying local");
  }

  // Fallback to local reranker
  const reranker = await getReranker();

  // If reranker unavailable, return original order
  if (!reranker) {
    log.debug("Reranker not available, skipping reranking");
    return documents;
  }

  if (documents.length === 0) {
    return documents;
  }

  try {
    const startTime = Date.now();

    // Extract content for reranking
    const contents = documents.map((doc) => doc.content);

    // Run reranking
    const rerankedResults = await reranker.rerank(query, contents, topK);

    const elapsedMs = Date.now() - startTime;
    log.info(
      {
        query,
        docCount: documents.length,
        topK,
        elapsedMs,
      },
      "Reranking complete",
    );

    // Map reranked results back to original documents
    const rerankedDocs = rerankedResults.map((result) => {
      const originalDoc = documents[result.originalIndex];
      if (!originalDoc) {
        throw new Error(
          `Invalid originalIndex ${result.originalIndex} in rerank results`,
        );
      }

      return {
        ...originalDoc,
        rerankScore: result.score, // Keep original vector score + add rerank score
        score: result.score, // Use rerank score as primary score
      };
    });

    return rerankedDocs;
  } catch (error) {
    log.error({ error, query }, "Reranking failed, returning original order");
    // Graceful degradation - return original documents
    return documents;
  }
}

/**
 * Get reranker status for diagnostics
 */
export function getRerankerStatus(): {
  available: boolean;
  initialized: boolean;
  failed: boolean;
} {
  return {
    available: rerankerInstance !== null,
    initialized: rerankerInstance !== null || initializationFailed,
    failed: initializationFailed,
  };
}
