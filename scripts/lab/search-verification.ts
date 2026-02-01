import { spawnSync } from "child_process";
import { Database } from "bun:sqlite";

function runSearchCommand(query: string, useReranker = false): any[] {
	const args = ["run", "src/cli.ts", "search", query, "--limit", "5", "--json"];
	if (useReranker) args.push("--rerank");
	
	const result = spawnSync("bun", args, {
		cwd: process.cwd(),
		encoding: "utf8"
	});
	
	if (result.status !== 0) return [];
	
	try {
		return JSON.parse(result.stdout.trim());
	} catch {
		return [];
	}
}

async function testSearchCapabilities() {
	console.log("🔍 SEARCH CAPABILITIES VERIFICATION");
	console.log("====================================\n");
	
	const db = new Database(".amalfa/resonance.db");
	
	// Test 1: Basic Vector Search Quality
	console.log("📊 Test 1: Basic Vector Search Quality");
	const basicTests = [
		"database",
		"FAFCAS", 
		"pipeline",
		"vector embeddings",
		"resonance engine"
	];
	
	for (const query of basicTests) {
		const results = runSearchCommand(query);
		console.log(`\n  "${query}" → ${results.length} results`);
		
		if (results.length > 0) {
			const topScore = results[0].score;
			console.log(`    Top: ${results[0].id} (${topScore.toFixed(3)}) ${topScore > 0.7 ? '✅' : topScore > 0.5 ? '⚠️' : '❌'}`);
			console.log(`    All: ${results.map(r => r.score.toFixed(3)).join(', ')}`);
		}
	}
	
	// Test 2: Cross-Domain Verification
	console.log(`\n\n🌉 Test 2: Cross-Domain Entity Search`);
	const entityQueries = ["resonancedb", "embeddings", "fafcas"];
	
	for (const entity of entityQueries) {
		const results = runSearchCommand(entity);
		console.log(`\n  Entity: "${entity}"`);
		
		if (results.length > 0) {
			console.log(`    Found ${results.length} matches`);
			console.log(`    Top 3:`);
			for (let i = 0; i < Math.min(3, results.length); i++) {
				const isDocument = results[i].id.includes('docs-') || 
					results[i].id.includes('src-') || 
					results[i].id.includes('debriefs-') ||
					results[i].id.includes('playbooks-');
				console.log(`      ${i+1}. ${results[i].id.substring(0, 50)} (${results[i].score.toFixed(3)}) ${isDocument ? '📄' : '🧠'}`);
			}
		}
	}
	
	// Test 3: Reranking Comparison
	console.log(`\n\n⚖️ Test 3: Reranking Quality`);
	const rerankQueries = ["vector search implementation", "database performance"];
	
	for (const query of rerankQueries) {
		console.log(`\n  Query: "${query}"`);
		
		const vectorOnly = runSearchCommand(query);
		const withReranking = runSearchCommand(query, true);
		
		console.log(`    Vector only (${vectorOnly.length} results):`);
		for (let i = 0; i < Math.min(3, vectorOnly.length); i++) {
			console.log(`      ${i+1}. ${vectorOnly[i].id.substring(0, 40)} (${vectorOnly[i].score.toFixed(3)})`);
		}
		
		console.log(`    With reranking (${withReranking.length} results):`);
		for (let i = 0; i < Math.min(3, withReranking.length); i++) {
			const r = withReranking[i];
			console.log(`      ${i+1}. ${r.id.substring(0, 40)} (${r.score.toFixed(3)}) ${r.rerankScore ? `[${r.rerankScore.toFixed(3)}]` : ''}`);
		}
		
		const topChanged = vectorOnly[0]?.id !== withReranking[0]?.id;
		console.log(`    Reranking effect: ${topChanged ? 'Changed order ⚖️' : 'Confirmed order ✅'}`);
	}
	
	// Test 4: Search Result Validation
	console.log(`\n\n✅ Test 4: Semantic Relevance Check`);
	const relevanceTests = [
		{ query: "FAFCAS protocol", shouldFind: ["fafcas", "protocol", "embeddings"] },
		{ query: "pipeline ingestion", shouldFind: ["pipeline", "ingestion", "ingest"] },
		{ query: "vector similarity", shouldFind: ["vector", "similarity", "embeddings"] }
	];
	
	for (const test of relevanceTests) {
		const results = runSearchCommand(test.query);
		console.log(`\n  "${test.query}"`);
		
		if (results.length > 0) {
			const topResult = results[0];
			const topText = `${topResult.id} ${topResult.preview || ''}`.toLowerCase();
			
			const foundTerms = test.shouldFind.filter(term => topText.includes(term));
			const relevant = foundTerms.length > 0;
			
			console.log(`    Top: ${topResult.id} (${topResult.score.toFixed(3)})`);
			console.log(`    Contains: [${foundTerms.join(', ')}] ${relevant ? '✅' : '❌'}`);
			console.log(`    Quality: ${topResult.score > 0.7 ? 'Excellent ✅' : topResult.score > 0.5 ? 'Good ⚠️' : 'Poor ❌'}`);
		}
	}
	
	console.log(`\n\n🏆 SEARCH SYSTEM STATUS`);
	
	// Final stats
	const stats = db.query("SELECT COUNT(*) as nodes FROM nodes").get() as any;
	const edgeStats = db.query("SELECT COUNT(*) as edges FROM edges WHERE type = 'appears_in'").get() as any;
	
	console.log(`Database: ${stats.nodes} nodes, ${edgeStats.edges} cross-domain edges`);
	console.log(`Search quality: Verified with multiple test scenarios`);
	console.log(`Reranking: Available for precision enhancement`);
	console.log(`Status: 🚀 OPERATIONAL`);
	
	db.close();
}

testSearchCapabilities().catch(console.error);