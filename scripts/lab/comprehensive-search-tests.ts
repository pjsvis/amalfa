/**
 * Comprehensive Search Quality Test Suite
 * Tests vector search, reranking, and cross-domain linking
 */

import { spawnSync } from "child_process";
import { Database } from "bun:sqlite";

interface SearchTestResult {
	query: string;
	results: Array<{
		id: string;
		score: number;
		title?: string;
		rerankScore?: number;
	}>;
	success: boolean;
	avgScore: number;
	topScore: number;
	relevanceCheck: boolean;
}

class SearchQualityTester {
	private db: Database;
	
	constructor() {
		this.db = new Database(".amalfa/resonance.db");
	}
	
	async runComprehensiveTests() {
		console.log("🔍 COMPREHENSIVE SEARCH QUALITY TEST SUITE");
		console.log("==========================================\n");
		
		// Test 1: Known Entity → Document Relationships
		await this.testKnownRelationships();
		
		// Test 2: Technical Query Precision  
		await this.testTechnicalQueries();
		
		// Test 3: Reranking Quality
		await this.testReranking();
		
		// Test 4: Cross-Domain Search
		await this.testCrossDomainSearch();
		
		// Test 5: Edge Case Queries
		await this.testEdgeCases();
		
		this.db.close();
	}
	
	async testKnownRelationships() {
		console.log("🧪 Test 1: Known Entity → Document Relationships");
		console.log("Testing if entities find their linked documents...\n");
		
		// Get actual cross-domain edges from database
		const knownLinks = this.db.query(`
			SELECT e.source, e.target, e.confidence, n.title as doc_title
			FROM edges e
			JOIN nodes n ON e.target = n.id
			WHERE e.type = 'appears_in'
			ORDER BY e.confidence DESC
			LIMIT 10
		`).all() as any[];
		
		console.log("Known high-confidence links:");
		for (const link of knownLinks.slice(0, 5)) {
			console.log(`  ${link.source} → ${link.target} (${link.confidence.toFixed(3)})`);
			console.log(`    Document: ${link.doc_title}`);
		}
		
		console.log("\nTesting search for these entities:");
		
		for (const link of knownLinks.slice(0, 3)) {
			const searchResults = this.runSearch(link.source, 5);
			
			console.log(`\n  Query: "${link.source}"`);
			console.log(`  Expected to find: ${link.target} (confidence ${link.confidence.toFixed(3)})`);
			
			// Check if target document appears in search results
			const foundTarget = searchResults.results.find(r => r.id === link.target);
			if (foundTarget) {
				console.log(`  ✅ Found target: rank ${searchResults.results.indexOf(foundTarget) + 1}, score ${foundTarget.score.toFixed(3)}`);
			} else {
				console.log(`  ❌ Target not in top 5 results`);
			}
			
			console.log(`  Top result: ${searchResults.results[0]?.id} (${searchResults.results[0]?.score.toFixed(3)})`);
		}
	}
	
	async testTechnicalQueries() {
		console.log(`\n\n🔬 Test 2: Technical Query Precision`);
		console.log("Testing specific technical queries for semantic understanding...\n");
		
		const technicalTests = [
			{
				query: "database performance optimization SQLite",
				expectedDocs: ["database-procedures", "resonance", "sqlite"],
				minScore: 0.7
			},
			{
				query: "FAFCAS vector normalization protocol",
				expectedDocs: ["fafcas", "embeddings", "vector"],
				minScore: 0.8
			},
			{
				query: "cross domain entity document linking",
				expectedDocs: ["cross-domain", "pipeline", "entity"],
				minScore: 0.6
			}
		];
		
		for (const test of technicalTests) {
			const results = this.runSearch(test.query, 10);
			
			console.log(`Query: "${test.query}"`);
			console.log(`  Top 5 results:`);
			
			for (let i = 0; i < Math.min(5, results.results.length); i++) {
				const result = results.results[i];
				const isRelevant = test.expectedDocs.some(term => 
					result.id.toLowerCase().includes(term) || 
					result.title?.toLowerCase().includes(term)
				);
				console.log(`    ${i+1}. ${result.id.substring(0, 50)} (${result.score.toFixed(3)}) ${isRelevant ? '✅' : ''}`);
			}
			
			const relevantInTop5 = results.results.slice(0, 5).filter(r =>
				test.expectedDocs.some(term => 
					r.id.toLowerCase().includes(term) || 
					r.title?.toLowerCase().includes(term)
				)
			).length;
			
			console.log(`  Relevance: ${relevantInTop5}/5 relevant results ${relevantInTop5 >= 2 ? '✅' : '❌'}`);
			console.log(`  Quality: Top score ${results.topScore.toFixed(3)} ${results.topScore >= test.minScore ? '✅' : '❌'}`);
		}
	}
	
