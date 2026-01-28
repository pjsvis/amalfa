#!/usr/bin/env bun

import { LangExtractClient } from "../src/services/LangExtractClient";
import { existsSync } from "node:fs";

const TEST_FILE = "playbooks/problem-solving-playbook.md";

const PROVIDERS = [
	{ name: "Gemini", env: { LANGEXTRACT_PROVIDER: "gemini" }, requires: "GEMINI_API_KEY" },
	{ name: "Local Ollama", env: { LANGEXTRACT_PROVIDER: "ollama" }, requires: null },
	{
		name: "Ollama Cloud",
		env: { LANGEXTRACT_PROVIDER: "ollama_cloud" },
		requires: "OLLAMA_CLOUD_HOST",
	},
	{
		name: "OpenRouter",
		env: { LANGEXTRACT_PROVIDER: "openrouter" },
		requires: "OPENROUTER_API_KEY",
	},
];

async function testProvider(
	providerName: string,
	envVars: Record<string, string>,
	requires: string | null,
) {
	console.log(`\n${"=".repeat(80)}`);
	console.log(`Testing: ${providerName}`);
	console.log("=".repeat(80));

	if (requires && !process.env[requires]) {
		console.log(`⏭️  Skipped: ${requires} not set\n`);
		return null;
	}

	for (const [key, value] of Object.entries(envVars)) {
		process.env[key] = value;
	}

	const client = new LangExtractClient();

	if (!(await client.isAvailable())) {
		console.log("❌ LangExtract not available\n");
		return null;
	}

	if (!existsSync(TEST_FILE)) {
		console.log(`❌ Test file not found: ${TEST_FILE}\n`);
		return null;
	}

	const content = await Bun.file(TEST_FILE).text();
	console.log(`📄 File: ${TEST_FILE} (${Math.round(content.length / 1024)} KB)`);

	console.log("\n⏳ Extracting...");
	const start = Date.now();

	try {
		const result = await client.extract(content);
		const elapsed = Date.now() - start;

		if (!result) {
			console.log("❌ Extraction failed (returned null)\n");
			await client.close();
			return null;
		}

		console.log(`\n✅ Extraction completed in ${elapsed}ms`);
		console.log(`   Entities: ${result.entities.length}`);
		console.log(`   Relationships: ${result.relationships.length}`);

		const outputPath = `${TEST_FILE}.${providerName.toLowerCase().replace(/ /g, "-")}.json`;
		await Bun.write(
			outputPath,
			JSON.stringify(
				{
					provider: providerName,
					targetFile: TEST_FILE,
					generatedAt: new Date().toISOString(),
					confidence: 1.0,
					graphData: result,
					stats: {
						elapsedMs: elapsed,
						entityCount: result.entities.length,
						relationshipCount: result.relationships.length,
					},
				},
				null,
				2,
			),
		);

		console.log(`\n💾 Saved: ${outputPath}`);

		await client.close();
		return {
			provider: providerName,
			elapsedMs: elapsed,
			entityCount: result.entities.length,
			relationshipCount: result.relationships.length,
		};
	} catch (error) {
		console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
		await client.close();
		return null;
	}
}

async function main() {
	console.log("🧪 LangExtract Provider Comparison Test\n");

	const results = [];

	for (const provider of PROVIDERS) {
		const result = await testProvider(provider.name, provider.env, provider.requires);
		if (result) {
			results.push(result);
		}
	}

	console.log("\n" + "=".repeat(80));
	console.log("📊 Summary");
	console.log("=".repeat(80));

	if (results.length === 0) {
		console.log("No providers tested successfully\n");
		process.exit(1);
	}

	console.log(`\n${results.length} provider(s) tested:\n`);

	const maxNameLen = Math.max(...results.map((r) => r.provider.length));
	console.log(
		`Provider${" ".repeat(maxNameLen - 8)} | Time (ms) | Entities | Relationships`,
	);
	console.log("-".repeat(maxNameLen + 50));

	for (const result of results) {
		const pad = " ".repeat(maxNameLen - result.provider.length);
		console.log(
			`${result.provider}${pad} | ${String(result.elapsedMs).padStart(9)} | ${String(result.entityCount).padStart(8)} | ${String(result.relationshipCount).padStart(13)}`,
		);
	}

	console.log("\n✅ Test complete\n");
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
