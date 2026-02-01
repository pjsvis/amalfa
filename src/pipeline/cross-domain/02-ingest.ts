/**
 * Cross-Domain Edge Ingestion
 *
 * Loads cross-domain edges from JSONL into the database.
 */

import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPath } from "@src/cli/utils";

// INPUT_PATH will be computed from getDbPath() directory

interface EdgeCandidate {
	source: string;
	target: string;
	type: string;
	confidence: number;
	method: string;
}

async function ingestCrossDomainEdges() {
	console.log("📥 Cross-Domain Edge Ingestion\n");

	// Get database path from SSOT
	const dbPath = await getDbPath();
	const inputPath = join(dbPath, "..", "cross-domain-edges.jsonl");

	console.log(`Loading edges from ${inputPath}...`);
	const fileContent = readFileSync(inputPath, "utf-8");
	const lines = fileContent.trim().split("\n");

	const edges: EdgeCandidate[] = lines
		.filter((line) => line.trim())
		.map((line) => JSON.parse(line));

	console.log(`  Loaded ${edges.length} edges\n`);

	// Connect to database
	const db = new Database(dbPath);

	// Prepare insert statement
	const insertStmt = db.query(
		"INSERT OR IGNORE INTO edges (source, target, type, confidence, context_source) VALUES (?, ?, ?, ?, ?)",
	);

	// Insert edges
	console.log("Inserting edges into database...");
	let inserted = 0;
	let skipped = 0;

	for (const edge of edges) {
		try {
			insertStmt.run(
				edge.source,
				edge.target,
				edge.type,
				edge.confidence,
				edge.method,
			);
			inserted++;
		} catch (_e) {
			// Edge might already exist (source, target, type combination)
			skipped++;
		}

		if (inserted % 500 === 0) {
			console.log(`  Inserted ${inserted}/${edges.length} edges...`);
		}
	}

	console.log(`\n✅ Ingestion complete!`);
	console.log(`   Inserted: ${inserted}`);
	console.log(`   Skipped (duplicates): ${skipped}`);

	// Verify final count
	const countResult = db.query("SELECT COUNT(*) as c FROM edges").get() as any;
	console.log(`\n📊 Total edges in database: ${countResult.c}`);

	db.close();
}

ingestCrossDomainEdges().catch(console.error);