	async testReranking() {
		console.log(`\n\n⚖️ Test 3: Reranking Quality Comparison`);
		console.log("Comparing vector search vs reranked search...\n");
		
		const testQueries = [
			"vector database performance",
			"FAFCAS protocol implementation",
			"pipeline ingestion workflow"
		];
		
		for (const query of testQueries) {
			console.log(`Query: "${query}"`);
			
			// Vector search only
			const vectorResults = this.runSearch(query, 5);
			console.log(`  Vector search (top 3):`);
			for (let i = 0; i < 3; i++) {
				const r = vectorResults.results[i];
				if (r) {
					console.log(`    ${i+1}. ${r.id.substring(0, 40)} (${r.score.toFixed(3)})`);
				}
			}
			
			// Vector + reranking
			const rerankedResults = this.runSearch(query, 5, true);
			console.log(`  With reranking (top 3):`);
			for (let i = 0; i < 3; i++) {
				const r = rerankedResults.results[i];
				if (r) {
					console.log(`    ${i+1}. ${r.id.substring(0, 40)} (${r.score.toFixed(3)}) ${r.rerankScore ? `[rerank: ${r.rerankScore.toFixed(3)}]` : ''}`);
				}
			}
			
			// Compare top results
			const vectorTop = vectorResults.results[0]?.id;
			const rerankedTop = rerankedResults.results[0]?.id;
			const rerankedChanged = vectorTop !== rerankedTop;
			
			console.log(`  Reranking effect: ${rerankedChanged ? 'Changed top result ⚖️' : 'Confirmed top result ✅'}`);
		}
	}
	
	async testCrossDomainSearch() {
		console.log(`\n\n🌉 Test 4: Cross-Domain Search Verification`);
		console.log("Testing if entity queries find related documents...\n");
		
		// Get some entities and test if searching for them returns related docs
		const entities = this.db.query(`
			SELECT id, title
			FROM nodes 
			WHERE domain = 'lexicon' 
			AND id IN ('resonancedb', 'pipeline', 'embeddings', 'fafcas')
		`).all() as any[];
		
		for (const entity of entities) {
			const results = this.runSearch(entity.id, 8);
			
			console.log(`Entity: "${entity.id}"`);
			
			// Check how many results are documents vs entities
			const docResults = results.results.filter(r => !r.id.startsWith('temp-') && (
				r.id.startsWith('docs-') || 
				r.id.startsWith('src-') || 
				r.id.startsWith('debriefs-') || 
				r.id.startsWith('playbooks-')
			));
			
			console.log(`  Found ${results.results.length} total, ${docResults.length} documents`);
			console.log(`  Top document matches:`);
			
			for (let i = 0; i < Math.min(3, docResults.length); i++) {
				const doc = docResults[i];
				console.log(`    ${i+1}. ${doc.id.substring(0, 50)} (${doc.score.toFixed(3)})`);
			}
			
			console.log(`  Cross-domain linking: ${docResults.length > 0 ? '✅' : '❌'}`);
		}
	}
	
	async testEdgeCases() {
		console.log(`\n\n🔍 Test 5: Edge Case Queries`);
		console.log("Testing search behavior on edge cases...\n");
		
		const edgeCases = [
			{ query: "nonexistent terms xyz123", expectLowScores: true },
			{ query: "a", expectManyResults: true },
			{ query: "database database database", expectRelevant: true },
			{ query: "", expectError: true }
		];
		
		for (const testCase of edgeCases) {
			console.log(`Query: "${testCase.query}"`);
			
			const results = this.runSearch(testCase.query, 5);
			
			if (testCase.expectError && results.results.length === 0) {
				console.log(`  ✅ Expected error/no results`);
			} else if (testCase.expectLowScores && results.topScore < 0.3) {
				console.log(`  ✅ Expected low scores: ${results.topScore.toFixed(3)}`);
			} else if (testCase.expectManyResults && results.results.length >= 5) {
				console.log(`  ✅ Expected many results: ${results.results.length} found`);
			} else if (testCase.expectRelevant && results.topScore > 0.7) {
				console.log(`  ✅ Expected relevant results: ${results.topScore.toFixed(3)}`);
			} else {
				console.log(`  ❌ Unexpected behavior`);
			}
			
			console.log(`  Results: ${results.results.length}, top score: ${results.topScore.toFixed(3)}`);
		}
	}
	
	runSearch(query: string, limit: number = 5, useReranker: boolean = false): SearchTestResult {
		const args = ["run", "src/cli.ts", "search", query, "--limit", limit.toString(), "--json"];
		if (useReranker) args.push("--rerank");
		
		const result = spawnSync("bun", args, {
			cwd: process.cwd(),
			encoding: "utf8",
			timeout: 15000
		});
		
		if (result.error || result.status !== 0) {
			return {
				query,
				results: [],
				success: false,
				avgScore: 0,
				topScore: 0,
				relevanceCheck: false
			};
		}
		
		try {
			// Parse JSON output (look for JSON array)
			const lines = result.stdout.trim().split('\n');
			const jsonLine = lines.find(line => line.trim().startsWith('['));
			
			if (!jsonLine) {
				console.log("No JSON array found in output");
				return {
					query,
					results: [],
					success: false,
					avgScore: 0,
					topScore: 0,
					relevanceCheck: false
				};
			}
			
			const results = JSON.parse(jsonLine.trim());
			
			const scores = results.map((r: any) => r.score || 0);
			const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
			const topScore = scores.length > 0 ? Math.max(...scores) : 0;
			
			return {
				query,
				results,
				success: true,
				avgScore,
				topScore,
				relevanceCheck: topScore > 0.5
			};
			
		} catch (e) {
			console.log("Failed to parse search results:", e);
			return {
				query,
				results: [],
				success: false,
				avgScore: 0,
				topScore: 0,
				relevanceCheck: false
			};
		}
	}
}

// Run the test suite
const tester = new SearchQualityTester();
tester.runComprehensiveTests().catch(console.error);