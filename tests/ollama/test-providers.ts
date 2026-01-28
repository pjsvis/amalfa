#!/usr/bin/env -S bun run

/**
 * Ollama Provider Test Script
 *
 * Tests local and cloud Ollama options for LangExtract
 * Fails fast and maps out the terrain
 * Saves results to JSONL for comparison and analysis
 */

import { $ } from "bun";
import { writeFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface TestResult {
  provider: string;
  model: string;
  success: boolean;
  latency: number;
  error?: string;
  quality?: {
    entities: number;
    relationships: number;
  };
  result?: {
    entities: Array<{ name: string; type: string; description?: string }>;
    relationships: Array<{
      source: string;
      target: string;
      type: string;
      description?: string;
    }>;
  };
  raw_output?: string;
}

const TEST_TEXT = `
The LangExtract service uses LLMs to extract entities and relationships from source code.
It supports multiple providers including Gemini, Ollama (local), Ollama Cloud, and OpenRouter.
The system uses MCP (Model Context Protocol) to communicate between TypeScript and Python components.
`;

const RESULTS_FILE = resolve("tests/langextract-results/results.jsonl");

const LANGEXTRACT_PROMPT = `Analyze the following text and extract a knowledge graph.
Identify key entities (concepts, technologies, people, files) and relationships between them.

Output ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "entities": [
    {"name": "Entity Name", "type": "EntityType", "description": "Context"}
  ],
  "relationships": [
    {"source": "Entity1", "target": "Entity2", "type": "RELATIONSHIP_TYPE", "description": "Why they are related"}
  ]
}

Text to analyze:`;

/**
 * Save result to JSONL file
 */
function saveResult(result: TestResult) {
  const line = JSON.stringify(result) + "\n";
  appendFileSync(RESULTS_FILE, line);
  console.log(`💾 Saved result to: ${RESULTS_FILE}`);
}

/**
 * Test local Ollama with available models
 */
async function testLocalOllama(): Promise<TestResult[]> {
  console.log("\n🔍 Testing Local Ollama...");

  // Get available models
  const listResult = await $`ollama list`.quiet();
  if (listResult.exitCode !== 0) {
    console.log("❌ Local Ollama not available");
    return [];
  }

  const lines = listResult.stdout.toString().trim().split("\n");
  const models = lines
    .slice(1)
    .map((line) => line.split(/\s+/)[0])
    .filter(Boolean);

  console.log(`📦 Found ${models.length} local model(s): ${models.join(", ")}`);

  // Test each model
  const results: TestResult[] = [];

  for (const model of models) {
    console.log(`\n🧪 Testing model: ${model}`);

    try {
      const start = Date.now();

      const response =
        await $`curl -s http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d '{
        "model": "${model}",
        "messages": [{"role": "user", "content": "${LANGEXTRACT_PROMPT} ${TEST_TEXT}"}],
        "stream": false,
        "format": "json"
      }'`.quiet();

      const latency = Date.now() - start;

      if (response.exitCode !== 0) {
        console.log(`❌ Failed: ${response.stderr.toString()}`);
        results.push({
          provider: "local",
          model,
          success: false,
          latency,
          error: response.stderr.toString(),
        });
        continue;
      }

      const result = JSON.parse(response.stdout.toString());
      let content = result.message?.content || "";

      // Clean up markdown code blocks if present
      content = content.trim();
      if (content.startsWith("```json")) {
        content = content.replace("```json", "").replace("```", "").trim();
      }

      // Try to parse as JSON to validate structure
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = null;
      }

      // Parse quality metrics
      const entityMatches = parsedContent?.entities?.length || 0;
      const relationshipMatches = parsedContent?.relationships?.length || 0;

      console.log(
        `   Entities: ${entityMatches}, Relationships: ${relationshipMatches}`,
      );

      const testResult: TestResult = {
        provider: "local",
        model,
        success: true,
        latency,
        quality: {
          entities: entityMatches,
          relationships: relationshipMatches,
        },
        result: parsedContent,
        raw_output: content,
      };

      results.push(testResult);

      // Save result if flag is set
      if (process.argv.includes("--save")) {
        saveResult({
          ...testResult,
          timestamp: new Date().toISOString(),
          test_id: `local-${model}-${Date.now()}`,
          input_text: TEST_TEXT,
          prompt: LANGEXTRACT_PROMPT,
          metadata: {
            input_length: TEST_TEXT.length,
            entity_count: entityMatches,
            relationship_count: relationshipMatches,
            output_length: content.length,
          },
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      results.push({
        provider: "local",
        model,
        success: false,
        latency: 0,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Test cloud Ollama with API key
 */
async function testCloudOllama(): Promise<TestResult[]> {
  console.log("\n🔍 Testing Cloud Ollama...");

  // Try to get cloud host from config or use default
  const cloudHost = process.env.OLLAMA_CLOUD_HOST || "https://ollama.com";
  const apiKey = process.env.OLLAMA_API_KEY;

  if (!apiKey) {
    console.log("❌ OLLAMA_API_KEY not set in .env");
    return [];
  }

  console.log(`🌐 Cloud host: ${cloudHost}`);
  console.log(`🔑 Using API key: ${apiKey.substring(0, 20)}...`);

  const results: TestResult[] = [];

  // Test with a few cloud models
  const cloudModels = ["qwen2.5:1.5b", "phi3:mini", "tinyllama:latest"];

  for (const model of cloudModels) {
    console.log(`\n🧪 Testing cloud model: ${model}`);

    try {
      const start = Date.now();

      const response =
        await $`curl -s ${cloudHost}/v1/chat/completions -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${apiKey}" -d '{
        "model": "${model}",
        "messages": [{"role": "user", "content": "${LANGEXTRACT_PROMPT} ${TEST_TEXT}"}],
        "stream": false
      }'`.quiet();

      const latency = Date.now() - start;

      if (response.exitCode !== 0) {
        console.log(`❌ Failed: ${response.stderr.toString()}`);
        results.push({
          provider: "cloud",
          model,
          success: false,
          latency,
          error: response.stderr.toString(),
        });
        continue;
      }

      const result = JSON.parse(response.stdout.toString());

      if (result.error) {
        console.log(`❌ API Error: ${result.error}`);
        results.push({
          provider: "cloud",
          model,
          success: false,
          latency,
          error: result.error,
        });
        continue;
      }

      let content = result.choices?.[0]?.message?.content || "";

      // Clean up markdown code blocks if present
      content = content.trim();
      if (content.startsWith("```json")) {
        content = content.replace("```json", "").replace("```", "").trim();
      }

      // Try to parse as JSON to validate structure
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch {
        parsedContent = null;
      }

      // Parse quality metrics
      const entityMatches = parsedContent?.entities?.length || 0;
      const relationshipMatches = parsedContent?.relationships?.length || 0;

      console.log(`✅ Success (${latency}ms)`);
      console.log(
        `   Entities: ${entityMatches}, Relationships: ${relationshipMatches}`,
      );

      results.push({
        provider: "cloud",
        model,
        success: true,
        latency,
        quality: {
          entities: entityMatches,
          relationships: relationshipMatches,
        },
      });
    } catch (error) {
      console.log(`❌ Error: ${error}`);
      results.push({
        provider: "cloud",
        model,
        success: false,
        latency: 0,
        error: String(error),
      });
    }
  }

  return results;
}

/**
 * Print summary
 */
function printSummary(results: TestResult[]) {
  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    console.log("\n🏆 Best Performers:");

    // Sort by latency
    const byLatency = [...successful].sort((a, b) => a.latency - b.latency);
    console.log(
      `   Fastest: ${byLatency[0].provider}/${byLatency[0].model} (${byLatency[0].latency}ms)`,
    );

    // Sort by quality (entities + relationships)
    const byQuality = [...successful].sort((a, b) => {
      const aScore =
        (a.quality?.entities || 0) + (a.quality?.relationships || 0);
      const bScore =
        (b.quality?.entities || 0) + (b.quality?.relationships || 0);
      return bScore - aScore;
    });

    if (byQuality[0].quality) {
      console.log(
        `   Best Quality: ${byQuality[0].provider}/${byQuality[0].model} (${byQuality[0].quality.entities} entities, ${byQuality[0].quality.relationships} relationships)`,
      );
    }
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed Tests:");
    failed.forEach((f) => {
      console.log(`   ${f.provider}/${f.model}: ${f.error || "Unknown error"}`);
    });
  }

  // Recommendation
  console.log("\n💡 RECOMMENDATION:");

  if (successful.length === 0) {
    console.log("   No working providers found. Check configuration.");
  } else if (successful.some((r) => r.provider === "local")) {
    const bestLocal = successful
      .filter((r) => r.provider === "local")
      .sort((a, b) => a.latency - b.latency)[0];
    console.log(`   Use LOCAL Ollama with model: ${bestLocal.model}`);
    console.log(`   Set in config: langExtract.provider = "ollama"`);
    console.log(
      `   Set in config: langExtract.ollama.model = "${bestLocal.model}"`,
    );
  } else if (successful.some((r) => r.provider === "cloud")) {
    const bestCloud = successful
      .filter((r) => r.provider === "cloud")
      .sort((a, b) => a.latency - b.latency)[0];
    console.log(`   Use CLOUD Ollama with model: ${bestCloud.model}`);
    console.log(`   Set in config: langExtract.provider = "ollama_cloud"`);
    console.log(
      `   Set in config: langExtract.ollama_cloud.host = "YOUR_CLOUD_HOST"`,
    );
    console.log(
      `   Set in config: langExtract.ollama_cloud.model = "${bestCloud.model}"`,
    );
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log("🧪 Ollama Provider Test Script");
  console.log("Testing local and cloud options for LangExtract");

  if (process.argv.includes("--save")) {
    console.log("💾 Results will be saved to:", RESULTS_FILE);
    // Ensure results directory exists
    const resultsDir = resolve("tests/langextract-results");
    if (!existsSync(resultsDir)) {
      console.log("📁 Creating results directory:", resultsDir);
      // Directory will be created by writeFileSync/appendFileSync
    }
  }

  const allResults: TestResult[] = [];

  // Test local
  const localResults = await testLocalOllama();
  allResults.push(...localResults);

  // Test cloud
  const cloudResults = await testCloudOllama();
  allResults.push(...cloudResults);

  // Print summary
  printSummary(allResults);

  if (process.argv.includes("--save")) {
    console.log(`\n✅ Results saved to: ${RESULTS_FILE}`);
    console.log(
      `📊 Compare results with: bun run tests/langextract-results/compare-models.ts`,
    );
  }
}

// Run
main().catch(console.error);
