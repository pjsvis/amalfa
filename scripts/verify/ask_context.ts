import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";

async function main() {
	const query = Bun.argv[2];
	if (!query) {
		console.error(
			"Please provide a query: bun run scripts/verify/ask_context.ts 'How do I X?'",
		);
		process.exit(1);
	}

	console.log(`🔍 Asking Context: "${query}"`);

	const db = ResonanceDB.init();
	const embedder = Embedder.getInstance();

	const vector = await embedder.embed(query);
	if (!vector) {
		console.error("❌ Failed to embed query.");
		process.exit(1);
	}

	// Use VectorEngine
	const ve = new VectorEngine(db.getRawDb());
	const results = await ve.searchByVector(vector, 5); // Domain filtering temporarily removed

	console.log(`\nFound ${results.length} matches:`);
	results.forEach(
		(r: { id: string; score: number; label?: string }, i: number) => {
			console.log(
				`   ${i + 1}. [${r.id}] (${r.score.toFixed(4)}) - ${r.label}`,
			);
		},
	);

	if (results.length === 0) {
		console.log("   (No matches found in 'experience' domain)");
	}
}

main();
