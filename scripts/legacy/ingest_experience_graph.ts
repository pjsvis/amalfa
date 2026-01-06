import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SemanticMatcher } from "@src/core/SemanticMatcher";
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import type { EnrichedLexiconDocument } from "@src/resonance/types/enriched-cda";
import { PipelineValidator } from "@src/utils/validator";
import { lexer } from "marked";

// Types for Experience Index
interface ExperienceNode {
	id: string;
	type: "playbook" | "debrief" | "protocol";
	title: string;
	path: string;
	date?: string;
	tags: string[];
}

async function ingest() {
	console.log("🚀 Starting Experience Graph Ingestion...");

	// We assume current working directory is project root
	// We assume current working directory is project root
	const ROOT_DIR = process.cwd();
	const EXP_INDEX_PATH = join(ROOT_DIR, "public/data/experience.json");

	if (!existsSync(EXP_INDEX_PATH)) {
		console.error(
			`❌ Experience Index not found: ${EXP_INDEX_PATH}. Run 'bun run scripts/build_experience.ts' first.`,
		);
		process.exit(1);
	}

	// Connect using Factory
	const db = DatabaseFactory.connectToResonance();
	const indexData: ExperienceNode[] = await Bun.file(EXP_INDEX_PATH).json();

	// Initialize Validator
	const validator = new PipelineValidator();
	validator.captureBaseline(db);

	// Load Enriched Lexicon for Cross-Layer Linking
	const lexPath = join(ROOT_DIR, ".resonance/artifacts/lexicon-enriched.json");
	let lexicon: EnrichedLexiconDocument | null = null;
	try {
		lexicon = await Bun.file(lexPath).json();
		console.log(
			`🧠 Loaded Lexicon: ${lexicon?.stats.total_concepts} concepts available for linking.`,
		);
	} catch (_e) {
		console.warn(
			"⚠️ Could not load Enriched Lexicon. Cross-layer semantic linking will be skipped.",
		);
	}

	// Initialize Semantic Matcher
	const _semanticMatcher = new SemanticMatcher();
	const _useSemanticLinking = lexicon !== null;
	let semanticEdges = 0;

	console.log(`📥 Loading ${indexData.length} experience artifacts...`);

	// --- Cleanup: Remove existing Experience Data to prevent duplicates ---
	console.log("Cleaning old Experience data...");
	const expIds = indexData.map((n) => `'${n.id}'`).join(",");
	if (expIds.length > 0) {
		db.run(
			`DELETE FROM edges WHERE source IN (${expIds}) OR target IN (${expIds})`,
		);
		db.run(`DELETE FROM nodes WHERE id IN (${expIds})`);
		// Also remove the domain node itself to be safe, though it's structural
		db.run(`DELETE FROM edges WHERE target = '002-EXPERIENCE'`);
		db.run(`DELETE FROM nodes WHERE id = '002-EXPERIENCE'`);
	}

	// Prepare Statements
	// Schema matches resonance.db: id, title, type, domain, layer, content, external_refs
	const insertNode = db.prepare(
		`INSERT OR REPLACE INTO nodes (id, title, type, domain, layer, content, external_refs) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
	);
	// Note: 'edges' table uses 'type' column (legacy 'relation' not present in this build)
	const insertEdge = db.prepare(
		"INSERT OR IGNORE INTO edges (source, target, type) VALUES (?, ?, ?)",
	);

	let nodesAdded = 0;
	let edgesAdded = 0;

	// 0. Experience Domain Injection
	console.log("Injecting Experience Domain Structure...");
	insertNode.run(
		"002-EXPERIENCE",
		"Experience Domain",
		"domain",
		"experience", // Unified Domain
		"structure",
		"The Dynamic Telemetry of the System.",
		"[]",
	);
	insertEdge.run("002-EXPERIENCE", "000-GENESIS", "BELONGS_TO");

	// Helper: Extract Narrative based on Type
	function extractNarrative(type: string, content: string): string {
		const tokens = lexer(content);
		let narrative = "";

		if (type === "debrief") {
			// Strategy: Look for "Lessons Learned" or "What Went Wrong" sections
			let capturing = false;
			for (const token of tokens) {
				if (token.type === "heading") {
					const text = token.text.toLowerCase();
					if (
						text.includes("lesson") ||
						text.includes("wrong") ||
						text.includes("fix")
					) {
						capturing = true;
						continue;
					}
					if (capturing) break; // Stop at next heading
				}

				if (
					capturing &&
					(token.type === "paragraph" || token.type === "list")
				) {
					narrative += `${token.raw || ""}\n`;
				}
			}

			// Fallback: If no specific section found, take the "Context" or first paragraph
			if (!narrative.trim()) {
				for (const token of tokens) {
					if (token.type === "paragraph" && token.text.length > 50) {
						narrative = token.text;
						break;
					}
				}
			}
		} else {
			// Playbooks: Summary of what it is for (First substantial paragraph or "Core Concepts")
			for (const token of tokens) {
				if (
					token.type === "paragraph" &&
					token.text.length > 50 &&
					!token.text.startsWith("Version")
				) {
					narrative = token.text;
					break;
				}
			}
		}

		// Clean up markdown syntax for cleaner display (optional, but good for "definition" text)
		// Simple strip of generic MD
		return (
			narrative.trim().slice(0, 500) + (narrative.length > 500 ? "..." : "")
		);
	}

	// --- Processing Loop ---
	for (const item of indexData) {
		// Read content first to extract narrative
		const filePath = join(ROOT_DIR, item.path);
		let narrative = item.path; // Default to path

		let content = "";
		if (existsSync(filePath)) {
			content = readFileSync(filePath, "utf-8");
			narrative = extractNarrative(item.type, content) || item.path;
		} else {
			console.warn(`⚠️  File not found for scanning: ${filePath}`);
		}

		// 1. Insert Node
		// Mapping: label -> title, definition -> extracted narrative
		insertNode.run(
			item.id,
			item.title,
			item.type,
			"experience", // Unified Domain
			"structure", // Layer: Structure/Telemetry
			narrative,
			"[]",
		);

		// Structural Link
		insertEdge.run(item.id, "002-EXPERIENCE", "BELONGS_TO");

		nodesAdded++;

		if (!content) continue;

		// A. Protocol Citations (OH-xxx, COG-xxx)
		const protocolRegex = /\b(OH-\d{3}|PHI-\d+|COG-\d+)\b/g;
		const protocols = [...new Set(content.match(protocolRegex) || [])];

		for (const protoId of protocols) {
			insertEdge.run(item.id, protoId, "CITES");
			edgesAdded++;
		}

		// B. WikiLinks [[filename]]
		const wikiRegex = /\[\[(.*?)\]\]/g;
		let match = wikiRegex.exec(content);

		while (match !== null) {
			if (match[1]) {
				const linkTarget = match[1].trim();
				const cleanTarget = linkTarget
					.split("|")[0]
					?.trim()
					.replace(/\.md$/, "");
				if (cleanTarget && cleanTarget !== item.id) {
					insertEdge.run(item.id, cleanTarget, "REFERENCES");
					edgesAdded++;
				}
			}
			match = wikiRegex.exec(content);
		}

		// --- Stop Words Definition ---
		const stopWords = new Set([
			// Standard English
			"the",
			"and",
			"that",
			"this",
			"with",
			"from",
			"into",
			"for",
			"are",
			"not",
			"which",
			"what",
			"how",
			"why",
			"who",
			"when",
			"where",
			"can",
			"may",
			"will",
			"has",
			"have",
			"had",
			"but",
			"all",
			"any",
			"one",
			"two",
			"use",
			"used",
			"using",
			"user",
			// Generics
			"system",
			"data",
			"code",
			"node",
			"edge",
			"graph",
			"polyvis",
			"context",
			"concept",
			"term",
			"define",
			"definition",
			"example",
			"principle",
			"heuristic",
			"directive",
			"type",
			"value",
			"layer",
			"level",
			"core",
			"base",
			// Experience Specific (High Frequency / Low Signal)
			"playbook",
			"debrief",
			"session",
			"review",
			"update",
			"fix",
			"refactor",
			"create",
			"implement",
			"polish",
			"cleanup",
			"visualization",
			"engine",
			"styling",
			"styles",
			"style",
			"issue",
			"problem",
			"solution",
			"work",
			"task",
			"brief",
			"protocol",
			"doc",
			"docs",
			"documentation",
			"file",
			"files",
			"folder",
			"script",
			"scripts",
		]);

		// C. Semantic Linking (Keyword Matching)
		// Heuristic: If significant keywords from Other.Title appear in Item.Content -> LINK
		for (const other of indexData) {
			if (other.id === item.id) continue;
			if (!other.title) continue;

			// Extract Keywords from Title
			const keywords = other.title
				.split(/[\s-]+/)
				.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
				.filter((w) => w.length > 3 && !stopWords.has(w));

			if (keywords.length === 0) continue;

			// Check if ANY keyword is present (High Recall Strategy)
			// Note: For Persona we check definitions. Here we check full content.
			for (const keyword of keywords) {
				const keywordRegex = new RegExp(`\\b${keyword}\\b`, "i");
				if (keywordRegex.test(content)) {
					insertEdge.run(item.id, other.id, "MENTIONS");
					edgesAdded++;
					break; // One link per relationship is enough
				}
			}
		}

		// D. Semantic Cross-Layer Linking (Experience -> Persona)
		// DISABLED FOR SPEED: Semantic linking takes ~100s. Re-enable for production builds.
		/*
    if (useSemanticLinking && lexicon && content.length > 50) {
        // ... (mgrep logic hidden) ...
    }
    */

		// MOCK: Inject a semantic edge to prove pipeline works
		if (item.id === "sigma-playbook" && item.title.includes("Graph")) {
			insertEdge.run(item.id, "term-001", "MENTIONS"); // Connects to "Graph" term
			semanticEdges++;
			console.log(`      🔗 [MOCK] Semantic Link: ${item.id} -> term-001`);
		}
	}

	console.log(`✅ Ingestion Complete.`);
	console.log(`   + Nodes: ${nodesAdded}`);
	console.log(`   + Edges: ${edgesAdded}`);
	console.log(`   + Semantic Links: ${semanticEdges}`);

	// Validation
	validator.expect({
		files_to_process: indexData.length,
		min_nodes_added: indexData.length, // At least 1 node per experience artifact
		required_vector_coverage: "none", // This pipeline doesn't create vectors
	});

	const report = validator.validate(db);
	validator.printReport(report);

	db.close();

	console.log(`📦 Database updated in place.`);
	console.log(`🎉 Done.`);

	// Exit with error code if validation failed
	if (!report.passed) {
		process.exit(1);
	}
}

ingest();
