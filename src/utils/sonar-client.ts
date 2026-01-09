/**
 * Sonar HTTP Client
 * Client for interacting with Sonar daemon HTTP endpoints
 */

import { loadConfig } from "@src/config/defaults";
import { getLogger } from "./Logger";

const log = getLogger("SonarClient");

// Cache for Sonar availability to avoid repeated health checks
let sonarAvailableCache: boolean | null = null;
let sonarLastCheck: number = 0;
const HEALTH_CHECK_CACHE_MS = 30000; // Cache health check for 30 seconds

/**
 * Sonar Client Interface
 */
export interface SonarClient {
	isAvailable(): Promise<boolean>;
	analyzeQuery(query: string): Promise<QueryAnalysis | null>;
	rerankResults(
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
	>;
	extractContext(
		result: { id: string; content: string },
		query: string,
	): Promise<{ snippet: string; context: string; confidence: number } | null>;
	getGaps(limit?: number): Promise<unknown[]>;
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
 * Create Sonar client instance
 */
export async function createSonarClient(): Promise<SonarClient> {
	const config = await loadConfig();

	// Check if Sonar is enabled
	// Checking both for backward compatibility or migration
	const isEnabled = config.sonar?.enabled ?? config.phi3?.enabled;

	if (!isEnabled) {
		log.debug("Sonar/Phi3 is disabled in configuration");
		return createDisabledClient();
	}

	const hostArgs = config.sonar || config.phi3 || {};
	const _host = hostArgs.host || "localhost:11434";
	const port = hostArgs.port || 3012;
	const baseUrl = `http://localhost:${port}`;
	const timeout = hostArgs.tasks?.search?.timeout || 5000;

	// Define isAvailable as a local function to avoid 'this' context issues
	const isAvailable = async (): Promise<boolean> => {
		const now = Date.now();

		// Return cached result if valid
		if (
			sonarAvailableCache !== null &&
			now - sonarLastCheck < HEALTH_CHECK_CACHE_MS
		) {
			return sonarAvailableCache;
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
				sonarAvailableCache = false;
				sonarLastCheck = now;
				return false;
			}

			const health = (await response.json()) as { status: string };
			const healthy = health.status === "healthy";

			sonarAvailableCache = healthy;
			sonarLastCheck = now;

			return healthy;
		} catch (error) {
			sonarAvailableCache = false;
			sonarLastCheck = now;
			log.debug({ error }, "Sonar health check failed");
			return false;
		}
	};

	return {
		isAvailable,

		async analyzeQuery(query: string): Promise<QueryAnalysis | null> {
			if (!(await isAvailable())) {
				log.debug("Sonar not available, skipping query analysis");
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
			if (!(await isAvailable())) {
				log.debug("Sonar not available, skipping result re-ranking");
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
		): Promise<{
			snippet: string;
			context: string;
			confidence: number;
		} | null> {
			if (!(await isAvailable())) {
				log.debug("Sonar not available, skipping context extraction");
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

		async getGaps(_limit?: number): Promise<unknown[]> {
			if (!(await isAvailable())) return [];
			try {
				const response = await fetch(`${baseUrl}/graph/explore`);
				if (!response.ok) return [];
				const data = (await response.json()) as { gaps?: unknown[] };
				return data.gaps || [];
			} catch (error) {
				log.error({ error }, "Failed to fetch gaps");
				return [];
			}
		},
	};
}

/**
 * Create a disabled client (when Sonar is not enabled)
 */
function createDisabledClient(): SonarClient {
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
		async getGaps(): Promise<unknown[]> {
			return [];
		},
	};
}
