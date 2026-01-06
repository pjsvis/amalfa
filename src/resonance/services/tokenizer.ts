import nlp from "compromise";

export interface SemanticTags {
	people: string[];
	places: string[];
	organizations: string[];
	topics: string[];
	dates?: string[];
	money: string[];
	protocols?: string[];
	concepts?: string[];
}

export class TokenizerService {
	private static instance: TokenizerService;
	// Map of normalized_term -> tag inside class state
	private vocabulary: Map<string, string> = new Map();
	// Cache keys sorted by length (desc) for greedy matching
	private searchKeys: string[] = [];

	// Compromise instance (optional, keeping for 'people', 'places' currently)
	// Could eventually remove if we go 100% custom.

	private constructor() {}

	public static getInstance(): TokenizerService {
		if (!TokenizerService.instance) {
			TokenizerService.instance = new TokenizerService();
		}
		return TokenizerService.instance;
	}

	/**
	 * Extracts semantic entities.
	 * 1. Uses Compromise for generic Named Entity Recognition (NER)
	 * 2. Uses Custom "Zero Magic" Brute Force Scanner for Domain Vocabulary
	 */
	public extract(text: string): SemanticTags {
		const doc = nlp(text);

		// 1. Generic NLP (Keep for now as fallback/enrichment)
		const result: SemanticTags = {
			people: doc.people().out("array"),
			places: doc.places().out("array"),
			organizations: doc.organizations().out("array"),
			topics: doc.topics().out("array"),
			money: [],
			protocols: [],
			concepts: [],
		};

		// 2. Zero Magic Domain Scan (Brute Force)
		// Optimization: Check text.includes() only if vocabulary is small?
		// But for regex construction or Aho-Corasick, naive loop is fine for now on small text blocks (Bento boxes).

		const lowerText = text.toLowerCase();

		for (const term of this.searchKeys) {
			// Simple subset check.
			// Limitation: Matches "pro" in "process". Needs word boundary check.
			// RegExp construction is costly inside loop?
			// Better: Pre-build a massive Regex?
			// Or simpler: \bSTR\b with indexof?

			// Fast "includes" check first
			if (lowerText.includes(term)) {
				// Confirm Word Boundary to avoid partial matches
				// Regex is expensive, but safer for accuracy.
				// We construct regex only on 'hit' to save cycles?
				const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const boundaryRegex = new RegExp(`\\b${escaped}\\b`, "i");

				if (boundaryRegex.test(text)) {
					const tag = this.vocabulary.get(term);
					// Retrieve Canonical Form (Original Case) if needed?
					// For now, we normalize to the lowercase SEARCH key, but we might prefer the original.
					// Given the user wants "OH-058" format, let's try to map back if possible.
					// But we only stored 'tag' in the map.
					// Let's store Normalized -> Original ID in a separate map if required?
					// User Request: "no need to manage case" -> likely means "return standard ID".

					// Since we are returning the matched string (which is usually the ID in lowercase in our loop),
					// If we want UPPERCASE OH-058, we need to know it.
					// Simplest fix: Just return the term as found (lowercase) and EdgeWeaver will handle lookup.
					// EdgeWeaver expects slugified keys anyway.

					// Actually, let's return the TERM as it appears in the text?
					// boundaryRegex.match(text) would give us the real casing used in the doc (e.g. "OH-058").

					const match = boundaryRegex.exec(text);
					const realTerm = match ? match[0] : term;

					if (tag === "Protocol") {
						if (!result.protocols) result.protocols = [];
						if (!result.protocols.includes(realTerm))
							result.protocols.push(realTerm);
					} else if (tag === "Concept") {
						if (!result.concepts) result.concepts = [];
						if (!result.concepts.includes(realTerm))
							result.concepts.push(realTerm);
					} else if (tag === "Organization") {
						if (!result.organizations.includes(realTerm))
							result.organizations.push(realTerm);
					} else {
						// Default to Concept if tag is unknown or not explicitly handled
						if (!result.concepts) result.concepts = [];
						if (!result.concepts.includes(realTerm))
							result.concepts.push(realTerm);
					}
				}
			}
		}

		return result;
	}

	public loadLexicon(
		lexicon: { id: string; title: string; type?: string; category?: string }[],
	) {
		// Reset
		this.vocabulary.clear();

		for (const item of lexicon) {
			let tag = "Concept";
			if (item.type === "operational-heuristic") tag = "Protocol";
			if (item.category === "Tool") tag = "Organization";

			// Add Title
			if (item.title) {
				this.vocabulary.set(item.title.toLowerCase(), tag);
			}
			// Add ID
			if (item.id) {
				this.vocabulary.set(item.id.toLowerCase(), tag);
				// Handle Hyphen Variants
				if (item.id.includes("-")) {
					this.vocabulary.set(item.id.toLowerCase().replace(/-/g, " "), tag);
				}
			}
		}

		// Sort keys by length desc to ensure "Web Standards" matches before "Web"
		this.searchKeys = Array.from(this.vocabulary.keys()).sort(
			(a, b) => b.length - a.length,
		);

		console.log(
			`🧠 ZeroMagic Tokenizer learned ${this.vocabulary.size} terms from lexicon.`,
		);
	}

	// Deprecated / No-Op
	public extend(
		_customWords: Record<string, string>,
		_customPatterns: Record<string, string>,
	) {
		// No-op for brute force scanner
	}
}
