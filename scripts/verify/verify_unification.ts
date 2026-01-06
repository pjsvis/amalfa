import { VectorEngine } from "@src/core/VectorEngine";
import { ResonanceDB } from "@src/resonance/db";
import { Embedder } from "@src/resonance/services/embedder";

async function main() {
	console.log("🔍 Verifying Unification...");
	const db = ResonanceDB.init();

	// 1. Check Counts
	const counts = db
		.getRawDb()
		.query(`
        SELECT type, COUNT(*) as count, domain 
        FROM nodes 
        GROUP BY type, domain
    `)
		.all();

	console.table(counts);

	// 4. Check Aliases (using 'alias' rel)
	const aliases = db
		.getRawDb()
		.query("SELECT * FROM edges WHERE type = 'alias'")
		.all() as { source: string; target: string; type: string }[];
	console.log(`   Aliases Found: ${aliases.length}`);

	// 5. Check 'cites' edges (WikiLinks)
	const cites = db
		.getRawDb()
		.query("SELECT * FROM edges WHERE type = 'CITES'")
		.all() as { source: string; target: string; type: string }[];
	console.log(`   Citations Found: ${cites.length}`);
	if (cites.length > 0 && cites[0]) {
		console.log(`      Example: ${cites[0].source} -> ${cites[0].target}`);
	}

	// 2. Check AST Sections
	/* biome-ignore lint/suspicious/noExplicitAny: verification setup */
	const sectionStat = counts.find((c: any) => c.type === "section") as any;
	const sectionCount = sectionStat ? sectionStat.count : 0;
	if (sectionCount > 0) {
		console.log(`✅ AST Chunking Active: ${sectionCount} sections found.`);
	} else {
		console.error("❌ AST Chunking Failed: No sections found.");
	}

	// 3. Test Mixed Search
	console.log("\n🧪 Running Mixed Vector Search ('simplicity')...");
	const embedder = Embedder.getInstance();
	const vec = await embedder.embed("simplicity and complexity"); // Search for known concept

	const ve = new VectorEngine(db.getRawDb());
	const results = await ve.searchByVector(vec, 10);

	console.log("   Top 10 Matches:");
	results.forEach((r) => {
		// Fetch type for display
		const node = db
			.getRawDb()
			.query("SELECT type, domain FROM nodes WHERE id = ?")
			.get(r.id) as { type: string; domain: string };
		console.log(
			`   - [${node.domain}/${node.type}] ${r.title} (${r.score.toFixed(3)})`,
		);
	});

	// Check if we have mixed domains
	const domains = new Set(
		results.map((r: { id: string }) => {
			const node = db
				.getRawDb()
				.query("SELECT domain FROM nodes WHERE id = ?")
				.get(r.id) as { domain: string };
			return node.domain;
		}),
	);

	if (domains.has("persona") && domains.has("resonance")) {
		console.log(
			"\n✅ SUCCESS: Search returns both Lexicon (Persona) and Experience (Resonance).",
		);
	} else {
		console.warn(
			"\n⚠️ WARNING: Search did not return mixed domains. (Might be expected if query is too specific to one)",
		);
	}

	db.close();
}

main().catch(console.error);
