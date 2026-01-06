/**
 * Fracture Logic: The Cleaver
 * Contains regex patterns and scoring logic for splitting text.
 */

// 1. Priority A: Structural Pivot
// "However,", "Therefore,", etc. at the start of a sentence or line.
export const REGEX_PIVOT =
	/(?:^|\s)(?:However|Therefore|Nevertheless|Furthermore|Consequently|Thus|Hence)(?:,)/gi;

// 2. Priority B: Enumeration
// Numbered lists (1.), Lettered lists (a)), or bullet points (-, *)
export const REGEX_ENUMERATION = /(?:^|\n)(?:\d+\.|[a-z]\)|[-*])\s/g;

// 3. Priority C: Digression
// Notes, Edits, Updates
export const REGEX_DIGRESSION = /\((?:Note|Edit|Update):/gi;

// 4. Fallback: Sentence Boundary
// Standard period, question mark, exclamation point.
// We allow standard sentence ending punctuation.
export const REGEX_SENTENCE_BOUNDARY = /[.!?](?:\s|$)/g;
