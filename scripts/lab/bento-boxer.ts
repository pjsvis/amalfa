import { createHash } from "node:crypto";
import { marked } from "marked";

// CONFIG
const TARGET_FILE = "scratchpads/dummy-debrief.md";
const OUTPUT_FILE = "scratchpads/dummy-debrief-boxed.md";

console.log(`📦 BENTO BOXER: Transforming ${TARGET_FILE}...`);

// 1. Read Source
const file = Bun.file(TARGET_FILE);
const src = await file.text();

// 2. Lex (AST Analysis)
const tokens = marked.lexer(src);

// 3. Process & Annotate
let output = "";
let bentoCount = 0;

for (const token of tokens) {
	// Logic: Identify Split Points (H2)
	if (token.type === "heading" && token.depth === 2) {
		const title = token.text;
		// Generate deterministic ID
		const hash = createHash("md5").update(title).digest("hex").substring(0, 8);
		const bentoId = `bento-${hash}`;

		console.log(`   ✂️  Split found: "${title}" -> ${bentoId}`);

		// Inject Metadata (The Annotation)
		output += `\n<!-- bento-id: ${bentoId} -->\n`;
		output += `<!-- type: section -->\n`;

		bentoCount++;
	}

	// Append original content (using raw to preserve fidelity)
	output += token.raw;
}

// 4. Write Output
await Bun.write(OUTPUT_FILE, output);

console.log(`✅ Complete! Boxed ${bentoCount} sections.`);
console.log(`📄 Output: ${OUTPUT_FILE}`);
