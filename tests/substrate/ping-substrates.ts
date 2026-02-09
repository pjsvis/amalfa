#!/usr/bin/env bun

// @ts-nocheck
/**
 * Substrate Ping Test Script
 *
 * Tests LangExtract substrate endpoints with various inputs and providers.
 * Measures response times, validates output structure, and compares results.
 *
 * Usage:
 *   bun run tests/substrate/ping-substrates.ts [--provider <name>] [--timeout <ms>]
 */

import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AmalfaSettings } from "@src/config/defaults";
import { LangExtractClient } from "@src/services/LangExtractClient";

// Test inputs
const TEST_MARKDOWN = `# Authentication System Architecture

The authentication system uses JWT tokens for stateless authentication. When a user logs in, the server generates a signed JWT containing the user ID and role. This token is sent back to the client and stored in localStorage.

On subsequent requests, the client includes the JWT in the Authorization header. The server validates the signature and extracts the user information from the token payload.

The system also supports refresh tokens for long-lived sessions. Refresh tokens are stored securely in HTTP-only cookies and can be exchanged for new access tokens when they expire.

Key components:
- AuthController: Handles login/logout endpoints
- JWTService: Manages token generation and validation
- RefreshTokenRepository: Stores refresh tokens in the database
- AuthenticationMiddleware: Protects routes by validating tokens
`;

const TEST_TYPESCRIPT = `/**
 * GraphEngine Class
 *
 * Manages in-memory graph operations using Graphology library.
 * Provides methods for node/edge manipulation, traversal, and analysis.
 */

import { MultiDirectedGraph } from "graphology";
import { PageRank } from "graphology-metrics/centrality/page-rank";
import { Louvain } from "graphology-communities-louvain";

export class GraphEngine {
  private graph: MultiDirectedGraph;
  private pageRank: PageRank;
  private louvain: Louvain;

  constructor() {
    this.graph = new MultiDirectedGraph();
    this.pageRank = new PageRank();
    this.louvain = new Louvain();
  }

  /**
   * Add a node to the graph
   */
  addNode(id: string, attributes: Record<string, any>): void {
    this.graph.addNode(id, attributes);
  }

  /**
   * Add an edge between two nodes
   */
  addEdge(source: string, target: string, type: string): void {
    this.graph.addEdge(source, target, { type });
  }

  /**
   * Run PageRank algorithm to calculate node importance
   */
  calculatePageRank(): Map<string, number> {
    return this.pageRank.assign(this.graph);
  }

  /**
   * Detect communities using Louvain algorithm
   */
  detectCommunities(): Map<string, number> {
    return this.louvain.assign(this.graph);
  }

  /**
   * Find nodes within N hops of a starting node
   */
  findNeighbors(startNode: string, maxDepth: number): string[] {
    const neighbors: string[] = [];
    const visited = new Set<string>();
    const queue: { node: string; depth: number }[] = [{ node: startNode, depth: 0 }];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (depth > maxDepth) continue;
      if (visited.has(node)) continue;

      visited.add(node);
      neighbors.push(node);

      this.graph.forEachOutNeighbor(node, (neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, depth: depth + 1 });
        }
      });
    }

    return neighbors;
  }
}
`;

interface TestResult {
  provider: string;
  inputType: string;
  success: boolean;
  responseTime: number;
  entityCount: number;
  relationshipCount: number;
  error?: string;
  sampleEntities?: string[];
  sampleRelationships?: string[];
}

interface ProviderConfig {
  name: string;
  envVar?: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "gemini",
    envVar: "GEMINI_API_KEY",
    description: "Google Gemini API",
  },
  { name: "ollama", envVar: undefined, description: "Local Ollama instance" },
  {
    name: "ollama_cloud",
    envVar: "OLLAMA_CLOUD_HOST",
    description: "Cloud Ollama instance",
  },
  {
    name: "openrouter",
    envVar: "OPENROUTER_API_KEY",
    description: "OpenRouter API",
  },
];

/**
 * Check if a provider is available
 */
function isProviderAvailable(provider: string): boolean {
  const config = PROVIDERS.find((p) => p.name === provider);
  if (!config) return false;

  if (!config.envVar) return true; // No env var required (e.g., local ollama)
  return !!process.env[config.envVar];
}

