#!/usr/bin/env -S bun run

/**
 * LangExtract Model Comparison Test
 *
 * Compares extraction quality between different Ollama models
 * using representative markdown and TypeScript files from the project.
 *
 * Tests:
 * - Entity extraction accuracy
 * - Relationship extraction quality
 * - Latency and performance
 * - JSON format validity
 */

import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { $ } from "bun";

interface TestFile {
  path: string;
  type: "markdown" | "typescript";
  description: string;
  expectedEntities?: number;
  expectedRelationships?: number;
}

interface ExtractionResult {
  model: string;
  provider: string;
  testFile: string;
  fileType: string;
  timestamp: string;
  latencyMs: number;
  success: boolean;
  entities: number;
  relationships: number;
  validJson: boolean;
  error?: string;
  sampleEntities?: Array<{ name: string; type: string }>;
  sampleRelationships?: Array<{ source: string; target: string; type: string }>;
}

// Representative test files from the project
const TEST_FILES: TestFile[] = [
  {
    path: "src/tools/EmberExtractTool.ts",
    type: "typescript",
    description: "Ember extraction tool with LangExtract integration",
    expectedEntities: 8,
    expectedRelationships: 6,
  },
  {
    path: "src/core/GraphEngine.ts",
    type: "typescript",
    description: "Graph engine with Graphology integration",
    expectedEntities: 10,
    expectedRelationships: 8,
  },
  {
    path: "src/core/Harvester.ts",
    type: "typescript",
    description: "Harvester for tag scanning and clustering",
    expectedEntities: 6,
    expectedRelationships: 4,
  },
  {
    path: "src/core/SemanticWeaver.ts",
    type: "typescript",
    description: "Semantic weaver for orphan rescue",
    expectedEntities: 7,
    expectedRelationships: 5,
  },
  {
    path: "README.md",
    type: "markdown",
    description: "Project README with API key documentation",
    expectedEntities: 12,
    expectedRelationships: 8,
  },
  {
    path: "docs/API_KEYS.md",
    type: "markdown",
    description: "API keys documentation with provider details",
    expectedEntities: 15,
    expectedRelationships: 10,
  },
];

// Models to test
const MODELS = [
  {
    name: "gemini-flash-latest",
    provider: "gemini",
    description: "Google Gemini Flash - Reference model",
  },
  {
    name: "nemotron-3-nano:30b-cloud",
    provider: "remote",
    description: "30B parameters, remote model via Ollama",
  },
  {
    name: "mistral-nemo:latest",
    provider: "local",
    description: "7.1 GB, local model",
  },
];

const RESULTS_FILE = resolve("tests/langextract-comparison/results.jsonl");

/**
 * Read test file content
 */
