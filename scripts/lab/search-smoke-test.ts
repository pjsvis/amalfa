/**
 * Search Capabilities Smoke Test Suite
 */

import { spawnSync } from "child_process";

interface TestCase {
	query: string;
	expectedMinScore: number;
	expectedTerms: string[];
	description: string;
}

const searchTests: TestCase[] = [
	{
		query: "FAFCAS protocol",
		expectedMinScore: 0.7,
		expectedTerms: ["fafcas", "protocol", "vector", "embedding"],
		description: "Should find FAFCAS documentation with high relevance"
	},
	{
		query: "database performance optimization",
		expectedMinScore: 0.7,
		expectedTerms: ["database", "performance", "sqlite", "optimization"],
		description: "Should find database-related docs"
	},
	{
		query: "vector similarity search",
		expectedMinScore: 0.6,
		expectedTerms: ["vector", "similarity", "search", "embedding"],
		description: "Should find vector search implementations"
	},
	{
		query: "pipeline ingestion workflow",
		expectedMinScore: 0.6,
		expectedTerms: ["pipeline", "ingestion", "workflow"],
		description: "Should find pipeline documentation"
	},
	{
		query: "cross domain entity linking",
		expectedMinScore: 0.5,
		expectedTerms: ["cross", "domain", "entity", "link"],
		description: "Should find cross-domain edge documentation"
	}
];

function runSearchTest(testCase: TestCase): boolean {
	console.log(`\n🔍 Testing: "${testCase.query}"`);
	console.log(`   Expected: ${testCase.description}`);
	
	// Run amalfa search command
	const result = spawnSync("bun", ["run", "src/cli.ts", "search", testCase.query, "--limit", "5"], {
		cwd: process.cwd(),
		encoding: "utf8",
		timeout: 10000
	});
	
	if (result.error) {
		console.log(`   ❌ Error: ${result.error.message}`);
		return false;
	}
	
	const output = result.stdout;
	
	// Extract scores and results
	const scoreRegex = /score: ([\d.]+)/g;
	const scores: number[] = [];
	let match;
	
	while ((match = scoreRegex.exec(output)) !== null) {
		scores.push(parseFloat(match[1]));
	}
	
	if (scores.length === 0) {
		console.log(`   ❌ No results found`);
		return false;
	}
	
	const topScore = Math.max(...scores);
	const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
	
	console.log(`   📊 Results: ${scores.length} found`);
	console.log(`   📈 Top score: ${topScore.toFixed(3)}`);
	console.log(`   📊 Avg score: ${avgScore.toFixed(3)}`);
	
	// Check if top score meets minimum expectation
	const scorePass = topScore >= testCase.expectedMinScore;
	console.log(`   🎯 Score check: ${scorePass ? '✅' : '❌'} (${topScore.toFixed(3)} >= ${testCase.expectedMinScore})`);
	
	// Check if expected terms appear in results (basic relevance)
	const outputLower = output.toLowerCase();
	const foundTerms = testCase.expectedTerms.filter(term => 
		outputLower.includes(term.toLowerCase())
	);
	const relevancePass = foundTerms.length >= Math.ceil(testCase.expectedTerms.length / 2);
	
	console.log(`   📝 Relevance: ${relevancePass ? '✅' : '❌'} (${foundTerms.length}/${testCase.expectedTerms.length} expected terms found)`);
	console.log(`   📋 Found terms: ${foundTerms.join(', ')}`);
	
	return scorePass && relevancePass;
}

async function runSmokeTesting() {
	console.log("🔥 SEARCH CAPABILITIES SMOKE TEST SUITE");
	console.log("=====================================\n");
	
	let passed = 0;
	let failed = 0;
	
	for (const testCase of searchTests) {
		const success = runSearchTest(testCase);
		if (success) {
			passed++;
		} else {
			failed++;
		}
	}
	
	console.log(`\n\n📊 SMOKE TEST RESULTS`);
	console.log(`====================`);
	console.log(`✅ Passed: ${passed}/${searchTests.length}`);
	console.log(`❌ Failed: ${failed}/${searchTests.length}`);
	console.log(`📈 Success Rate: ${((passed / searchTests.length) * 100).toFixed(1)}%`);
	
	if (passed === searchTests.length) {
		console.log(`\n🎉 ALL SMOKE TESTS PASSED - SEARCH SYSTEM OPERATIONAL`);
	} else {
		console.log(`\n⚠️  SOME TESTS FAILED - REQUIRES INVESTIGATION`);
	}
	
	// Additional quality checks
	console.log(`\n🔬 SYSTEM HEALTH CHECK`);
	
	// Check database stats
	const statsResult = spawnSync("bun", ["run", "src/cli.ts", "stats"], {
		cwd: process.cwd(),
		encoding: "utf8"
	});
	
	if (statsResult.stdout) {
		const nodeMatch = statsResult.stdout.match(/Nodes:\s+(\d+)/);
		const edgeMatch = statsResult.stdout.match(/Edges:\s+([\d,]+)/);
		const embeddingMatch = statsResult.stdout.match(/Embeddings:\s+(\d+)\s+\((\d+)-dim\)/);
		
		if (nodeMatch && edgeMatch && embeddingMatch) {
			const nodes = parseInt(nodeMatch[1]);
			const edges = parseInt(edgeMatch[1].replace(/,/g, ''));
			const embeddings = parseInt(embeddingMatch[1]);
			const dimensions = parseInt(embeddingMatch[2]);
			
			console.log(`   📊 Database: ${nodes} nodes, ${edges} edges, ${embeddings} embeddings`);
			console.log(`   🧠 Vector dimensions: ${dimensions} (expected: 384)`);
			console.log(`   ✅ Embedding coverage: ${((embeddings/nodes)*100).toFixed(1)}%`);
			console.log(`   🔗 Connectivity: ${(edges/nodes).toFixed(2)} edges per node`);
			
			console.log(`\n✅ System Health: ${dimensions === 384 && embeddings === nodes && edges > nodes ? 'EXCELLENT' : 'NEEDS ATTENTION'}`);
		}
	}
}

runSmokeTesting().catch(console.error);