#!/usr/bin/env bun

// @ts-nocheck
/**
 * Test Substrate Error Responses
 *
 * Tests what the substrate returns when providers are misconfigured
 * to understand why Zod validation is failing.
 */

import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const TEST_TEXT = `# Authentication System

The authentication system uses JWT tokens for stateless authentication.
`;

async function testProvider(providerName: string, env: Record<string, string>) {
  console.log(`\n🔍 Testing provider: ${providerName}`);
  console.log("=".repeat(80));
  console.log("Environment:");
  for (const [key, value] of Object.entries(env)) {
    const maskedValue =
      key.includes("KEY") || key.includes("TOKEN") ? "***" : value || "(empty)";
    console.log(`  ${key}=${maskedValue}`);
  }
  console.log("");

  const sidecarPath = resolve(process.cwd(), "src/sidecars/lang-extract");

  const transport = new StdioClientTransport({
    command: "uv",
    args: ["run", "server.py"],
    cwd: sidecarPath,
    env: {
      ...process.env,
      ...env,
    },
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    console.log("⏳ Connecting...");
    await client.connect(transport);
    console.log("✅ Connected");
    console.log("");

    console.log("📤 Calling extract_graph tool...");
    const result = await client.callTool({
      name: "extract_graph",
      arguments: { text: TEST_TEXT },
    });

    console.log("📥 Raw Response:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log("=".repeat(80));
    console.log("");

    // Analyze response
    if (!result) {
      console.log("❌ Result is null/undefined");
      return;
    }

    if ("content" in result) {
      const content = (result as any).content;
      if (Array.isArray(content) && content.length > 0) {
        const item = content[0];
        if (item.type === "text") {
          console.log("📄 Response Text:");
          console.log("-".repeat(80));
          console.log(item.text);
          console.log("-".repeat(80));
          console.log("");

          // Try to parse as JSON
          try {
            const parsed = JSON.parse(item.text);
            console.log("✅ Successfully parsed as JSON");
            console.log(`   Keys: ${Object.keys(parsed).join(", ")}`);

            if ("error" in parsed) {
              console.log(`   ⚠️  Error field present: ${parsed.error}`);
            }

            if ("entities" in parsed) {
              console.log(
                `   ✅ entities field: ${Array.isArray(parsed.entities) ? "array" : typeof parsed.entities}`,
              );
            } else {
              console.log(`   ❌ entities field missing`);
            }

            if ("relationships" in parsed) {
              console.log(
                `   ✅ relationships field: ${Array.isArray(parsed.relationships) ? "array" : typeof parsed.relationships}`,
              );
            } else {
              console.log(`   ❌ relationships field missing`);
            }
          } catch (e) {
            console.log("❌ Failed to parse as JSON");
            console.log(`   Error: ${e}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("");
    console.error("Error details:");
    console.error(JSON.stringify(error, null, 2));
  } finally {
    console.log("");
    console.log("🔌 Closing connection...");
    await transport.close();
    console.log("✅ Closed");
  }
}

async function main() {
  console.log("🧪 Substrate Error Response Test");
  console.log("=".repeat(80));
  console.log("");

  // Test 1: Ollama Cloud without host (misconfigured)
  await testProvider("ollama_cloud (no host)", {
    LANGEXTRACT_PROVIDER: "ollama_cloud",
    OLLAMA_CLOUD_HOST: "", // Empty - misconfigured
    OLLAMA_CLOUD_MODEL: "qwen2.5:7b",
  });

  // Test 2: Ollama Cloud with invalid host
  await testProvider("ollama_cloud (invalid host)", {
    LANGEXTRACT_PROVIDER: "ollama_cloud",
    OLLAMA_CLOUD_HOST: "http://invalid-host-that-does-not-exist:11434",
    OLLAMA_CLOUD_MODEL: "qwen2.5:7b",
  });

  // Test 3: Gemini without API key
  await testProvider("gemini (no API key)", {
    LANGEXTRACT_PROVIDER: "gemini",
    GEMINI_API_KEY: "", // Empty - misconfigured
    GEMINI_MODEL: "gemini-flash-latest",
  });

  // Test 4: OpenRouter without API key
  await testProvider("openrouter (no API key)", {
    LANGEXTRACT_PROVIDER: "openrouter",
    OPENROUTER_API_KEY: "", // Empty - misconfigured
    OPENROUTER_MODEL: "qwen/qwen-2.5-72b-instruct",
  });

  console.log("\n✅ All tests complete");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
