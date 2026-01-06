import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { marked, type Token } from "marked";

// CONFIG
const TARGET_DIR = "scratchpads/debriefs";
const WORD_THRESHOLD = 40; // Minimum words to graduate an H3 to a Box

console.log(
	`🏭 BENTO PROCESSOR: Batch processing ${TARGET_DIR} (H2 + Large H3s)...`,
);

// Helper: Measure the content size of a section
function measureSection(
	tokens: Token[],
	startIndex: number,
	depth: number,
): number {
	let wordCount = 0;
	for (let i = startIndex + 1; i < tokens.length; i++) {
		const t = tokens[i];
		if (!t) continue;

		// Stop if we hit a header of same or higher level
		if (t.type === "heading" && t.depth <= depth) {
			break;
		}
		// Count words in text-bearing tokens
		if ("text" in t) {
			wordCount += (t.text || "").split(/\s+/).length;
		}
	}
	return wordCount;
}

async function processFile(filePath: string) {
	console.log(`
📄 Processing: ${filePath}`);

	// 1. Read
	const file = Bun.file(filePath);
	const src = await file.text();

	// 2. Lex (AST Analysis)
	const tokens = marked.lexer(src);

	// 3. Process
	let output = "";
	let bentoCount = 0;
	let currentH2 = { id: "", title: "" };

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (!token) continue;

		// H2 Logic (The Container)
		if (token.type === "heading" && token.depth === 2) {
			const title = token.text;
			const hash = createHash("md5")
				.update(title)
				.digest("hex")
				.substring(0, 8);
			const bentoId = `bento-${hash}`;

			// Update Context
			currentH2 = { id: bentoId, title };

			output += `
<!-- bento-id: ${bentoId} -->
`;
			output += `<!-- type: section -->
`;

			bentoCount++;
			console.log(`   + [H2] ${title}`);
		}

		// H3 Logic (The Potential Atom)
		else if (token.type === "heading" && token.depth === 3) {
			const size = measureSection(tokens, i, 3);

			if (size >= WORD_THRESHOLD) {
				const title = token.text;
				const hash = createHash("md5")
					.update(title)
					.digest("hex")
					.substring(0, 8);
				const bentoId = `bento-${hash}`;

				output += `
<!-- bento-id: ${bentoId} -->
`;
				output += `<!-- type: subsection -->
`;
				// Matryoshka Link
				if (currentH2.id) {
					output += `<!-- parent-id: ${currentH2.id} -->
`;
				}

				bentoCount++;
				console.log(`     - [H3] ${title} (${size} words)`);
			} else {
				// Too small, treated as part of H2
				// console.log(`     . (skipped small H3: ${token.text}, ${size} words)`);
			}
		}

		// Append original content
		output += token.raw;
	}

	// 4. Write
	await Bun.write(filePath, output);
	return bentoCount;
}

// Main Loop
async function main() {
	try {
		const files = await readdir(TARGET_DIR);
		const mdFiles = files.filter((f) => f.endsWith(".md"));

		console.log(`Found ${mdFiles.length} markdown files.`);

		let totalBoxes = 0;

		for (const filename of mdFiles) {
			const count = await processFile(join(TARGET_DIR, filename));
			totalBoxes += count;
		}

		console.log(`
✅ BATCH COMPLETE.`);
		console.log(`   Processed: ${mdFiles.length} files`);
		console.log(`   Generated: ${totalBoxes} bento boxes`);
	} catch (e) {
		console.error("❌ Error:", e);
	}
}

main();
