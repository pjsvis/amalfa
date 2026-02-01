/**
 * Knowledge Gap Analysis System
 * Identifies missing documentation, implementation gaps, and architectural holes
 */

import { spawnSync } from "child_process";
import { writeFileSync } from "fs";

class KnowledgeGapAnalyzer {
	search(query: string, limit: number = 10): any[] {
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
	
	async runGapAnalysis() {
		console.log("🕳️  KNOWLEDGE GAP ANALYSIS");
		console.log("=========================\n");
		
		const report = {
			generatedAt: new Date().toISOString(),
			gaps: {
				architectural: await this.findArchitecturalGaps(),
				documentation: await this.findDocumentationGaps(), 
				implementation: await this.findImplementationGaps(),
				process: await this.findProcessGaps(),
				integration: await this.findIntegrationGaps()
			}
		};
		
		// Save detailed gap report
		writeFileSync(".amalfa/inferences/gap-analysis.json", JSON.stringify(report, null, 2));
		this.generateGapReportMarkdown(report);
		
		return report;
	}
	
	async findArchitecturalGaps() {
		console.log("🏗️  Architectural Gaps");
		
		const expectedComponents = [
			"authentication system",
			"error handling strategy", 
			"logging framework",
			"testing framework",
			"deployment strategy",
			"monitoring system",
			"backup strategy",
			"security model",
			"performance monitoring",
			"data validation"
		];
		
		const gaps = [];
		
		for (const component of expectedComponents) {
			const results = this.search(component, 5);
			const hasEvidence = results.length > 0 && results[0].score > 0.6;
			
			if (!hasEvidence) {
				gaps.push({
					component,
					evidence: results.length,
					topScore: results.length > 0 ? results[0].score : 0,
					status: "gap"
				});
			} else {
				console.log(`  ✅ ${component}: Found evidence (${results[0].score.toFixed(3)})`);
			}
		}
		
		console.log(`\n  Found ${gaps.length} architectural gaps:`);
		for (const gap of gaps) {
			console.log(`    ⚠️ ${gap.component} (evidence: ${gap.evidence}, score: ${gap.topScore.toFixed(3)})`);
		}
		
		return gaps;
	}
	
	async findDocumentationGaps() {
		console.log(`\n\n📖 Documentation Gaps`);
		
		// Find code files that lack documentation
		const codeQueries = [
			"VectorEngine implementation",
			"SemanticWeaver usage",
			"ResonanceDB schema",
			"EdgeWeaver functionality", 
			"GraphEngine operations",
			"AmalfaIngestor workflow"
		];
		
		const gaps = [];
		
		for (const query of codeQueries) {
			const codeResults = this.search(query, 5);
			const codeFiles = codeResults.filter(r => r.id.includes('src-'));
			
			const docResults = this.search(`${query} documentation`, 5);
			const docFiles = docResults.filter(r => 
				r.id.includes('docs-') || r.id.includes('README') || r.id.includes('playbook')
			);
			
			if (codeFiles.length > 0 && docFiles.length === 0) {
				gaps.push({
					component: query,
					codeFiles: codeFiles.length,
					docFiles: docFiles.length,
					gap: "missing_documentation"
				});
			}
		}
		
		console.log(`  Found ${gaps.length} undocumented code components:`);
		for (const gap of gaps) {
			console.log(`    📝 ${gap.component}: ${gap.codeFiles} code files, ${gap.docFiles} docs`);
		}
		
		return gaps;
	}
	
	async findImplementationGaps() {
		console.log(`\n\n⚙️ Implementation Gaps`);
		
		// Find documented features that lack implementation
		const featureQueries = [
			"daemon management",
			"health monitoring",
			"performance metrics",
			"error recovery",
			"incremental updates",
			"batch processing",
			"cache management",
			"service orchestration"
		];
		
		const gaps = [];
		
		for (const query of featureQueries) {
			const docResults = this.search(query, 5);
			const docFiles = docResults.filter(r => 
				r.id.includes('docs-') || r.id.includes('playbook') || r.id.includes('brief')
			);
			
			const implResults = this.search(`${query} implementation`, 5);
			const implFiles = implResults.filter(r => r.id.includes('src-'));
			
			if (docFiles.length > 0 && implFiles.length === 0) {
				gaps.push({
					feature: query,
					docFiles: docFiles.length,
					implFiles: implFiles.length,
					gap: "missing_implementation"
				});
			}
		}
		
		console.log(`  Found ${gaps.length} unimplemented documented features:`);
		for (const gap of gaps) {
			console.log(`    🔧 ${gap.feature}: ${gap.docFiles} docs, ${gap.implFiles} implementations`);
		}
		
		return gaps;
	}
	
	async findProcessGaps() {
		console.log(`\n\n🔄 Process Workflow Gaps`);
		
		// Check for missing process documentation
		const processes = [
			"onboarding new developers",
			"deployment procedures", 
			"troubleshooting guide",
			"backup and recovery",
			"performance tuning",
			"database maintenance",
			"service management",
			"configuration changes"
		];
		
		const gaps = [];
		
		for (const process of processes) {
			const results = this.search(process, 3);
			const hasProcess = results.length > 0 && results[0].score > 0.5;
			
			if (!hasProcess) {
				gaps.push({
					process,
					evidence: results.length,
					topScore: results.length > 0 ? results[0].score : 0
				});
			}
		}
		
		console.log(`  Found ${gaps.length} missing process workflows:`);
		for (const gap of gaps) {
			console.log(`    📋 ${gap.process} (evidence: ${gap.evidence}, score: ${gap.topScore.toFixed(3)})`);
		}
		
		return gaps;
	}
	
	async findIntegrationGaps() {
		console.log(`\n\n🔗 Integration & Interface Gaps`);
		
		// Check for missing integration documentation
		const integrations = [
			"MCP server integration",
			"CLI command interfaces",
			"daemon communication",
			"service dependencies", 
			"API endpoints",
			"error propagation",
			"logging coordination",
			"configuration reload"
		];
		
		const gaps = [];
		
		for (const integration of integrations) {
			const results = this.search(integration, 3);
			const hasDocumentation = results.length > 0 && results[0].score > 0.6;
			
			if (!hasDocumentation) {
				gaps.push({
					integration,
					evidence: results.length,
					topScore: results.length > 0 ? results[0].score : 0
				});
			} else {
				console.log(`  ✅ ${integration}: Documented (${results[0].score.toFixed(3)})`);
			}
		}
		
		console.log(`\n  Found ${gaps.length} integration gaps:`);
		for (const gap of gaps) {
			console.log(`    🔌 ${gap.integration} (evidence: ${gap.evidence}, score: ${gap.topScore.toFixed(3)})`);
		}
		
		return gaps;
	}
	
	generateGapReportMarkdown(report: any) {
		const markdown = `# Knowledge Gap Analysis Report
**Generated:** ${report.generatedAt}
**Database:** 1,673 nodes, 6,328 edges

## Gap Summary

- **Architectural gaps**: ${report.gaps.architectural.length} missing components
- **Documentation gaps**: ${report.gaps.documentation.length} undocumented code components  
- **Implementation gaps**: ${report.gaps.implementation.length} unimplemented features
- **Process gaps**: ${report.gaps.process.length} missing workflows
- **Integration gaps**: ${report.gaps.integration.length} undocumented interfaces

## Priority Gaps

### 🔴 High Priority (Blocking)

${report.gaps.process.slice(0, 3).map(g => `- **${g.process}**: Critical workflow missing`).join('\n')}

### 🟡 Medium Priority (Quality)

${report.gaps.documentation.slice(0, 3).map(g => `- **${g.component}**: Code exists but undocumented`).join('\n')}

### 🟢 Low Priority (Enhancement)

${report.gaps.architectural.slice(0, 3).map(g => `- **${g.component}**: Nice-to-have feature`).join('\n')}

## Recommendations

1. **Create troubleshooting guides** for system maintenance
2. **Document core engine classes** (VectorEngine, ResonanceDB)
3. **Add deployment and backup procedures**
4. **Create developer onboarding documentation**

## Full Gap Details

See \`.amalfa/inferences/gap-analysis.json\` for complete data.
`;
		
		writeFileSync(".amalfa/inferences/gap-report.md", markdown);
	}
}

const analyzer = new KnowledgeGapAnalyzer();
analyzer.runGapAnalysis().catch(console.error);