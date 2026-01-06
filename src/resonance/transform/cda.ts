#!/usr/bin/env bun

/**
 * CDA/CL Transformation Pipeline
 *
 * Transforms raw CDA and Lexicon into enriched intermediate structure
 * with keyword extraction and candidate relationship generation.
 */

import { join } from "node:path";
import { SemanticMatcher } from "@src/core/SemanticMatcher";
import type {
	CandidateRelationship,
	EnrichedCdaDocument,
	EnrichedCdaEntry,
	EnrichedLexiconConcept,
	EnrichedLexiconDocument,
} from "@src/resonance/types/enriched-cda";
import settings from "@/polyvis.settings.json";

// Simple keyword extraction (can be enhanced later)
function extractKeywords(text: string): string[] {
	if (!text) return [];

	// Remove common words, extract significant terms
	const stopWords = new Set([
		"the",
		"a",
		"an",
		"and",
		"or",
		"but",
		"in",
		"on",
		"at",
		"to",
		"for",
		"of",
		"with",
		"by",
		"from",
		"as",
		"is",
		"are",
		"was",
		"were",
		"be",
		"been",
		"being",
		"have",
		"has",
		"had",
		"do",
		"does",
		"did",
		"will",
		"would",
		"should",
		"could",
		"may",
		"might",
		"must",
		"can",
		"this",
		"that",
		"these",
		"those",
		"it",
		"its",
	]);

	const words = text
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, " ")
		.split(/\s+/)
		.filter((w) => w.length > 3 && !stopWords.has(w));

	// Return unique keywords
	return [...new Set(words)];
}

// Match keywords to lexicon concepts
function matchKeywordsToConcepts(
	keywords: string[],
	concepts: EnrichedLexiconConcept[],
): CandidateRelationship[] {
	const relationships: CandidateRelationship[] = [];

	for (const keyword of keywords) {
		for (const concept of concepts) {
			// Check title match
			const titleMatch = concept.title.toLowerCase().includes(keyword);
			const aliasMatch = concept.aliases.some((alias) =>
				alias.toLowerCase().includes(keyword),
			);
			const keywordMatch = concept.extracted_keywords.includes(keyword);

			if (titleMatch || aliasMatch || keywordMatch) {
				// Calculate confidence based on match type
				let confidence = 0.5; // Base confidence for keyword match
				if (titleMatch) confidence = 0.85;
				if (aliasMatch) confidence = 0.75;

				relationships.push({
					type: "MENTIONS",
					target: concept.id,
					confidence,
					source: "keyword_match",
				});
			}
		}
	}

	// Deduplicate and keep highest confidence
	const deduped = new Map<string, CandidateRelationship>();
	for (const rel of relationships) {
		const existing = deduped.get(rel.target);
		if (!existing || rel.confidence > existing.confidence) {
			deduped.set(rel.target, rel);
		}
	}

	return Array.from(deduped.values());
}

// Parse explicit tags from CDA entries
function parseExplicitTags(
	tags: string[],
	concepts: EnrichedLexiconConcept[],
): CandidateRelationship[] {
	const relationships: CandidateRelationship[] = [];

	for (const tag of tags) {
		// Match pattern: [TYPE: Target]
		const match = tag.match(/\[([A-Z_]+):\s*([^\]]+)\]/);
		if (!match) continue;

		const typeStr = match[1];
		const targetStr = match[2];
		if (!typeStr || !targetStr) continue;

		const target = targetStr.trim().toLowerCase().replace(/\s+/g, "-");

		// Map tag types to relationship types
		const typeMap: Record<string, CandidateRelationship["type"]> = {
			SUBSTRATE_ISSUE: "ADDRESSES",
			IMPLEMENTS: "IMPLEMENTS",
			GUIDED_BY: "GUIDED_BY",
			RELATED_TO: "RELATED_TO",
			REQUIRES: "REQUIRES",
			ENABLES: "ENABLES",
		};

		const relType = typeMap[typeStr] || "RELATED_TO";

		// Try to find matching concept
		const concept = concepts.find(
			(c) =>
				c.id.includes(target) ||
				c.title.toLowerCase().replace(/\s+/g, "-") === target ||
				c.aliases.some((a) => a.toLowerCase().replace(/\s+/g, "-") === target),
		);

		if (concept) {
			relationships.push({
				type: relType,
				target: concept.id,
				confidence: 1.0, // Explicit tags have high confidence
				source: "explicit_tag",
			});
		} else {
			console.warn(
				`⚠️  Tag target not found in lexicon: ${targetStr} (from tag: ${tag})`,
			);
		}
	}

	return relationships;
}