/**
 * Create a temporary settings file for testing
 */
function createTestSettings(provider: string): string {
  const settingsPath = join(process.cwd(), "amalfa.settings.json");

  const settings: AmalfaSettings = {
    langExtract: {
      provider: provider as any,
      fallbackOrder: ["gemini", "ollama", "ollama_cloud", "openrouter"],
      gemini: {
        model: "gemini-flash-latest",
      },
      ollama: {
        model: "qwen2.5:1.5b",
      },
      ollama_cloud: {
        host: "",
        model: "qwen2.5:7b",
      },
      openrouter: {
        model: "qwen/qwen-2.5-72b-instruct",
      },
    },
  };

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  return settingsPath;
}

/**
 * Remove test settings file
 */
function removeTestSettings(settingsPath: string): void {
  if (existsSync(settingsPath)) {
    unlinkSync(settingsPath);
  }
}

/**
 * Run a single extraction test with timeout
 */
async function runExtractionTest(
  client: LangExtractClient,
  text: string,
  inputType: string,
  timeoutMs: number = 120000,
): Promise<TestResult> {
  const startTime = Date.now();
  let result: TestResult;

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout after ${timeoutMs}ms`)),
        timeoutMs,
      );
    });

    // Run extraction with timeout
    const extractPromise = client.extract(text);
    const graphData = await Promise.race([extractPromise, timeoutPromise]);

    const responseTime = Date.now() - startTime;

    if (!graphData) {
      result = {
        provider: "unknown",
        inputType,
        success: false,
        responseTime,
        entityCount: 0,
        relationshipCount: 0,
        error: "No data returned",
      };
    } else {
      result = {
        provider: "unknown", // Will be set by caller
        inputType,
        success: true,
        responseTime,
        entityCount: graphData.entities.length,
        relationshipCount: graphData.relationships.length,
        sampleEntities: graphData.entities
          .slice(0, 3)
          .map((e) => `${e.name} (${e.type})`),
        sampleRelationships: graphData.relationships
          .slice(0, 3)
          .map((r) => `${r.source} -> ${r.target} [${r.type}]`),
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    result = {
      provider: "unknown",
      inputType,
      success: false,
      responseTime,
      entityCount: 0,
      relationshipCount: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return result;
}

/**
 * Format a test result for display
 */
function formatResult(result: TestResult): string {
  const status = result.success ? "✅" : "❌";
  const time = `${result.responseTime}ms`;
  const entities = `${result.entityCount} entities`;
  const relationships = `${result.relationshipCount} relationships`;

  let output = `${status} ${result.provider} (${result.inputType}): ${time}, ${entities}, ${relationships}`;

  if (result.error) {
    output += `\n   Error: ${result.error}`;
  }

  if (result.sampleEntities && result.sampleEntities.length > 0) {
    output += `\n   Entities: ${result.sampleEntities.join(", ")}`;
  }

  if (result.sampleRelationships && result.sampleRelationships.length > 0) {
    output += `\n   Relationships: ${result.sampleRelationships.join(", ")}`;
  }

  return output;
}

/**
 * Compare results across providers
 */
function compareResults(results: TestResult[]): void {
  console.log("\n📊 Comparison Summary:");
  console.log("=".repeat(80));

  // Group by input type
  const byInputType = new Map<string, TestResult[]>();
  for (const result of results) {
    if (!byInputType.has(result.inputType)) {
      byInputType.set(result.inputType, []);
    }
    byInputType.get(result.inputType)?.push(result);
  }

  for (const [inputType, typeResults] of byInputType) {
    console.log(`\n${inputType}:`);
    console.log("-".repeat(80));

    const successful = typeResults.filter((r) => r.success);
    if (successful.length === 0) {
      console.log("  No successful extractions");
      continue;
    }

    // Find fastest
    const fastest = successful.reduce((a, b) =>
      a.responseTime < b.responseTime ? a : b,
    );
    console.log(
      `  ⚡ Fastest: ${fastest.provider} (${fastest.responseTime}ms)`,
    );

    // Find most entities
    const mostEntities = successful.reduce((a, b) =>
      a.entityCount > b.entityCount ? a : b,
    );
    console.log(
      `  📦 Most Entities: ${mostEntities.provider} (${mostEntities.entityCount})`,
    );

    // Find most relationships
    const mostRelationships = successful.reduce((a, b) =>
      a.relationshipCount > b.relationshipCount ? a : b,
    );
    console.log(
      `  🔗 Most Relationships: ${mostRelationships.provider} (${mostRelationships.relationshipCount})`,
    );

    // Average response time
    const avgTime = Math.round(
      successful.reduce((sum, r) => sum + r.responseTime, 0) /
        successful.length,
    );
    console.log(`  ⏱️  Average Time: ${avgTime}ms`);
  }
}

/**
 * Main test execution
 */
async function main() {
  const args = process.argv.slice(2);
  const providerArg = args
    .find((a) => a.startsWith("--provider="))
    ?.split("=")[1];
  const timeoutArg = args
    .find((a) => a.startsWith("--timeout="))
    ?.split("=")[1];
  const timeoutMs = timeoutArg ? parseInt(timeoutArg, 10) : 120000;

  console.log("🧪 Substrate Ping Test");
  console.log("=".repeat(80));
  console.log(`Timeout: ${timeoutMs}ms`);
  console.log("");

  // Check if LangExtract is available
  const tempClient = new LangExtractClient();
  const isAvailable = await tempClient.isAvailable();

  if (!isAvailable) {
    console.error("❌ LangExtract substrate is not available");
    console.error(
      "   Make sure uv is installed and the sidecar directory exists",
    );
    process.exit(1);
  }

  console.log("✅ LangExtract substrate is available");
  console.log("");

  // Determine which providers to test
  const providersToTest = providerArg
    ? [providerArg]
    : PROVIDERS.filter((p) => isProviderAvailable(p.name)).map((p) => p.name);

  if (providersToTest.length === 0) {
    console.error("❌ No providers available to test");
    console.error("   Set environment variables for at least one provider:");
    for (const provider of PROVIDERS) {
      if (provider.envVar) {
        console.error(`   - ${provider.name}: ${provider.envVar}`);
      }
    }
    process.exit(1);
  }

  console.log(`📋 Testing providers: ${providersToTest.join(", ")}`);
  console.log("");

  const results: TestResult[] = [];

  // Test each provider with each input type
  for (const provider of providersToTest) {
    console.log(`\n🔍 Testing ${provider}...`);
    console.log("-".repeat(80));

    // Create temporary settings file
    const settingsPath = createTestSettings(provider);

    try {
      // Test with markdown
      console.log(`  Testing with Markdown...`);
      const markdownClient = new LangExtractClient();
      const markdownResult = await runExtractionTest(
        markdownClient,
        TEST_MARKDOWN,
        "Markdown",
        timeoutMs,
      );
      markdownResult.provider = provider;
      results.push(markdownResult);
      console.log(`  ${formatResult(markdownResult)}`);

      // Test with TypeScript
      console.log(`  Testing with TypeScript...`);
      const typescriptClient = new LangExtractClient();
      const typescriptResult = await runExtractionTest(
        typescriptClient,
        TEST_TYPESCRIPT,
        "TypeScript",
        timeoutMs,
      );
      typescriptResult.provider = provider;
      results.push(typescriptResult);
      console.log(`  ${formatResult(typescriptResult)}`);
    } finally {
      // Remove test settings file
      removeTestSettings(settingsPath);
    }
  }

  // Display comparison
  compareResults(results);

  // Summary
  console.log("\n📈 Test Summary:");
  console.log("=".repeat(80));
  const totalTests = results.length;
  const successfulTests = results.filter((r) => r.success).length;
  const failedTests = totalTests - successfulTests;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Successful: ${successfulTests}`);
  console.log(`❌ Failed: ${failedTests}`);

  if (failedTests > 0) {
    console.log("\n❌ Failed Tests:");
    for (const result of results.filter((r) => !r.success)) {
      console.log(
        `  - ${result.provider} (${result.inputType}): ${result.error}`,
      );
    }
    process.exit(1);
  }

  console.log("\n✅ All tests passed!");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