function readTestFile(filePath: string): string {
  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read ${filePath}:`, error);
    return "";
  }
}

/**
 * Test extraction with a specific model
 */
async function testModel(
  model: string,
  provider: string,
  testFile: TestFile,
): Promise<ExtractionResult> {
  const content = readTestFile(testFile.path);
  if (!content) {
    return {
      model,
      provider,
      testFile: testFile.path,
      fileType: testFile.type,
      timestamp: new Date().toISOString(),
      latencyMs: 0,
      success: false,
      entities: 0,
      relationships: 0,
      validJson: false,
      error: "Failed to read file",
    };
  }

  console.log(`\n🧪 Testing ${model} on ${testFile.path}`);

  try {
    const start = Date.now();

    // Build the prompt separately to avoid escaping issues
    const prompt = `Analyze the following ${testFile.type} code and extract a knowledge graph. Identify key entities (classes, functions, interfaces, concepts, technologies) and relationships between them. Output ONLY valid JSON in this exact format (no markdown, no code blocks): {"entities": [{"name": "Entity Name", "type": "EntityType", "description": "Context"}], "relationships": [{"source": "Entity1", "target": "Entity2", "type": "RELATIONSHIP_TYPE", "description": "Why they are related"}]}\n\nCode to analyze:\n${content.substring(0, 2000)}`;

    let response;
    if (provider === "gemini") {
      // Use Gemini API
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not set");
      }
      response =
        await $`curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}" -X POST -H "Content-Type: application/json" -d ${JSON.stringify(
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              response_mime_type: "application/json",
            },
          },
        )}`;
    } else {
      // Use Ollama API for local and remote models
      response =
        await $`curl -s http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d ${JSON.stringify(
          {
            model: model,
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            stream: false,
            format: "json",
          },
        )}`;
    }

    const latency = Date.now() - start;

    if (response.exitCode !== 0) {
      console.log(`   ❌ Curl failed: ${response.stderr.toString()}`);
      return {
        model,
        provider,
        testFile: testFile.path,
        fileType: testFile.type,
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        success: false,
        entities: 0,
        relationships: 0,
        validJson: false,
        error: response.stderr.toString(),
      };
    }

    const stdout = response.stdout.toString();
    console.log(`   Response length: ${stdout.length}`);

    let result;
    try {
      result = JSON.parse(stdout);
    } catch (parseError) {
      console.log(`   ❌ Failed to parse response as JSON: ${parseError}`);
      console.log(`   Response preview: ${stdout.substring(0, 200)}`);
      return {
        model,
        provider,
        testFile: testFile.path,
        fileType: testFile.type,
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        success: false,
        entities: 0,
        relationships: 0,
        validJson: false,
        error: `Failed to parse response: ${parseError}`,
      };
    }

    // Handle different response formats
    let contentStr = "";
    if (provider === "gemini") {
      // Gemini format: result.candidates[0].content.parts[0].text
      if (result.candidates && result.candidates.length > 0) {
        contentStr = result.candidates[0].content?.parts?.[0]?.text || "";
      }
    } else {
      // Ollama format: result.message.content
      contentStr = result.message?.content || "";
    }

    // Debug: log raw content
    console.log(`   Raw content length: ${contentStr.length}`);
    if (contentStr.length > 0) {
      console.log(`   Raw content preview: ${contentStr.substring(0, 200)}...`);
    } else {
      console.log(`   ⚠️  Empty content string`);
    }

    // Clean up markdown code blocks if present
    contentStr = contentStr.trim();
    if (contentStr.startsWith("```json")) {
      contentStr = contentStr.replace("```json", "").replace("```", "").trim();
    }

    // Try to parse as JSON
    let parsedContent;
    let validJson = false;
    try {
      parsedContent = JSON.parse(contentStr);
      validJson = true;
      console.log(`   ✅ Parsed JSON successfully`);
    } catch (parseError) {
      console.log(`   ❌ JSON parse failed: ${parseError}`);
      console.log(
        `   Content that failed to parse: ${contentStr.substring(0, 500)}`,
      );
      parsedContent = null;
    }

    if (!parsedContent) {
      return {
        model,
        provider,
        testFile: testFile.path,
        fileType: testFile.type,
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        success: false,
        entities: 0,
        relationships: 0,
        validJson: false,
        error: "Failed to parse JSON",
      };
    }

    if (!parsedContent.entities || !parsedContent.relationships) {
      console.log(`   Missing entities or relationships in parsed content`);
      console.log(
        `   Keys in parsed content: ${Object.keys(parsedContent).join(", ")}`,
      );
      return {
        model,
        provider,
        testFile: testFile.path,
        fileType: testFile.type,
        timestamp: new Date().toISOString(),
        latencyMs: latency,
        success: false,
        entities: 0,
        relationships: 0,
        validJson: true,
        error: "Missing entities or relationships",
      };
    }

    const entities = parsedContent.entities || [];
    const relationships = parsedContent.relationships || [];

    console.log(`   ✅ Success (${latency}ms)`);
    console.log(
      `   Entities: ${entities.length}, Relationships: ${relationships.length}`,
    );

    return {
      model,
      provider,
      testFile: testFile.path,
      fileType: testFile.type,
      timestamp: new Date().toISOString(),
      latencyMs: latency,
      success: true,
      entities: entities.length,
      relationships: relationships.length,
      validJson: true,
      sampleEntities: entities.slice(0, 3).map((e: any) => ({
        name: e.name,
        type: e.type,
      })),
      sampleRelationships: relationships.slice(0, 3).map((r: any) => ({
        source: r.source,
        target: r.target,
        type: r.type,
      })),
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
    return {
      model,
      provider,
      testFile: testFile.path,
      fileType: testFile.type,
      timestamp: new Date().toISOString(),
      latencyMs: 0,
      success: false,
      entities: 0,
      relationships: 0,
      validJson: false,
      error: String(error),
    };
  }
}

/**
 * Save result to JSONL file
 */
function saveResult(result: ExtractionResult) {
  const line = JSON.stringify(result) + "\n";
  appendFileSync(RESULTS_FILE, line);
}

/**
 * Calculate statistics for results
 */
interface ModelStats {
  model: string;
  provider: string;
  totalTests: number;
  successfulTests: number;
  successRate: number;
  avgLatency: number;
  avgEntities: number;
  avgRelationships: number;
  totalEntities: number;
  totalRelationships: number;
  validJsonRate: number;
}

function calculateStats(results: ExtractionResult[]): ModelStats[] {
  const grouped = results.reduce(
    (acc, result) => {
      const key = result.model;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(result);
      return acc;
    },
    {} as Record<string, ExtractionResult[]>,
  );

  return Object.entries(grouped).map(([model, modelResults]) => {
    const successful = modelResults.filter((r) => r.success);
    const validJson = modelResults.filter((r) => r.validJson);

    const avgLatency =
      successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length ||
      0;
    const avgEntities =
      successful.reduce((sum, r) => sum + r.entities, 0) / successful.length ||
      0;
    const avgRelationships =
      successful.reduce((sum, r) => sum + r.relationships, 0) /
        successful.length || 0;

    return {
      model,
      provider: modelResults[0].provider,
      totalTests: modelResults.length,
      successfulTests: successful.length,
      successRate: (successful.length / modelResults.length) * 100,
      avgLatency,
      avgEntities,
      avgRelationships,
      totalEntities: successful.reduce((sum, r) => sum + r.entities, 0),
      totalRelationships: successful.reduce(
        (sum, r) => sum + r.relationships,
        0,
      ),
      validJsonRate: (validJson.length / modelResults.length) * 100,
    };
  });
}

