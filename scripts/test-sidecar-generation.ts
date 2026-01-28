#!/usr/bin/env bun
/**
 * Test LangExtract sidecar generation to assess quality and token usage
 */

import { LangExtractClient } from "../src/services/LangExtractClient";
import { existsSync } from "node:fs";

const SAMPLE_FILES = [
	"playbooks/problem-solving-playbook.md",
	"src/core/GraphEngine.ts",
];

async function main() {
	const client = new LangExtractClient();

	console.log("🔍 Testing LangExtract sidecar generation\n");

	// Check availability
	const available = await client.isAvailable();
	if (!available) {
		console.error("❌ LangExtract not available (check uv/python setup)");
		process.exit(1);
	}

	console.log("✅ LangExtract available\n");

	// Check for API key
	if (!process.env.GEMINI_API_KEY) {
		console.error("❌ GEMINI_API_KEY not set");
		process.exit(1);
	}

	console.log("✅ GEMINI_API_KEY found\n");

	for (const file of SAMPLE_FILES) {
		console.log(`\n${"=".repeat(80)}`);
		console.log(`📄 File: ${file}`);
		console.log("=".repeat(80));

		if (!existsSync(file)) {
			console.error(`❌ File not found: ${file}`);
			continue;
		}

		const content = await Bun.file(file).text();
		const contentSize = content.length;

		console.log(`\n📊 Content size: ${contentSize} chars (${Math.round(contentSize / 1024)} KB)`);

		console.log("\n⏳ Extracting...\n");
		const start = Date.now();
		const result = await client.extract(content);
		const elapsed = Date.now() - start;

		if (!result) {
			console.error("❌ Extraction failed (returned null)");
			continue;
		}

		console.log(`✅ Extraction completed in ${elapsed}ms\n`);

		// Analysis
		console.log("📦 Results:");
		console.log(`  • Entities: ${result.entities.length}`);
		console.log(`  • Relationships: ${result.relationships.length}`);

		// Show sample entities
		console.log("\n🏷️  Sample Entities (first 5):");
		result.entities.slice(0, 5).forEach((entity, i) => {
			console.log(`  ${i + 1}. [${entity.type}] ${entity.name}`);
			if (entity.description) {
				console.log(`     → ${entity.description.slice(0, 80)}${entity.description.length > 80 ? "..." : ""}`);
			}
		});

		// Show sample relationships
		console.log("\n🔗 Sample Relationships (first 5):");
		result.relationships.slice(0, 5).forEach((rel, i) => {
			console.log(`  ${i + 1}. ${rel.source} --[${rel.type}]--> ${rel.target}`);
			if (rel.description) {
				console.log(`     → ${rel.description.slice(0, 80)}${rel.description.length > 80 ? "..." : ""}`);
			}
		});

		// Save full output
		const outputPath = `${file}.test-output.json`;
		await Bun.write(
			outputPath,
			JSON.stringify(
				{
					targetFile: file,
					generatedAt: new Date().toISOString(),
					confidence: 1.0,
					graphData: result,
					stats: {
						contentChars: contentSize,
						elapsedMs: elapsed,
						entityCount: result.entities.length,
						relationshipCount: result.relationships.length,
					},
				},
				null,
				2,
			),
		);
		console.log(`\n💾 Full output saved: ${outputPath}`);
	}

	await client.close();
	console.log("\n✅ Done\n");
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
