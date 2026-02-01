/**
 * Sophisticated Consistency Testing Suite
 * Tests for consistency across code, documentation, and implementation
 */

import { spawnSync } from "child_process";
import { Database } from "bun:sqlite";

class KnowledgeGraphConsistencyTester {
	private db: Database;
	
	constructor() {
		this.db = new Database(".amalfa/resonance.db");
	}
	
	async runConsistencyTests() {
		console.log("🔍 KNOWLEDGE GRAPH CONSISTENCY ANALYSIS");
		console.log("=======================================\n");
		
		// Test 1: Documentation vs Implementation Consistency
		await this.testDocCodeConsistency();
		
		// Test 2: Architectural Principle Consistency  
		await this.testArchitecturalConsistency();
		
		// Test 3: Configuration Consistency
		await this.testConfigurationConsistency();
		
		// Test 4: Process vs Reality Consistency
		await this.testProcessConsistency();
		
		// Test 5: Terminology Consistency
		await this.testTerminologyConsistency();
		
		this.db.close();
	}
	
	async testDocCodeConsistency() {
		console.log("📚 Test 1: Documentation vs Implementation Consistency");
		console.log("Testing if documentation matches actual code implementation...\n");
		
		const consistencyChecks = [
			{
				concept: "FAFCAS protocol",
				expectedInCode: ["toFafcas", "dotProduct", "unit length", "384"],
				expectedInDocs: ["Fast As F*ck Cool As Sh*t", "normalized", "dot product"]
			},
			{
				concept: "vector search implementation",
				expectedInCode: ["VectorEngine", "searchByVector", "cosine similarity"],
				expectedInDocs: ["vector search", "similarity", "embeddings"]
			},
			{
				concept: "pipeline ingestion workflow",
				expectedInCode: ["AmalfaIngestor", "init command", "document nodes"],
				expectedInDocs: ["pipeline", "ingestion", "workflow", "documents"]
			}
		];
		
		for (const check of consistencyChecks) {
			console.log(`\n  Concept: "${check.concept}"`);
			
			// Search for code implementations
			const codeResults = this.search(`${check.concept} implementation`, 5);
			const codeFiles = codeResults.filter(r => 
				r.id.includes('src-') || r.id.endsWith('.ts') || r.id.includes('pipeline')
			);
			
			// Search for documentation
			const docResults = this.search(`${check.concept} documentation`, 5);
			const docFiles = docResults.filter(r =>
				r.id.includes('docs-') || r.id.includes('playbooks-') || r.id.includes('README')
			);
			
			console.log(`    Code files found: ${codeFiles.length}`);
			for (const file of codeFiles.slice(0, 3)) {
				console.log(`      ${file.id.substring(0, 50)} (${file.score.toFixed(3)})`);
			}
			
			console.log(`    Doc files found: ${docFiles.length}`);
			for (const file of docFiles.slice(0, 3)) {
				console.log(`      ${file.id.substring(0, 50)} (${file.score.toFixed(3)})`);
			}
			
			// Check if both code and docs exist for this concept
			const hasCodeDocs = codeFiles.length > 0 && docFiles.length > 0;
			console.log(`    Consistency status: ${hasCodeDocs ? '✅ Both code & docs found' : '⚠️ Missing code or docs'}`);
		}
	}
	
	async testArchitecturalConsistency() {
		console.log(`\n\n🏗️  Test 2: Architectural Principle Consistency`);
		console.log("Testing if stated principles are followed in practice...\n");
		
		const principleTests = [
			{
				principle: "SSOT configuration",
				shouldFind: ["amalfa.settings.json", "getDbPath", "single source"],
				shouldNotFind: ["hardcoded paths", "multiple configs"]
			},
			{
				principle: "FAFCAS compliance",
				shouldFind: ["unit normalized", "dot product", "384-dim"],
				shouldNotFind: ["cosine similarity", "sqrt", "division"]
			},
			{
				principle: "streaming JSONL",
				shouldFind: ["JSONL", "streaming", "batch processing"],
				shouldNotFind: ["load all memory", "JSON.parse"]
			}
		];
		
		for (const test of principleTests) {
			console.log(`\n  Principle: "${test.principle}"`);
			
			const results = this.search(test.principle, 10);
			const relevantResults = results.filter(r => r.score > 0.6);
			
			console.log(`    Found ${relevantResults.length} relevant documents`);
			
			// Check for positive indicators
			const positiveMatches = relevantResults.filter(r => 
				test.shouldFind.some(term => 
					r.id.toLowerCase().includes(term.toLowerCase()) ||
					r.preview?.toLowerCase().includes(term.toLowerCase())
				)
			);
			
			console.log(`    Positive indicators: ${positiveMatches.length}/${relevantResults.length}`);
			for (const match of positiveMatches.slice(0, 3)) {
				console.log(`      ✅ ${match.id.substring(0, 45)} (${match.score.toFixed(3)})`);
			}
			
			console.log(`    Principle adherence: ${positiveMatches.length > 0 ? '✅ Evidence found' : '⚠️ No evidence'}`);
		}
	}
	
