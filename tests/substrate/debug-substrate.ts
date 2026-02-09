#!/usr/bin/env bun

/**
 * Substrate Debug Script
 *
 * Inspects raw substrate responses to debug Zod validation issues.
 */

import { resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const TEST_TEXT = `# Authentication System

The authentication system uses JWT tokens for stateless authentication. When a user logs in, the server generates a signed JWT containing the user ID and role.

Key components:
- AuthController: Handles login/logout endpoints
- JWTService: Manages token generation and validation
- RefreshTokenRepository: Stores refresh tokens in the database
`;

async function main() {
  console.log("🔍 Substrate Debug Script");
  console.log("=".repeat(80));
  console.log("");

  const sidecarPath = resolve(process.cwd(), "src/sidecars/lang-extract");

  console.log("📡 Connecting to substrate...");
  console.log(`   Path: ${sidecarPath}`);
  console.log("");

  const transport = new StdioClientTransport({
    command: "uv",
    args: ["run", "server.py"],
    cwd: sidecarPath,
    env: {
      ...process.env,
      LANGEXTRACT_PROVIDER: "gemini",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
      GEMINI_MODEL: "gemini-flash-latest",
    },
  });

  const client = new Client(
    { name: "debug-client", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    console.log("⏳ Connecting...");
    await client.connect(transport);
    console.log("✅ Connected");
    console.log("");

    console.log("📤 Calling extract_graph tool...");
    console.log(`   Input length: ${TEST_TEXT.length} chars`);
    console.log("");

    const result = await client.callTool({
      name: "extract_graph",
      arguments: { text: TEST_TEXT },
    });

    console.log("📥 Raw Response:");
    console.log("=".repeat(80));
    console.log(JSON.stringify(result, null, 2));
    console.log("=".repeat(80));
    console.log("");

    console.log("🔍 Response Structure Analysis:");
    console.log("");

    if (!result) {
      console.log("❌ Result is null/undefined");
    } else {
      console.log(`✅ Result type: ${typeof result}`);
      console.log(`✅ Result keys: ${Object.keys(result).join(", ")}`);
      console.log("");

      if ("content" in result) {
        console.log(`✅ Has 'content' property`);
        const content = (result as any).content;
        console.log(`   Content type: ${typeof content}`);
        console.log(`   Content is array: ${Array.isArray(content)}`);
        console.log(
          `   Content length: ${Array.isArray(content) ? content.length : "N/A"}`,
        );
        console.log("");

        if (Array.isArray(content) && content.length > 0) {
          console.log(`✅ Content has ${content.length} item(s)`);
          for (let i = 0; i < content.length; i++) {
            const item = content[i];
            console.log(`   Item ${i}:`);
            console.log(`     Type: ${item.type}`);
            console.log(`     Has text: ${"text" in item}`);
            if ("text" in item) {
              console.log(`     Text length: ${item.text.length} chars`);
              console.log(
                `     Text preview: ${item.text.substring(0, 200)}...`,
              );
              console.log("");
              console.log(`     Full text:`);
              console.log(`     ${"-".repeat(76)}`);
              console.log(item.text);
              console.log(`     ${"-".repeat(76)}`);
            }
          }
        }
      } else {
        console.log("❌ No 'content' property in result");
      }
    }

    console.log("");
    console.log("✅ Debug complete");
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

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