async function main() {
	console.log("🔄 CDA/CL Transformation Pipeline");
	console.log("═".repeat(60));

	const root = process.cwd();

	// Load source files
	console.log("\n📂 Loading source files...");
	const lexiconPath = join(root, settings.paths.sources.persona.lexicon);
	const cdaPath = join(root, settings.paths.sources.persona.cda);

	const lexiconData = await Bun.file(lexiconPath).json();
	const cdaData = await Bun.file(cdaPath).json();

	// Transform Lexicon
	console.log("\n🧠 Transforming Lexicon...");
	const lexiconConcepts = (
		Array.isArray(lexiconData) ? lexiconData : lexiconData.concepts
	) as EnrichedLexiconConcept[];

	const enrichedConcepts: EnrichedLexiconConcept[] = lexiconConcepts.map(
		(c) => ({
			id: c.id,
			type: "concept",
			title: c.title,
			description: c.description || c.title,
			category: c.category || "uncategorized",
			extracted_keywords: extractKeywords(`${c.title} ${c.description || ""}`),
			aliases: c.aliases || [],
			meta: {
				type: c.type,
			},
		}),
	);

	const enrichedLexicon: EnrichedLexiconDocument = {
		version: "1.0.0",
		generated_at: new Date().toISOString(),
		source_file: lexiconPath,
		concepts: enrichedConcepts,
		stats: {
			total_concepts: enrichedConcepts.length,
			total_keywords_extracted: enrichedConcepts.reduce(
				(sum, c) => sum + c.extracted_keywords.length,
				0,
			),
		},
	};

	console.log(`   ✅ ${enrichedConcepts.length} concepts enriched`);
	console.log(
		`   ✅ ${enrichedLexicon.stats.total_keywords_extracted} keywords extracted`,
	);

	// Transform CDA
	console.log("\n📋 Transforming CDA...");
	const cdaEntries: EnrichedCdaEntry[] = [];

	// Initialize Semantic Matcher (mgrep wrapper)
	const semanticMatcher = new SemanticMatcher();
	console.log("   🤖 Initialized Semantic Matcher");
	let totalSemanticRels = 0;

	for (const section of cdaData.directives) {
		for (const entry of section.entries) {
			const keywords = extractKeywords(entry.definition || "");
			const explicitRels = parseExplicitTags(
				entry.tags || [],
				enrichedConcepts,
			);
			const keywordRels = matchKeywordsToConcepts(keywords, enrichedConcepts);

			// Semantic Search Soft Links
			const semanticRels: CandidateRelationship[] = [];

			// Only run if we have a meaty definition to search with
			if (entry.definition && entry.definition.length > 15) {
				try {
					// Search known documentation for semantic references
					const docsPath = join(process.cwd(), settings.paths.docs.public);

					const matches = await semanticMatcher.findCandidates(
						entry.definition,
						docsPath,
					);

					for (const match of matches) {
						// Logic: If mgrep returns a match in the lexicon file,
						// we need to identify WHICH concept that line belongs to.
						// Naive approach: Basic text proximity or line number mapping.
						// Better approach for MVP: Check if the matched content *contains* a concept title.

						const relatedConcept = enrichedConcepts.find((c) =>
							match.content.toLowerCase().includes(c.title.toLowerCase()),
						);

						if (relatedConcept) {
							// Avoid dupes from keywords
							if (!keywordRels.some((r) => r.target === relatedConcept.id)) {
								semanticRels.push({
									type: "RELATED_TO",
									target: relatedConcept.id,
									confidence: 0.65, // Lower than keyword, but significant
									source: "semantic_search",
								});
								totalSemanticRels++;
							}
						}
					}
				} catch (_e) {
					// Fail silently to normal flow
				}
			}

			const candidateRels = [...explicitRels, ...keywordRels, ...semanticRels];

			// Auto-validate high-confidence relationships
			const validatedRels = candidateRels
				.filter((rel) => rel.confidence >= 0.75) // High confidence threshold
				.map((rel) => ({
					type: rel.type,
					target: rel.target,
					source: rel.source,
					validated: true,
					validator:
						rel.source === "explicit_tag" ? "auto" : "confidence_threshold",
					validated_at: new Date().toISOString(),
				}));

			cdaEntries.push({
				id: entry.id,
				type: "directive",
				title: entry.term || entry.id,
				definition: entry.definition || "",
				section: section.section,
				explicit_tags: entry.tags || [],
				extracted_keywords: keywords,
				candidate_relationships: candidateRels,
				validated_relationships: validatedRels,
				meta: {},
			});
		}
	}

	const enrichedCda: EnrichedCdaDocument = {
		version: "1.0.0",
		generated_at: new Date().toISOString(),
		source_files: {
			cda: cdaPath,
			lexicon: lexiconPath,
		},
		entries: cdaEntries,
		stats: {
			total_entries: cdaEntries.length,
			entries_with_tags: cdaEntries.filter((e) => e.explicit_tags.length > 0)
				.length,
			total_explicit_tags: cdaEntries.reduce(
				(sum, e) => sum + e.explicit_tags.length,
				0,
			),
			total_keywords_extracted: cdaEntries.reduce(
				(sum, e) => sum + e.extracted_keywords.length,
				0,
			),
			total_candidate_relationships: cdaEntries.reduce(
				(sum, e) => sum + e.candidate_relationships.length,
				0,
			),
			total_validated_relationships: cdaEntries.reduce(
				(sum, e) => sum + e.validated_relationships.length,
				0,
			),
		},
	};

	console.log(`   ✅ ${cdaEntries.length} directives enriched`);
	console.log(
		`   ✅ ${enrichedCda.stats.total_keywords_extracted} keywords extracted`,
	);
	console.log(
		`   ✅ ${enrichedCda.stats.total_candidate_relationships} candidate relationships generated`,
	);
	console.log(
		`   ✅ ${enrichedCda.stats.total_validated_relationships} relationships validated`,
	);

	console.log(
		`   ✅ ${enrichedCda.stats.total_validated_relationships} relationships validated`,
	);
	console.log(
		`   ✨ ${totalSemanticRels} SWL (Semantic Soft Links) discovered`,
	);

	// Write output
	console.log("\n💾 Writing enriched artifacts...");
	const outputDir = join(root, ".resonance", "artifacts");
	await Bun.write(
		join(outputDir, "lexicon-enriched.json"),
		JSON.stringify(enrichedLexicon, null, 2),
	);
	await Bun.write(
		join(outputDir, "cda-enriched.json"),
		JSON.stringify(enrichedCda, null, 2),
	);

	console.log(`   ✅ Lexicon: .resonance/artifacts/lexicon-enriched.json`);
	console.log(`   ✅ CDA: .resonance/artifacts/cda-enriched.json`);

	console.log(`\n${"═".repeat(60)}`);
	console.log("✅ Transformation Complete");
}

main().catch(console.error);