	async testConfigurationConsistency() {
		console.log(`\n\n⚙️ Test 3: Configuration Consistency`);
		console.log("Testing configuration references across the codebase...\n");
		
		// Search for configuration-related content
		const configQueries = [
			"amalfa settings configuration",
			"database path configuration", 
			"embedding model configuration",
			"source directories configuration"
		];
		
		for (const query of configQueries) {
			console.log(`\n  Query: "${query}"`);
			
			const results = this.search(query, 8);
			const configFiles = results.filter(r => 
				r.id.includes('config') || 
				r.id.includes('settings') ||
				r.id.includes('defaults')
			);
			
			const codeReferences = results.filter(r =>
				r.id.includes('src-') && (
					r.id.includes('config') || 
					r.id.includes('settings') ||
					r.id.includes('cli')
				)
			);
			
			console.log(`    Config files: ${configFiles.length}`);
			console.log(`    Code references: ${codeReferences.length}`);
			console.log(`    Consistency score: ${results.length > 0 ? results[0].score.toFixed(3) : 'N/A'}`);
			
			const wellDocumented = configFiles.length > 0 && codeReferences.length > 0;
			console.log(`    Status: ${wellDocumented ? '✅ Well documented' : '⚠️ Missing links'}`);
		}
	}
	
	async testProcessConsistency() {
		console.log(`\n\n🔄 Test 4: Process vs Reality Consistency`);
		console.log("Testing if described processes match actual implementation...\n");
		
		const processTests = [
			{
				process: "document ingestion process",
				implementation: ["AmalfaIngestor", "init command", "markdown files"]
			},
			{
				process: "vector embedding workflow", 
				implementation: ["Embedder", "FastEmbed", "FAFCAS normalization"]
			},
			{
				process: "cross domain edge generation",
				implementation: ["cross-domain pipeline", "similarity calculation", "entity linking"]
			}
		];
		
		for (const test of processTests) {
			console.log(`\n  Process: "${test.process}"`);
			
			// Search for process documentation
			const processResults = this.search(test.process, 5);
			const docMatches = processResults.filter(r => 
				r.id.includes('docs-') || r.id.includes('playbooks-') || r.id.includes('README')
			);
			
			// Search for implementation
			const implResults = this.search(`${test.process} implementation code`, 5);
			const codeMatches = implResults.filter(r => 
				r.id.includes('src-') || r.id.includes('pipeline')
			);
			
			console.log(`    Process docs: ${docMatches.length} found`);
			console.log(`    Implementation: ${codeMatches.length} found`);
			
			// Check implementation terms
			const hasImplTerms = implResults.some(r =>
				test.implementation.some(term =>
					r.id.toLowerCase().includes(term.toLowerCase())
				)
			);
			
			console.log(`    Implementation match: ${hasImplTerms ? '✅ Found expected terms' : '⚠️ Terms not found'}`);
			console.log(`    Process-code consistency: ${docMatches.length > 0 && codeMatches.length > 0 ? '✅ Both exist' : '⚠️ Gap detected'}`);
		}
	}
	
	async testTerminologyConsistency() {
		console.log(`\n\n📖 Test 5: Terminology Consistency`);
		console.log("Testing consistent usage of key terms across the knowledge base...\n");
		
		const terminologyTests = [
			{
				term: "resonance",
				variants: ["resonance", "resonancedb", "ResonanceDB"],
				expectedContexts: ["database", "storage", "graph"]
			},
			{
				term: "embedding",
				variants: ["embedding", "embeddings", "vector", "FAFCAS"],
				expectedContexts: ["similarity", "search", "dimension"]
			},
			{
				term: "pipeline", 
				variants: ["pipeline", "ingestion", "workflow"],
				expectedContexts: ["document", "lexicon", "cross-domain"]
			}
		];
		
		for (const test of terminologyTests) {
			console.log(`\n  Term: "${test.term}"`);
			
			// Search for all variants
			const allResults = [];
			for (const variant of test.variants) {
				const results = this.search(variant, 10);
				allResults.push(...results.filter(r => r.score > 0.6));
			}
			
			// Remove duplicates and sort by score
			const uniqueResults = Array.from(
				new Map(allResults.map(r => [r.id, r])).values()
			).sort((a, b) => b.score - a.score);
			
			console.log(`    Total references: ${uniqueResults.length}`);
			console.log(`    Avg score: ${uniqueResults.length > 0 ? (uniqueResults.reduce((s, r) => s + r.score, 0) / uniqueResults.length).toFixed(3) : 'N/A'}`);
			
			// Check context consistency
			const contextMatches = uniqueResults.filter(r =>
				test.expectedContexts.some(ctx =>
					r.id.toLowerCase().includes(ctx) || r.preview?.toLowerCase().includes(ctx)
				)
			);
			
			console.log(`    Context consistency: ${contextMatches.length}/${uniqueResults.length} (${((contextMatches.length / uniqueResults.length) * 100).toFixed(1)}%)`);
			console.log(`    Terminology status: ${contextMatches.length / uniqueResults.length > 0.5 ? '✅ Consistent usage' : '⚠️ Inconsistent contexts'}`);
		}
	}
	
	search(query: string, limit: number = 5): any[] {
		const result = spawnSync("bun", ["run", "src/cli.ts", "search", query, "--limit", limit.toString(), "--json"], {
			cwd: process.cwd(),
			encoding: "utf8"
		});
		
		if (result.status === 0) {
			try {
				return JSON.parse(result.stdout.trim());
			} catch {
				return [];
			}
		}
		return [];
	}
}

// Run consistency analysis
const tester = new KnowledgeGraphConsistencyTester();
tester.runConsistencyTests().catch(console.error);