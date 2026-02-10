/**
 * Simple Tokenizer
 * Lightweight alternative without compromise dependency
 * Provides basic semantic token extraction
 */

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

export class SimpleTokenizerService {
  private static instance: SimpleTokenizerService;
  private vocabulary: Map<string, string> = new Map();
  private searchKeys: string[] = [];

  private constructor() {}

  public static getInstance(): SimpleTokenizerService {
    if (!SimpleTokenizerService.instance) {
      SimpleTokenizerService.instance = new SimpleTokenizerService();
    }
    return SimpleTokenizerService.instance;
  }

  /**
   * Extract semantic tokens without NLP library
   * Uses vocabulary matching only
   */
  public extract(text: string): SemanticTags {
    const result: SemanticTags = {
      people: [],
      places: [],
      organizations: [],
      topics: [],
      money: [],
      protocols: [],
      concepts: [],
    };

    const lowerText = text.toLowerCase();

    // Scan vocabulary
    for (const term of this.searchKeys) {
      if (lowerText.includes(term)) {
        // Confirm word boundary
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const boundaryRegex = new RegExp(`\\b${escaped}\\b`, "i");

        if (boundaryRegex.test(text)) {
          const tag = this.vocabulary.get(term);
          const match = boundaryRegex.exec(text);
          const realTerm = match ? match[0] : term;

          if (tag === "Protocol") {
            if (!result.protocols?.includes(realTerm))
              result.protocols?.push(realTerm);
          } else if (tag === "Concept") {
            if (!result.concepts?.includes(realTerm))
              result.concepts?.push(realTerm);
          } else if (tag === "Organization") {
            if (!result.organizations.includes(realTerm))
              result.organizations.push(realTerm);
          } else {
            // Default to concepts
            if (!result.concepts?.includes(realTerm))
              result.concepts?.push(realTerm);
          }
        }
      }
    }

    return result;
  }

  public loadLexicon(
    lexicon: { id: string; title: string; type?: string; category?: string }[],
  ) {
    this.vocabulary.clear();

    for (const item of lexicon) {
      let tag = "Concept";
      if (item.type === "operational-heuristic") tag = "Protocol";
      if (item.category === "Tool") tag = "Organization";

      // Add title
      if (item.title) {
        this.vocabulary.set(item.title.toLowerCase(), tag);
      }
      // Add ID
      if (item.id) {
        this.vocabulary.set(item.id.toLowerCase(), tag);
        // Handle hyphen variants
        if (item.id.includes("-")) {
          this.vocabulary.set(item.id.toLowerCase().replace(/-/g, " "), tag);
        }
      }
    }

    // Sort keys by length desc for greedy matching
    this.searchKeys = Array.from(this.vocabulary.keys()).sort(
      (a, b) => b.length - a.length,
    );
  }

  // Deprecated / No-Op
  public extend(
    _customWords: Record<string, string>,
    _customPatterns: Record<string, string>,
  ) {
    // No-op
  }
}
