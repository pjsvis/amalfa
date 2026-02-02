/**
 * Pipeline D: Lexicon Relevance Classification
 *
 * Uses cross-domain edges and document content analysis to classify
 * lexicon entities as active, deprecated, or historical
 */

import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { getDbPath } from "@src/cli/utils";

interface RelevanceSignal {
	entity: string;
	connectedDocs: number;
	avgConfidence: number;
	deprecationScore: number;
	activeScore: number;
	classification: "active" | "deprecated" | "historical";
	reason: string;
	replacedBy?: string;
}

async function classifyLexiconRelevance() {
	console.log("🏷️  PIPELINE D: Lexicon Relevance Classification");
	console.log("================================================\n");

	const dbPath = await getDbPath();
	const db = new Database(dbPath);

	// Get all lexicon entities with their cross-domain connections
	console.log("Loading lexicon entities with connections...");
	const entities = db
		.query(
			`
		SELECT n.id, n.title, COUNT(e.target) as connection_count
		FROM nodes n
		LEFT JOIN edges e ON n.id = e.source AND e.type = 'appears_in'
		WHERE n.domain = 'lexicon'
		GROUP BY n.id, n.title
		ORDER BY connection_count DESC
	`,
		)
		.all() as any[];

	console.log(`  Found ${entities.length} lexicon entities`);
	console.log(`  Processing entities with connections...\n`);

	const classifications: RelevanceSignal[] = [];
	let processed = 0;

	for (const entity of entities) {
		if (entity.connection_count === 0) {
			// No connections = historical (mentioned but not linked)
			classifications.push({
				entity: entity.id,
				connectedDocs: 0,
				avgConfidence: 0,
				deprecationScore: 0,
				activeScore: 0,
				classification: "historical",
				reason: "No document connections found",
			});
			continue;
		}

		// Get connected documents with confidence scores
		const edges = db
			.query(
				`
			SELECT e.target, e.confidence, n.title as doc_title
			FROM edges e
			JOIN nodes n ON e.target = n.id
			WHERE e.source = ? AND e.type = 'appears_in'
			ORDER BY e.confidence DESC
		`,
			)
			.all(entity.id) as any[];

		const avgConfidence =
			edges.reduce((sum, e) => sum + e.confidence, 0) / edges.length;

		// Analyze document content for deprecation/active signals
		const analysis = await analyzeDocumentContent(entity.id, edges);

		console.log(
			`  ${entity.id}: ${analysis.classification} (${analysis.reason})`,
		);

		classifications.push({
			entity: entity.id,
			connectedDocs: edges.length,
			avgConfidence,
			deprecationScore: analysis.deprecationScore,
			activeScore: analysis.activeScore,
			classification: analysis.classification,
			reason: analysis.reason,
			replacedBy: analysis.replacedBy,
		});

		processed++;
		if (processed % 100 === 0) {
			console.log(`    Processed ${processed}/${entities.length} entities...`);
		}
	}

	// Generate summary statistics
	const summary = {
		total: classifications.length,
		active: classifications.filter((c) => c.classification === "active").length,
		deprecated: classifications.filter((c) => c.classification === "deprecated")
			.length,
		historical: classifications.filter((c) => c.classification === "historical")
			.length,
	};

	console.log(`\n📊 Classification Results:`);
	console.log(
		`   Active: ${summary.active} (${((summary.active / summary.total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`   Deprecated: ${summary.deprecated} (${((summary.deprecated / summary.total) * 100).toFixed(1)}%)`,
	);
	console.log(
		`   Historical: ${summary.historical} (${((summary.historical / summary.total) * 100).toFixed(1)}%)`,
	);

	// Save classifications
	const outputPath = ".amalfa/lexicon-relevance-classifications.jsonl";
	const jsonlOutput = `${classifications
		.map((c) => JSON.stringify(c))
		.join("\n")}\n`;
	writeFileSync(outputPath, jsonlOutput);

	console.log(`\n✅ Classifications saved to: ${outputPath}`);

	// Update database with relevance flags
	console.log(`\nUpdating database with relevance metadata...`);
	const updateStmt = db.prepare(
		"UPDATE nodes SET meta = ? WHERE id = ? AND domain = 'lexicon'",
	);

	let updated = 0;
	for (const classification of classifications) {
		const meta = JSON.stringify({
			relevance: classification.classification,
			reason: classification.reason,
			deprecationScore: classification.deprecationScore,
			activeScore: classification.activeScore,
			lastAnalyzed: new Date().toISOString(),
			...(classification.replacedBy && {
				replacedBy: classification.replacedBy,
			}),
		});

		updateStmt.run(meta, classification.entity);
		updated++;
	}

	console.log(`   Updated ${updated} entities with relevance metadata`);

	// Show sample results
	console.log(`\n🔍 Sample Classifications:`);
	const samples = classifications
		.filter((c) => c.entity.length < 20)
		.slice(0, 10);
	for (const sample of samples) {
		console.log(
			`   ${sample.classification.padEnd(10)} | ${sample.entity.padEnd(25)} | ${sample.reason.substring(0, 40)}`,
		);
	}

	db.close();
	console.log(`\n🎉 Pipeline D complete! Lexicon relevance classified.`);
}

async function analyzeDocumentContent(
	_entityId: string,
	edges: any[],
): Promise<{
	deprecationScore: number;
	activeScore: number;
	classification: "active" | "deprecated" | "historical";
	reason: string;
	replacedBy?: string;
}> {
	let deprecationScore = 0;
	let activeScore = 0;
	let replacedBy: string | undefined;

	// Analyze each connected document
	for (const edge of edges) {
		const docTitle = (edge.doc_title || "").toLowerCase();
		const docId = edge.target.toLowerCase();

		// Deprecation signals
		if (docTitle.includes("deprecated") || docTitle.includes("obsolete"))
			deprecationScore += 2;
		if (docTitle.includes("replaced") || docTitle.includes("superseded"))
			deprecationScore += 2;
		if (docTitle.includes("issue") || docTitle.includes("problem"))
			deprecationScore += 1;
		if (docTitle.includes("remove") || docTitle.includes("cleanup"))
			deprecationScore += 1;
		if (docId.includes("archive") || docId.includes("legacy"))
			deprecationScore += 1;

		// Active signals
		if (docTitle.includes("2026")) activeScore += 1;
		if (docTitle.includes("current") || docTitle.includes("new"))
			activeScore += 1;
		if (docTitle.includes("implementation") || docTitle.includes("guide"))
			activeScore += 0.5;
		if (docId.includes("src-") || docId.includes("current")) activeScore += 0.5;

		// Replacement detection
		if (docTitle.includes("replaced by") || docTitle.includes("migrate to")) {
			// Could extract replacement from title, but for now just flag
			replacedBy = "detected_in_docs";
		}
	}

	// Weight by connection confidence
	const avgConfidence =
		edges.reduce((sum, e) => sum + e.confidence, 0) / edges.length;
	deprecationScore *= avgConfidence;
	activeScore *= avgConfidence;

	// Classification logic
	let classification: "active" | "deprecated" | "historical";
	let reason: string;

	if (deprecationScore > activeScore + 1) {
		classification = "deprecated";
		reason = `Connected to deprecation docs (score: ${deprecationScore.toFixed(2)})`;
	} else if (activeScore > deprecationScore + 0.5) {
		classification = "active";
		reason = `Connected to current docs (score: ${activeScore.toFixed(2)})`;
	} else {
		classification = "historical";
		reason = `Mixed signals (dep: ${deprecationScore.toFixed(2)}, active: ${activeScore.toFixed(2)})`;
	}

	return {
		deprecationScore,
		activeScore,
		classification,
		reason,
		replacedBy,
	};
}

classifyLexiconRelevance().catch(console.error);
