/**
 * Intermediate Structure for Enriched CDA/CL
 *
 * This schema defines the transformation output before database ingestion.
 * Supports both hard links (explicit tags) and soft links (keyword matching).
 */

export interface CandidateRelationship {
	type:
		| "IMPLEMENTS"
		| "GUIDED_BY"
		| "RELATED_TO"
		| "MENTIONS"
		| "ADDRESSES"
		| "REQUIRES"
		| "ENABLES";
	target: string; // Concept ID (e.g., "term-context-preservation")
	confidence: number; // 0.0 - 1.0
	source:
		| "explicit_tag"
		| "keyword_match"
		| "semantic_similarity"
		| "semantic_search";
}

export interface ValidatedRelationship {
	type: CandidateRelationship["type"];
	target: string;
	source: CandidateRelationship["source"];
	validated: boolean;
	validator?: string; // Who validated (human or auto)
	validated_at?: string; // ISO timestamp
}

export interface EnrichedCdaEntry {
	id: string;
	type: "directive" | "concept";
	title: string;
	definition: string;
	section?: string; // CDA section (e.g., "PHI: Processing Philosophy")

	// Original tags from CDA
	explicit_tags: string[];

	// Extracted during transformation
	extracted_keywords: string[];

	// Generated candidate relationships
	candidate_relationships: CandidateRelationship[];

	// Validated relationships (ready for ingestion)
	validated_relationships: ValidatedRelationship[];

	// Metadata
	meta?: {
		category?: string;
		aliases?: string[];
		[key: string]: unknown;
	};
}

export interface EnrichedCdaDocument {
	version: string;
	generated_at: string;
	source_files: {
		cda: string;
		lexicon: string;
	};
	entries: EnrichedCdaEntry[];
	stats: {
		total_entries: number;
		entries_with_tags: number;
		total_explicit_tags: number;
		total_keywords_extracted: number;
		total_candidate_relationships: number;
		total_validated_relationships: number;
	};
}

/**
 * Enriched Lexicon Concept
 * (Lexicon concepts are simpler, mostly just need keywords)
 */
export interface EnrichedLexiconConcept {
	id: string;
	type: "concept";
	title: string;
	description: string;
	category: string;

	// Extracted keywords for matching
	extracted_keywords: string[];

	// Aliases for fuzzy matching
	aliases: string[];

	// Metadata
	meta?: {
		[key: string]: unknown;
	};
}

export interface EnrichedLexiconDocument {
	version: string;
	generated_at: string;
	source_file: string;
	concepts: EnrichedLexiconConcept[];
	stats: {
		total_concepts: number;
		total_keywords_extracted: number;
	};
}
