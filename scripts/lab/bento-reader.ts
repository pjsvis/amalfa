import { marked } from "marked";

// CONFIG
const INPUT_FILE = "scratchpads/dummy-debrief-boxed.md";

console.log(`📚 BENTO READER: Ingesting ${INPUT_FILE}...`);

// 1. Read
const file = Bun.file(INPUT_FILE);
const src = await file.text();
const tokens = marked.lexer(src);

// 2. Parse State Machine
let currentBentoId: string | null = null;
let buffer = "";
let count = 0;

function flush() {
	if (currentBentoId && buffer.trim().length > 0) {
		console.log(`
💾 [BOX DETECTED] ID: ${currentBentoId}`);
		console.log(`   Length: ${buffer.length} chars`);
		console.log(
			`   Preview: ${buffer.trim().substring(0, 50).replace(/\n/g, " ")}...`,
		);
		count++;
	}
}

// 3. Loop
for (const token of tokens) {
	// Check for Annotation
	if (token.type === "html") {
		const match = token.text.match(/<!-- bento-id: (.*?) -->/);
		if (match) {
			// Flush previous
			flush();

			// Start new
			currentBentoId = match[1];
			buffer = "";
			continue; // Don't add the ID tag to the content
		}

		// Ignore type tags for content buffer
		if (token.text.includes("<!-- type:")) continue;
	}

	// Accumulate Content
	if (currentBentoId) {
		buffer += token.raw;
	}
}

// Flush last
flush();

console.log(`
✅ Ingestion Complete. Extracted ${count} Bento Boxes.`);
