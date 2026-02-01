/**
 * Technical Debt and Code Quality Assessment
 */

import { spawnSync } from "child_process";
import { Database } from "bun:sqlite";
import { writeFileSync } from "fs";

class TechnicalDebtAnalyzer {
	private db: Database;
	
	constructor() {
		this.db = new Database(".amalfa/resonance.db");
	}
	
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
	
	async analyzeTechnicalDebt() {
		console.log("⚠️  TECHNICAL DEBT ANALYSIS");
		console.log("==========================\n");
		
		const report = {
			generatedAt: new Date().toISOString(),
			debtAreas: {
				deprecated: await this.findDeprecatedCode(),
				todoItems: await this.findTodoItems(),
				warnings: await this.findCodeWarnings(),
				duplications: await this.findDuplicatedLogic(),
				complexity: await this.findComplexityHotspots(),
				dependencies: await this.findDependencyIssues()
			}
		};
		
		writeFileSync(".amalfa/inferences/technical-debt-report.json", JSON.stringify(report, null, 2));
		this.generateDebtMarkdown(report);
		
		return report;
	}
	
	async findDeprecatedCode() {
		console.log("🗑️  Deprecated Code Detection");
		
		const deprecatedTerms = [
			"TODO", "FIXME", "HACK", "TEMP", 
			"deprecated", "obsolete", "remove",
			"legacy", "old implementation"
		];
		
		const deprecatedItems = [];
		
		for (const term of deprecatedTerms) {
			const results = this.search(term, 5);
			const codeFiles = results.filter(r => r.id.includes('src-') && r.score > 0.7);
			
			for (const file of codeFiles) {
				deprecatedItems.push({
					file: file.id,
					term,
					score: file.score,
					priority: term === 'FIXME' ? 'high' : term === 'TODO' ? 'medium' : 'low'
				});
			}
		}
		
		console.log(`  Found ${deprecatedItems.length} deprecated code references`);
		return deprecatedItems;
	}
	
	async findTodoItems() {
		console.log(`\n🔲 TODO and Action Item Analysis`);
		
		const actionTerms = ["todo", "fixme", "note:", "warning:", "implement"];
		const todos = [];
		
		for (const term of actionTerms) {
			const results = this.search(term, 8);
			todos.push(...results.filter(r => r.score > 0.6));
		}
		
		console.log(`  Found ${todos.length} action items in knowledge base`);
		return todos.slice(0, 20); // Top 20
	}
	
	async findCodeWarnings() {
		console.log(`\n⚠️  Code Quality Warnings`);
		
		const warningPatterns = [
			"biome-ignore", "eslint-disable", "ts-ignore",
			"any type", "unsafe", "temporary fix"
		];
		
		const warnings = [];
		
		for (const pattern of warningPatterns) {
			const results = this.search(pattern, 5);
			const codeWarnings = results.filter(r => r.id.includes('src-') && r.score > 0.8);
			warnings.push(...codeWarnings);
		}
		
		console.log(`  Found ${warnings.length} code quality warnings`);
		return warnings;
	}
	
	async findDuplicatedLogic() {
		console.log(`\n🔄 Logic Duplication Detection`);
		
		// Look for similar implementations
		const duplicationTerms = [
			"similar logic", "duplicate code", "repeated implementation",
			"copy paste", "identical function"
		];
		
		const duplications = [];
		
		for (const term of duplicationTerms) {
			const results = this.search(term, 3);
			duplications.push(...results.filter(r => r.score > 0.6));
		}
		
		console.log(`  Found ${duplications.length} potential duplications`);
		return duplications;
	}
	
	async findComplexityHotspots() {
		console.log(`\n🌡️  Complexity Hotspot Analysis`);
		
		// Search for complexity indicators
		const complexityTerms = [
			"complex implementation", "refactor needed", 
			"hard to understand", "spaghetti code",
			"cognitive load", "too complicated"
		];
		
		const hotspots = [];
		
		for (const term of complexityTerms) {
			const results = this.search(term, 3);
			hotspots.push(...results.filter(r => r.score > 0.6));
		}
		
		console.log(`  Found ${hotspots.length} complexity concerns`);
		return hotspots;
	}
	
	async findDependencyIssues() {
		console.log(`\n📦 Dependency Issues`);
		
		// Search for dependency problems
		const depTerms = [
			"dependency issue", "version conflict", 
			"outdated package", "security vulnerability",
			"breaking change", "incompatible"
		];
		
		const issues = [];
		
		for (const term of depTerms) {
			const results = this.search(term, 3);
			issues.push(...results.filter(r => r.score > 0.6));
		}
		
		console.log(`  Found ${issues.length} dependency concerns`);
		return issues;
	}
	
	generateDebtMarkdown(report: any) {
		const markdown = `# Technical Debt Analysis Report
**Generated:** ${report.generatedAt}

## Summary

- **Deprecated code**: ${report.debtAreas.deprecated.length} items
- **TODO items**: ${report.debtAreas.todoItems.length} action items
- **Code warnings**: ${report.debtAreas.warnings.length} quality issues
- **Duplications**: ${report.debtAreas.duplications.length} potential duplicates
- **Complexity hotspots**: ${report.debtAreas.complexity.length} complex areas
- **Dependency issues**: ${report.debtAreas.dependencies.length} dependency concerns

## Debt Score: ${this.calculateDebtScore(report)}/10

See \`.amalfa/inferences/technical-debt-report.json\` for full analysis.
`;
		
		writeFileSync(".amalfa/inferences/technical-debt-report.md", markdown);
	}
	
	calculateDebtScore(report: any): number {
		const weights = {
			deprecated: 0.3,
			warnings: 0.25, 
			complexity: 0.2,
			duplications: 0.15,
			dependencies: 0.1
		};
		
		const scores = {
			deprecated: Math.max(0, 10 - report.debtAreas.deprecated.length * 0.5),
			warnings: Math.max(0, 10 - report.debtAreas.warnings.length * 0.3),
			complexity: Math.max(0, 10 - report.debtAreas.complexity.length * 0.4),
			duplications: Math.max(0, 10 - report.debtAreas.duplications.length * 0.2),
			dependencies: Math.max(0, 10 - report.debtAreas.dependencies.length * 0.5)
		};
		
		return Object.entries(scores).reduce((total, [key, score]) => {
			return total + (score * weights[key as keyof typeof weights]);
		}, 0);
	}
}

const debtAnalyzer = new TechnicalDebtAnalyzer();
debtAnalyzer.analyzeTechnicalDebt().catch(console.error);