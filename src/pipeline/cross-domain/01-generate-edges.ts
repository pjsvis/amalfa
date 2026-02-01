/**
 * Cross-Domain Edge Generation Pipeline
 *
 * Creates edges between knowledge (document) nodes and lexicon (entity) nodes
 * using vector similarity with top-K selection.
 */

import { Database } from "bun:sqlite";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { getDbPath } from "@src/cli/utils";

// OUTPUT_PATH will be computed from getDbPath() directory
const TOP_K = 5; // Number of top matches per lexicon node

interface NodeData {
	id: string;
	title: string | null;
	embedding: Float32Array;
	norm: number; // Precomputed vector norm for cosine similarity
}

interface EdgeCandidate {
	source: string; // lexicon node
	target: string; // document node
	type: string;
	confidence: number;
	method: string;
}

/**
 * Cosine Similarity with Precomputed Norms
 * Handles unnormalized vectors by dividing by product of norms
 */
function cosineSimilarity(
	a: Float32Array,
	b: Float32Array,
	normA: number,
	normB: number,
): number {
	let dotProduct = 0;
	for (let i = 0; i < a.length; i++) {
		dotProduct += a[i] * b[i];
	}
	return dotProduct / (normA * normB);
}

async function generateCrossDomainEdges() {
	console.log("🌉 Cross-Domain Edge Generation Pipeline\n");

	const dbPath = await getDbPath();
	const outputPath = join(dbPath, "..", "cross-domain-edges.jsonl");
	const db = new Database(dbPath);

	// Load lexicon nodes
	console.log("Loading lexicon nodes...");
	const lexiconQuery = db.query(
		"SELECT id, title, embedding FROM nodes WHERE domain = 'lexicon' AND embedding IS NOT NULL",
	);
	const lexiconRows = lexiconQuery.all() as any[];

	const lexiconNodes: NodeData[] = lexiconRows
		.filter((row): row is any => row.id && row.embedding)
		.map((row) => {
			const embedding = new Float32Array(
				row.embedding.buffer,
				row.embedding.byteOffset,
				row.embedding.byteLength / 4,
			);
			let norm = 0;
			for (let i = 0; i < embedding.length; i++) {
				norm += embedding[i] * embedding[i];
			}
			return {
				id: row.id,
				title: row.title,
				embedding,
				norm: Math.sqrt(norm),
			};
		});

	console.log(`  Loaded ${lexiconNodes.length} lexicon nodes`);

	// Load document nodes
	console.log("Loading document nodes...");
	const docQuery = db.query(
		"SELECT id, title, embedding FROM nodes WHERE domain = 'knowledge' AND embedding IS NOT NULL",
	);
	const docRows = docQuery.all() as any[];

	const documentNodes: NodeData[] = docRows
		.filter((row): row is any => row.id && row.embedding)
		.map((row) => {
			const embedding = new Float32Array(
				row.embedding.buffer,
				row.embedding.byteOffset,
				row.embedding.byteLength / 4,
			);
			let norm = 0;
			for (let i = 0; i < embedding.length; i++) {
				norm += embedding[i] * embedding[i];
			}
			return {
				id: row.id,
				title: row.title,
				embedding,
				norm: Math.sqrt(norm),
			};
		});

	console.log(`  Loaded ${documentNodes.length} document nodes\n`);

	// Generate edges
	console.log("Generating edge candidates (top-K vector similarity)...");
	const edges: EdgeCandidate[] = [];
	let processed = 0;

	for (const lexNode of lexiconNodes) {
		// Calculate similarity to all documents
		const similarities = documentNodes.map((docNode) => ({
			docId: docNode.id,
			score: cosineSimilarity(
				lexNode.embedding,
				docNode.embedding,
				lexNode.norm,
				docNode.norm,
			),
		}));

		// Sort by similarity (descending)
		similarities.sort((a, b) => b.score - a.score);

		// Take top-K
		const topMatches = similarities.slice(0, TOP_K);

		// Create edges
		for (const match of topMatches) {
			edges.push({
				source: lexNode.id,
				target: match.docId,
				type: "appears_in",
				confidence: match.score,
				method: "vector_similarity_topk",
			});
		}

		processed++;
		if (processed % 100 === 0) {
			console.log(
				`  Processed ${processed}/${lexiconNodes.length} lexicon nodes...`,
			);
		}
	}

	console.log(`\n✅ Generated ${edges.length} edge candidates`);
	console.log(
		`   (${lexiconNodes.length} lexicon nodes × ${TOP_K} top matches)`,
	);

	// Save to JSONL
	console.log(`\nSaving to ${outputPath}...`);
	const jsonlLines = edges.map((e) => JSON.stringify(e)).join("\n");
	writeFileSync(outputPath, `${jsonlLines}\n`);

	// Statistics
	const avgConfidence =
		edges.reduce((sum, e) => sum + e.confidence, 0) / edges.length;
	const highConfidenceEdges = edges.filter((e) => e.confidence > 0.8).length;

	console.log("\n📊 Edge Statistics:");
	console.log(`   Total edges: ${edges.length}`);
	console.log(`   Avg confidence: ${avgConfidence.toFixed(3)}`);
	console.log(
		`   High confidence (>0.8): ${highConfidenceEdges} (${((highConfidenceEdges / edges.length) * 100).toFixed(1)}%)`,
	);

	db.close();
	console.log("\n🎉 Pipeline complete!");
	console.log(`   Output: ${outputPath}`);
	console.log(
		"\nNext step: Review edges and run 02-ingest.ts to add to database",
	);
}

generateCrossDomainEdges().catch(console.error);