/**
 * Print comparison results
 */
function printComparison(results: ExtractionResult[]) {
  console.log("\n" + "=".repeat(100));
  console.log("📊 MODEL COMPARISON RESULTS");
  console.log("=".repeat(100));

  const stats = calculateStats(results);

  console.log("\n📈 Overall Statistics:");
  console.log(
    "Model".padEnd(40) +
      "Provider".padEnd(10) +
      "Success".padEnd(10) +
      "Valid JSON".padEnd(12) +
      "Avg Latency".padEnd(15) +
      "Avg Entities".padEnd(15) +
      "Avg Relations".padEnd(15),
  );
  console.log(
    "-".repeat(40) +
      " ".repeat(10) +
      "-".repeat(10) +
      "-".repeat(12) +
      "-".repeat(15) +
      "-".repeat(15) +
      "-".repeat(15),
  );

  for (const stat of stats) {
    console.log(
      stat.model.padEnd(40) +
        stat.provider.padEnd(10) +
        `${stat.successRate.toFixed(1)}%`.padEnd(10) +
        `${stat.validJsonRate.toFixed(1)}%`.padEnd(12) +
        `${stat.avgLatency.toFixed(0)}ms`.padEnd(15) +
        `${stat.avgEntities.toFixed(1)}`.padEnd(15) +
        `${stat.avgRelationships.toFixed(1)}`.padEnd(15),
    );
  }

  console.log("\n📁 File-by-File Results:");
  for (const testFile of TEST_FILES) {
    console.log(`\n${testFile.path} (${testFile.type})`);
    console.log(`   ${testFile.description}`);
    console.log(
      "   " +
        "Model".padEnd(40) +
        "Success".padEnd(10) +
        "Entities".padEnd(10) +
        "Relations".padEnd(12) +
        "Latency".padEnd(10),
    );

    const fileResults = results.filter((r) => r.testFile === testFile.path);
    for (const result of fileResults) {
      const status = result.success ? "✅" : "❌";
      console.log(
        `   ${status} ${result.model.padEnd(40)}` +
          `${result.entities.toString().padEnd(10)}` +
          `${result.relationships.toString().padEnd(12)}` +
          `${result.latencyMs.toString().padEnd(10)}ms`,
      );

      if (result.success && result.sampleEntities) {
        console.log(
          `      Sample entities: ${result.sampleEntities.map((e) => e.name).join(", ")}`,
        );
      }
    }
  }

  console.log("\n💡 Recommendations:");

  const fastest = stats.sort((a, b) => a.avgLatency - b.avgLatency)[0];
  console.log(
    `   🚀 Fastest: ${fastest.model} (${fastest.avgLatency.toFixed(0)}ms average)`,
  );

  const mostProductive = stats.sort(
    (a, b) =>
      b.totalEntities +
      b.totalRelationships -
      (a.totalEntities + a.totalRelationships),
  )[0];
  console.log(
    `   📊 Most Productive: ${mostProductive.model} (${mostProductive.totalEntities + mostProductive.totalRelationships} total items)`,
  );

  const mostReliable = stats.sort((a, b) => b.successRate - a.successRate)[0];
  console.log(
    `   ✅ Most Reliable: ${mostReliable.model} (${mostReliable.successRate.toFixed(1)}% success rate)`,
  );
}

/**
 * Main test runner
 */
async function main() {
  console.log("🧪 LangExtract Model Comparison Test");
  console.log("Testing extraction quality on representative project files");
  console.log(`\n📁 Test Files: ${TEST_FILES.length}`);
  console.log(`🤖 Models: ${MODELS.length}`);

  const allResults: ExtractionResult[] = [];

  // Test each model on each file
  for (const modelConfig of MODELS) {
    console.log(`\n${"=".repeat(100)}`);
    console.log(`Testing Model: ${modelConfig.name}`);
    console.log(`Provider: ${modelConfig.provider}`);
    console.log(`Description: ${modelConfig.description}`);
    console.log("=".repeat(100));

    for (const testFile of TEST_FILES) {
      const result = await testModel(
        modelConfig.name,
        modelConfig.provider,
        testFile,
      );
      allResults.push(result);
      saveResult(result);
    }
  }

  // Print comparison
  printComparison(allResults);

  console.log(`\n💾 Results saved to: ${RESULTS_FILE}`);
  console.log(`📊 Total tests run: ${allResults.length}`);
}

// Run
main().catch(console.error);
