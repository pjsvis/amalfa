#!/usr/bin/env bun
/**
 * scripts/test-langextract-ollama.ts
 * 
 * Test the LangExtract sidecar with Ollama provider
 * Tests both local and remote Ollama scenarios
 */

import { LangExtractClient } from "@src/lib/sidecar/LangExtractClient";

const TEST_TEXT = `
The GraphQL API uses Apollo Server to handle requests. 
The PostgreSQL database stores user profiles and session tokens.
Redis is used for caching frequently accessed data.
The authentication middleware validates JWT tokens before processing requests.
`;

async function testOllamaLocal() {
	console.log("\n━".repeat(40));
	console.log("🔍 Testing Local Ollama Provider");
	console.log("━".repeat(40));
	console.log();
	
	const client = new LangExtractClient();
	
	const isAvailable = await client.isAvailable();
	if (!isAvailable) {
		console.error("❌ LangExtract sidecar not available");
		console.error("   Make sure 'uv' is installed and server.py exists");
		process.exit(1);
	}
	
	console.log("✅ Sidecar available");
	console.log();
	
	console.log("Configuration:");
	console.log(`  Provider: ollama`);
	console.log(`  Model: ${process.env.OLLAMA_MODEL || "NOT SET"}`);
	console.log(`  URL: ${process.env.OLLAMA_URL || "http://localhost:11434 (default)"}`);
	console.log();
	
	if (!process.env.OLLAMA_MODEL) {
		console.error("❌ OLLAMA_MODEL environment variable not set");
		console.error("   Example: export OLLAMA_MODEL=gemma2:2b");
		process.exit(1);
	}
	
	console.log("Connecting to sidecar...");
	await client.connect();
	console.log("✅ Connected");
	console.log();
	
	console.log("Extracting graph from test text...");
	console.log("Text:", TEST_TEXT.trim().substring(0, 100) + "...");
	console.log();
	
	const startTime = Date.now();
	const result = await client.extractEntities(TEST_TEXT);
	const duration = Date.now() - startTime;
	
	console.log(`⏱️  Extraction took ${duration}ms`);
	console.log();
	
	if (!result) {
		console.error("❌ Extraction failed (returned null)");
		await client.close();
		process.exit(1);
	}
	
	console.log("✅ Extraction successful");
	console.log();
	console.log("Results:");
	console.log(`  Entities: ${result.entities.length}`);
	console.log(`  Relationships: ${result.relationships.length}`);
	console.log();
	
	console.log("Entities:");
	for (const entity of result.entities) {
		console.log(`  • ${entity.name} (${entity.type})`);
		if (entity.description) {
			console.log(`    ${entity.description}`);
		}
	}
	console.log();
	
	console.log("Relationships:");
	for (const rel of result.relationships) {
		console.log(`  • ${rel.source} --[${rel.type}]--> ${rel.target}`);
		if (rel.description) {
			console.log(`    ${rel.description}`);
		}
	}
	console.log();
	
	await client.close();
	console.log("✅ Test complete");
	console.log();
}

async function testOllamaRemote() {
	console.log("\n━".repeat(40));
	console.log("🌐 Testing Remote Ollama Provider");
	console.log("━".repeat(40));
	console.log();
	
	const client = new LangExtractClient();
	
	console.log("Configuration:");
	console.log(`  Provider: ollama`);
	console.log(`  Model: ${process.env.OLLAMA_MODEL || "NOT SET"}`);
	console.log(`  URL: ${process.env.OLLAMA_URL || "NOT SET"}`);
	console.log(`  API Key: ${process.env.OLLAMA_API_KEY ? "***" + process.env.OLLAMA_API_KEY.slice(-4) : "NOT SET"}`);
	console.log();
	
	if (!process.env.OLLAMA_URL || process.env.OLLAMA_URL.includes("localhost")) {
		console.log("⏭️  Skipping remote test (OLLAMA_URL not set or points to localhost)");
		console.log("   To test remote: export OLLAMA_URL=https://your-ollama-instance.com");
		return;
	}
	
	console.log("Connecting to sidecar...");
	await client.connect();
	console.log("✅ Connected");
	console.log();
	
	console.log("Extracting graph from test text...");
	const startTime = Date.now();
	const result = await client.extractEntities(TEST_TEXT);
	const duration = Date.now() - startTime;
	
	console.log(`⏱️  Extraction took ${duration}ms`);
	console.log();
	
	if (!result) {
		console.error("❌ Extraction failed (returned null)");
		await client.close();
		process.exit(1);
	}
	
	console.log("✅ Remote extraction successful");
	console.log(`  Entities: ${result.entities.length}`);
	console.log(`  Relationships: ${result.relationships.length}`);
	console.log();
	
	await client.close();
}

async function testGeminiBackwardCompat() {
	console.log("\n━".repeat(40));
	console.log("🔄 Testing Gemini Backward Compatibility");
	console.log("━".repeat(40));
	console.log();
	
	console.log("Configuration:");
	console.log(`  Provider: gemini (default)`);
	console.log(`  API Key: ${process.env.GEMINI_API_KEY ? "***" + process.env.GEMINI_API_KEY.slice(-4) : "NOT SET"}`);
	console.log();
	
	if (!process.env.GEMINI_API_KEY) {
		console.log("⏭️  Skipping Gemini test (GEMINI_API_KEY not set)");
		return;
	}
	
	const client = new LangExtractClient();
	
	console.log("Connecting to sidecar...");
	await client.connect();
	console.log("✅ Connected");
	console.log();
	
	console.log("Extracting graph from test text...");
	const startTime = Date.now();
	const result = await client.extractEntities(TEST_TEXT);
	const duration = Date.now() - startTime;
	
	console.log(`⏱️  Extraction took ${duration}ms`);
	console.log();
	
	if (!result) {
		console.error("❌ Extraction failed (returned null)");
		await client.close();
		process.exit(1);
	}
	
	console.log("✅ Gemini extraction successful");
	console.log(`  Entities: ${result.entities.length}`);
	console.log(`  Relationships: ${result.relationships.length}`);
	console.log();
	
	await client.close();
}

async function main() {
	console.log("\n🧪 LangExtract Provider Integration Tests");
	
	const provider = process.env.LANGEXTRACT_PROVIDER || "gemini";
	
	if (provider === "ollama") {
		await testOllamaLocal();
		await testOllamaRemote();
	} else if (provider === "gemini") {
		await testGeminiBackwardCompat();
	} else {
		console.error(`❌ Unknown provider: ${provider}`);
		process.exit(1);
	}
	
	console.log("\n✅ All tests passed!\n");
}

await main();
