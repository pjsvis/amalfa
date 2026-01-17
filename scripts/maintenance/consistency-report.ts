#!/usr/bin/env bun

/**
 * Amalfa Consistency Report Generator
 * 
 * Checks alignment between code, documentation, and behavior.
 * Outputs JSON report for dashboard integration.
 * 
 * Usage:
 *   bun run scripts/maintenance/consistency-report.ts [--json] [--verbose]
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

interface ConsistencyIssue {
	severity: "error" | "warning" | "info";
	category: string;
	message: string;
	location?: string;
	suggestion?: string;
}

interface ConsistencyReport {
	timestamp: string;
	overall_score: number; // 0-100
	checks_passed: number;
	checks_failed: number;
	checks_total: number;
	issues: ConsistencyIssue[];
	categories: {
		[key: string]: {
			passed: number;
			failed: number;
			score: number;
		};
	};
	metadata: {
		version: string;
		git_commit?: string;
		git_branch?: string;
	};
}

class ConsistencyChecker {
	private issues: ConsistencyIssue[] = [];
	private checksRun = 0;
	private checksPassed = 0;
	private verbose = false;
	private categories = new Map<string, { passed: number; failed: number }>();

	constructor(verbose = false) {
		this.verbose = verbose;
	}

	private log(message: string) {
		if (this.verbose) {
			console.log(message);
		}
	}

	private addIssue(issue: ConsistencyIssue) {
		this.issues.push(issue);
		this.checksRun++;

		// Track by category
		const cat = this.categories.get(issue.category) || {
			passed: 0,
			failed: 0,
		};
		cat.failed++;
		this.categories.set(issue.category, cat);
	}

	private passCheck(category: string) {
		this.checksRun++;
		this.checksPassed++;

		const cat = this.categories.get(category) || { passed: 0, failed: 0 };
		cat.passed++;
		this.categories.set(category, cat);
	}

	/**
	 * Check 1: CLI commands in docs exist in code
	 */
	async checkCliCommands() {
		this.log("Checking CLI commands...");

		const cliSource = readFileSync("src/cli.ts", "utf-8");
		const cliCases = [
			...cliSource.matchAll(/case ["']([a-z-]+)["']:/g),
		].map((m) => m[1]);

		const docs = ["README.md", "WARP.md", "docs/MCP-TOOLS.md"];
		const docCommands = new Set<string>();

		// Words to exclude from command extraction (common words in prose/examples)
		const excludeWords = new Set([
			"bun",
			"run",
			"command",
			"or",
			"and",
			"the",
			"a",
			"to",
			"---",
			"-",
		]);

		for (const doc of docs) {
			if (!existsSync(doc)) continue;
			const content = readFileSync(doc, "utf-8");
			const matches = content.matchAll(/amalfa\s+([a-z-]+)/g);
			for (const match of matches) {
				if (match[1] && !excludeWords.has(match[1])) {
					docCommands.add(match[1]);
				}
			}
		}

		// Check each documented command exists
		for (const cmd of docCommands) {
			if (!cliCases.includes(cmd)) {
				this.addIssue({
					severity: "error",
					category: "cli-commands",
					message: `Documented command 'amalfa ${cmd}' not found in src/cli.ts`,
					location: "Multiple docs",
					suggestion: `Add '${cmd}' to src/cli.ts or remove from documentation`,
				});
			} else {
				this.passCheck("cli-commands");
			}
		}

		// Check for undocumented commands
		const excludeFromCheck = ["help", "version", "-h", "--help", "-v", "--version"];
		for (const cmd of cliCases) {
			if (cmd && !excludeFromCheck.includes(cmd) && !docCommands.has(cmd)) {
				this.addIssue({
					severity: "warning",
					category: "cli-commands",
					message: `Command 'amalfa ${cmd}' exists but is not documented`,
					location: "src/cli.ts",
					suggestion: `Document in README.md or mark as internal`,
				});
			}
		}
	}

	/**
	 * Check 2: File paths referenced in docs exist
	 */
	async checkFilePaths() {
		this.log("Checking file paths...");

		const docs = [
			"README.md",
			"WARP.md",
			"docs/MCP-TOOLS.md",
			"docs/ARCHITECTURE.md",
		];

		for (const doc of docs) {
			if (!existsSync(doc)) continue;

			const content = readFileSync(doc, "utf-8");
			// Match paths in backticks: `path/to/file.ext`
			const pathPattern = /`([^`]*(?:\.ts|\.js|\.json|\.md|\.sh))`/g;
			const matches = [...content.matchAll(pathPattern)];

			for (const match of matches) {
				const path = match[1];
				if (!path) continue;

				// Skip glob patterns, placeholders, and generic config file names
				if (
					path.includes("*") || // Glob patterns like *.test.ts
					path.includes("<") || // Placeholders like <command>
					path.includes(">") ||
					path === "claude_desktop_config.json" || // Generic user config
					path === ".ember.json" // Hidden config file
				) {
					this.passCheck("file-paths"); // Skip check but count as pass
					continue;
				}

				// Try multiple locations
				const locations = [
					path,
					join("src", path),
					join("scripts", path),
					join("docs", path),
				];

				const exists = locations.some((loc) => existsSync(loc));

				if (!exists) {
					this.addIssue({
						severity: "error",
						category: "file-paths",
						message: `Referenced file '${path}' does not exist`,
						location: doc,
						suggestion: `Update path or remove reference`,
					});
				} else {
					this.passCheck("file-paths");
				}
			}
		}
	}

	/**
	 * Check 3: Service naming consistency
	 */
	async checkServiceNaming() {
		this.log("Checking service naming...");

		const services = [
			{
				name: "file-watcher",
				cliCommand: ["daemon", "watcher"], // Multiple acceptable
				directory: "src/daemon",
				pidFile: ".amalfa/runtime/daemon.pid",
			},
			{
				name: "vector",
				cliCommand: ["vector"],
				directory: "src/resonance/services",
				pidFile: ".amalfa/runtime/vector-daemon.pid",
			},
			{
				name: "sonar",
				cliCommand: ["sonar"],
				directory: "src/daemon",
				pidFile: ".amalfa/runtime/sonar.pid",
			},
		];

		for (const service of services) {
			// Check CLI command exists
			const cliSource = readFileSync("src/cli.ts", "utf-8");
			const hasCommand = service.cliCommand.some((cmd) =>
				cliSource.includes(`case "${cmd}":`),
			);

			if (!hasCommand) {
				this.addIssue({
					severity: "error",
					category: "service-naming",
					message: `Service ${service.name} missing CLI command`,
					location: "src/cli.ts",
					suggestion: `Add case for ${service.cliCommand.join(" or ")}`,
				});
			} else {
				this.passCheck("service-naming");
			}

			// Check directory exists
			if (!existsSync(service.directory)) {
				this.addIssue({
					severity: "warning",
					category: "service-naming",
					message: `Service ${service.name} directory missing`,
					location: service.directory,
					suggestion: `Create directory or update service config`,
				});
			} else {
				this.passCheck("service-naming");
			}
		}
	}

	/**
	 * Check 4: Config schema consistency
	 */
	async checkConfigSchema() {
		this.log("Checking config schema...");

		// Check if example config exists
		const exampleExists = existsSync("amalfa.config.example.json");
		if (!exampleExists) {
			this.addIssue({
				severity: "warning",
				category: "config-schema",
				message: "Missing amalfa.config.example.json",
				location: "Project root",
				suggestion: "Create example config from amalfa.config.json",
			});
		} else {
			this.passCheck("config-schema");
		}

		// Check actual config exists
		const configExists = existsSync("amalfa.config.json");
		if (!configExists) {
			this.addIssue({
				severity: "info",
				category: "config-schema",
				message: "No amalfa.config.json (optional)",
				location: "Project root",
			});
		} else {
			this.passCheck("config-schema");
		}

		// TODO: Compare keys between example and schema definition
		// Would need to parse TypeScript type definitions from src/config/defaults.ts
	}

	/**
	 * Check 5: Documentation cross-references
	 */
	async checkCrossReferences() {
		this.log("Checking cross-references...");

		const docs = [
			"README.md",
			"WARP.md",
			"docs/MCP-TOOLS.md",
			"docs/ARCHITECTURE.md",
		];

		for (const doc of docs) {
			if (!existsSync(doc)) {
				this.addIssue({
					severity: "error",
					category: "cross-references",
					message: `Missing core documentation file: ${doc}`,
					location: doc,
					suggestion: "Create missing documentation file",
				});
				continue;
			}

			const content = readFileSync(doc, "utf-8");

			// Check for markdown links: [text](path)
			const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
			const links = [...content.matchAll(linkPattern)];

			for (const link of links) {
				const target = link[2];
				if (!target) continue;

				// Skip external URLs
				if (target.startsWith("http://") || target.startsWith("https://")) {
					continue;
				}

				// Skip anchors
				if (target.startsWith("#")) {
					continue;
				}

				// Check if target exists
				const targetPath = target.split("#")[0]; // Remove anchor
				if (targetPath && !existsSync(targetPath)) {
					this.addIssue({
						severity: "error",
						category: "cross-references",
						message: `Broken link to '${targetPath}'`,
						location: `${doc}`,
						suggestion: "Update or remove broken link",
					});
				} else {
					this.passCheck("cross-references");
				}
			}
		}
	}

	/**
	 * Check 6: Legacy command references
	 */
	async checkLegacyCommands() {
		this.log("Checking for legacy commands...");

		const legacyPatterns = [
			{
				pattern: /bun run scripts\/cli\/ingest\.ts/g,
				correct: "amalfa init",
				description: "Legacy ingest script",
			},
			{
				pattern: /rm -rf \.amalfa\/(?!\s*#)/g, // Not followed by comment
				correct: "rm .amalfa/resonance.db*",
				description: "Excessive nuke-and-pave",
			},
		];

		const docs = [
			"README.md",
			"WARP.md",
			"docs/MCP-TOOLS.md",
			"docs/ARCHITECTURE.md",
		];

		for (const doc of docs) {
			if (!existsSync(doc)) continue;

			const content = readFileSync(doc, "utf-8");

			for (const legacy of legacyPatterns) {
				const matches = content.match(legacy.pattern);
				if (matches) {
					this.addIssue({
						severity: "warning",
						category: "legacy-commands",
						message: `Found ${legacy.description} in ${doc}`,
						location: doc,
						suggestion: `Replace with: ${legacy.correct}`,
					});
				} else {
					this.passCheck("legacy-commands");
				}
			}
		}
	}

	/**
	 * Generate final report
	 */
	generateReport(): ConsistencyReport {
		const checksFailed = this.checksRun - this.checksPassed;
		const overallScore =
			this.checksRun > 0
				? Math.round((this.checksPassed / this.checksRun) * 100)
				: 100;

		// Get git metadata
		let gitCommit: string | undefined;
		let gitBranch: string | undefined;

		try {
			gitCommit = execSync("git rev-parse --short HEAD", {
				encoding: "utf-8",
			}).trim();
			gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
				encoding: "utf-8",
			}).trim();
		} catch {
			// Git not available or not in repo
		}

		// Build category breakdown
		const categories: ConsistencyReport["categories"] = {};
		for (const [name, stats] of this.categories.entries()) {
			const total = stats.passed + stats.failed;
			categories[name] = {
				...stats,
				score: total > 0 ? Math.round((stats.passed / total) * 100) : 100,
			};
		}

		return {
			timestamp: new Date().toISOString(),
			overall_score: overallScore,
			checks_passed: this.checksPassed,
			checks_failed: checksFailed,
			checks_total: this.checksRun,
			issues: this.issues,
			categories,
			metadata: {
				version: "1.4.3", // TODO: Read from package.json
				git_commit: gitCommit,
				git_branch: gitBranch,
			},
		};
	}

	/**
	 * Run all checks
	 */
	async runAll() {
		await this.checkCliCommands();
		await this.checkFilePaths();
		await this.checkServiceNaming();
		await this.checkConfigSchema();
		await this.checkCrossReferences();
		await this.checkLegacyCommands();

		return this.generateReport();
	}
}

/**
 * Main execution
 */
async function main() {
	const args = process.argv.slice(2);
	const jsonOutput = args.includes("--json");
	const verbose = args.includes("--verbose") || args.includes("-v");

	const checker = new ConsistencyChecker(verbose);

	if (!jsonOutput) {
		console.log("🔍 Running Amalfa Consistency Checks...\n");
	}

	const report = await checker.runAll();

	if (jsonOutput) {
		// Pure JSON output for dashboard integration
		console.log(JSON.stringify(report, null, 2));
	} else {
		// Human-readable output
		console.log("\n📊 Consistency Report");
		console.log("=".repeat(50));
		console.log(`Overall Score: ${report.overall_score}% ✨`);
		console.log(
			`Checks: ${report.checks_passed} passed, ${report.checks_failed} failed (${report.checks_total} total)`,
		);

		if (report.metadata.git_commit) {
			console.log(`Git: ${report.metadata.git_branch}@${report.metadata.git_commit}`);
		}

		console.log("\n📋 Category Breakdown:");
		for (const [name, stats] of Object.entries(report.categories)) {
			const emoji = stats.score === 100 ? "✅" : stats.score >= 50 ? "⚠️" : "❌";
			console.log(
				`  ${emoji} ${name}: ${stats.score}% (${stats.passed}/${stats.passed + stats.failed})`,
			);
		}

		if (report.issues.length > 0) {
			console.log(`\n🚨 Issues Found (${report.issues.length}):\n`);

			const errorCount = report.issues.filter((i) => i.severity === "error")
				.length;
			const warningCount = report.issues.filter(
				(i) => i.severity === "warning",
			).length;

			if (errorCount > 0) {
				console.log(`❌ Errors (${errorCount}):`);
				report.issues
					.filter((i) => i.severity === "error")
					.forEach((issue, idx) => {
						console.log(`  ${idx + 1}. ${issue.message}`);
						if (issue.location)
							console.log(`     Location: ${issue.location}`);
						if (issue.suggestion)
							console.log(`     Fix: ${issue.suggestion}`);
						console.log();
					});
			}

			if (warningCount > 0) {
				console.log(`⚠️  Warnings (${warningCount}):`);
				report.issues
					.filter((i) => i.severity === "warning")
					.forEach((issue, idx) => {
						console.log(`  ${idx + 1}. ${issue.message}`);
						if (issue.location)
							console.log(`     Location: ${issue.location}`);
						if (issue.suggestion)
							console.log(`     Fix: ${issue.suggestion}`);
						console.log();
					});
			}
		} else {
			console.log("\n✅ No issues found! Codebase is consistent.");
		}

		console.log("\n" + "=".repeat(50));

		// Exit with error code if critical issues found
		const criticalIssues = report.issues.filter(
			(i) => i.severity === "error",
		).length;
		if (criticalIssues > 0) {
			console.log(
				`\n❌ Found ${criticalIssues} critical issue(s). Fix before release.`,
			);
			process.exit(1);
		}

		if (report.overall_score < 80) {
			console.log(
				`\n⚠️  Consistency score below 80%. Consider fixing warnings.`,
			);
			process.exit(1);
		}

		console.log("\n✅ Consistency check passed!");
	}
}

// Run if called directly
if (import.meta.main) {
	main().catch((error) => {
		console.error("❌ Fatal error:", error);
		process.exit(1);
	});
}

export { ConsistencyChecker, type ConsistencyReport, type ConsistencyIssue };
