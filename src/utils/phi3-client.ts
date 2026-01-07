/**
 * Phi3 HTTP Client
 * Client for interacting with Phi3 daemon HTTP endpoints
 */

import { loadConfig } from "@src/config/defaults";
import { getLogger } from "./Logger";

const log = getLogger("Phi3Client");

// Cache for Phi3 availability to avoid repeated health checks
let phi3AvailableCache: boolean | null = null;
let phi3LastCheck: number = 0;
const HEALTH_CHECK_CACHE_MS = 30000; // Cache health check for 30 seconds

/**
 * Phi3 Client Interface
 */
export interface Phi3Client {
  isAvailable(): Promise<boolean>;
  analyzeQuery(query: string): Promise<QueryAnalysis | null>;
  rerankResults(
    results: Array<{ id: string; content: string; score: number }>,
    query: string,
    intent?: string
  ): Promise<Array<{ id: string; content: string; score: number; relevance_score: number }>>;
  extractContext(
    result: { id: string; content: string },
    query: string
  ): Promise<{ snippet: string; context: string; confidence: number } | null>;
}

/**
 * Query analysis response
 */
export interface QueryAnalysis {
  intent: "implementation" | "conceptual" | "example";
  entities: string[];
  technical_level: "high" | "medium" | "low";
  suggested_queries: string[];
}

/**
 * Create Phi3 client instance
 */
export function createPhi3Client(): Phi3Client {
  const config = loadConfig();

  // Check if Phi3 is enabled
  if (!config.phi3?.enabled) {
    log.debug("Phi3 is disabled in configuration");
    return createDisabledClient();
  }

  const host = config.phi3?.host || "localhost:11434";
  const baseUrl = `http://localhost:${config.phi3?.port || 3012}`;
  const timeout = config.phi3?.tasks.search?.timeout || 5000;

  return {
    async isAvailable(): Promise<boolean> {
      const now = Date.now();

      // Return cached result if valid
      if (
        phi3AvailableCache !== null &&
        now - phi3LastCheck < HEALTH_CHECK_CACHE_MS
      ) {
        return phi3AvailableCache;
      }

      // Perform health check
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for health check

        const response = await fetch(`${baseUrl}/health`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          phi3AvailableCache = false;
          phi3LastCheck = now;
          return false;
        }

        const health = (await response.json()) as { status: string };
        const healthy = health.status === "healthy";

        phi3AvailableCache = healthy;
        phi3LastCheck = now;

        return healthy;
      } catch (error) {
        phi3AvailableCache = false;
        phi3LastCheck = now;
        log.debug({ error }, "Phi3 health check failed");
        return false;
      }
    },

    async analyzeQuery(query: string): Promise<QueryAnalysis | null> {
      if (!(await this.isAvailable())) {
        log.debug("Phi3 not available, skipping query analysis");
        return null;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${baseUrl}/search/analyze`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          log.warn(
            { status: response.status },
            "Query analysis request failed",
          );
          return null;
        }

        return (await response.json()) as QueryAnalysis;
      } catch (error) {
        log.error({ error, query }, "Query analysis failed");
        return null;
      }
    },

    async rerankResults(
      results: Array<{ id: string; content: string; score: number }>,
      query: string,
      intent?: string,
    ): Promise<
      Array<{
        id: string;
        content: string;
        score: number;
        relevance_score: number;
      }>
    > {
      if (!(await this.isAvailable())) {
        log.debug("Phi3 not available, skipping result re-ranking");
        // Return original results with relevance_score = score
        return results.map((r) => ({ ...r, relevance_score: r.score }));
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${baseUrl}/search/rerank`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ results, query, intent }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          log.warn(
            { status: response.status },
            "Result re-ranking request failed",
          );
          // Fallback: return original scores
          return results.map((r) => ({ ...r, relevance_score: r.score }));
        }

        return (await response.json()) as Array<{
          id: string;
          content: string;
          score: number;
          relevance_score: number;
        }>;
      } catch (error) {
        log.error({ error, query }, "Result re-ranking failed");
        // Fallback: return original scores
        return results.map((r) => ({ ...r, relevance_score: r.score }));
      }
    },

    async extractContext(
      result: { id: string; content: string },
      query: string,
    ): Promise<{ snippet: string; context: string; confidence: number } | null> {
      if (!(await this.isAvailable())) {
        log.debug("Phi3 not available, skipping context extraction");
        // Fallback: return simple snippet
        const words = result.content.split(" ");
        const snippet = words.slice(0, 50).join(" ");
        return {
          snippet,
          context: "Full content available",
          confidence: 0.5,
        };
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${baseUrl}/search/context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result, query }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          log.warn(
            { status: response.status },
            "Context extraction request failed",
          );
          return null;
        }

        return (await response.json()) as {
          snippet: string;
          context: string;
          confidence: number;
        };
      } catch (error) {
        log.error({ error, resultId: result.id }, "Context extraction failed");
        return null;
      }
    },
  };
}

/**
 * Create a disabled client (when Phi3 is not enabled)
 */
function createDisabledClient(): Phi3Client {
  return {
    async isAvailable(): Promise<boolean> {
      return false;
    },
    async analyzeQuery(): Promise<QueryAnalysis | null> {
      return null;
    },
    async rerankResults(
      results: Array<{ id: string; content: string; score: number }>,
      _query: string,
      _intent?: string,
    ): Promise<
      Array<{
        id: string;
        content: string;
        score: number;
        relevance_score: number;
      }>
    > {
      return results.map((r) => ({ ...r, relevance_score: r.score }));
    },
    async extractContext(): Promise<{
      snippet: string;
      context: string;
      confidence: number;
    } | null> {
      return null;
    },
  };
}
