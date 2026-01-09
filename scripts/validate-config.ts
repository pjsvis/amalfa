#!/usr/bin/env bun
/**
 * Configuration Validation Script
 * Detects conflicts between amalfa.config.json and polyvis.settings.json
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

interface ValidationIssue {
	severity: "error" | "warning" | "info";
	category: string;
	message: string;
	details?: string;
}

const issues: ValidationIssue[] = [];

async function main() {
	console.log("🔍 Validating AMALFA configuration...\n");

	// Load both configs
	const amalfaConfigPath = join(process.cwd(), "amalfa.config.json");
	const polyvisConfigPath = join(process.cwd(), "polyvis.settings.json");

	if (!existsSync(amalfaConfigPath)) {
		issues.push({
			severity: "warning",
			category: "missing-config",
			message: "amalfa.config.json not found",
			details: "Will use default configuration",
		});
	}

	if (!existsSync(polyvisConfigPath)) {
		issues.push({
			severity: "info",
			category: "missing-config",
			message: "polyvis.settings.json not found",
			details: "This is expected for new installations",
		});
	}

	let amalfaConfig: any = null;
	let polyvisConfig: any = null;

	try {
		if (existsSync(amalfaConfigPath)) {
			amalfaConfig = await Bun.file(amalfaConfigPath).json();
		}
	} catch (e) {
		issues.push({
			severity: "error",
			category: "parse-error",
			message: "Failed to parse amalfa.config.json",
			details: e instanceof Error ? e.message : String(e),
		});
	}

	try {
		if (existsSync(polyvisConfigPath)) {
			polyvisConfig = await Bun.file(polyvisConfigPath).json();
		}
	} catch (e) {
		issues.push({
			severity: "error",
			category: "parse-error",
			message: "Failed to parse polyvis.settings.json",
			details: e instanceof Error ? e.message : String(e),
		});
	}

	// Run validation checks
	if (amalfaConfig && polyvisConfig) {
		validateDatabasePaths(amalfaConfig, polyvisConfig);
		validateEmbeddingModels(amalfaConfig, polyvisConfig);
		validateSourceDirectories(amalfaConfig, polyvisConfig);
		checkDeprecatedUsage(polyvisConfig);
	}

	// Print results
	printResults();

	// Exit with error code if any errors found
	const hasErrors = issues.some((i) => i.severity === "error");
	process.exit(hasErrors ? 1 : 0);
}

function validateDatabasePaths(amalfa: any, polyvis: any) {
	const amalfaDb = amalfa.database;
	const polyvisDb = polyvis.paths?.database?.resonance;

	if (amalfaDb && polyvisDb) {
		// Check if they're different
		if (amalfaDb !== polyvisDb) {
			issues.push({
				severity: "warning",
				category: "database-path",
				message: "Different database paths configured",
				details: `amalfa.config.json: "${amalfaDb}"\npolyvis.settings.json: "${polyvisDb}"`,
			});
		}

		// Check if both database files exist
		const amalfaDbPath = join(process.cwd(), amalfaDb);
		const polyvisDbPath = join(process.cwd(), polyvisDb);

		const amalfaExists = existsSync(amalfaDbPath);
		const polyvisExists = existsSync(polyvisDbPath);

		if (amalfaExists && polyvisExists) {
			issues.push({
				severity: "error",
				category: "database-conflict",
				message: "Multiple database files exist",
				details: "Two separate databases detected - data may be inconsistent",
			});
		}
	}
}

function validateEmbeddingModels(amalfa: any, _polyvis: any) {
	const amalfaModel = amalfa.embeddings?.model;
	const amalfaDims = amalfa.embeddings?.dimensions;

	// polyvis.settings.json doesn't currently define embedding model
	// This is INFO only - showing which config controls embeddings
	if (amalfaModel) {
		issues.push({
			severity: "info",
			category: "embeddings",
			message: "Embedding model configuration",
			details: `Model: ${amalfaModel} (${amalfaDims}d)\nControlled by: amalfa.config.json`,
		});
	}
}

function validateSourceDirectories(amalfa: any, polyvis: any) {
	const amalfaSources = amalfa.sources || [];
	const polyvisSources =
		polyvis.paths?.sources?.experience?.map((s: any) => s.path) || [];

	// These configs serve different purposes, so this is INFO only
	if (amalfaSources.length > 0 || polyvisSources.length > 0) {
		issues.push({
			severity: "info",
			category: "sources",
			message: "Source directory configuration",
			details: `amalfa.config.json (MCP ingestion): ${amalfaSources.join(", ") || "none"}\npolyvis.settings.json (legacy): ${polyvisSources.join(", ") || "none"}`,
		});
	}

	// Check for non-existent directories
	for (const source of amalfaSources) {
		const sourcePath = join(process.cwd(), source);
		if (!existsSync(sourcePath)) {
			issues.push({
				severity: "warning",
				category: "missing-source",
				message: `Source directory not found: ${source}`,
				details: "MCP server will skip this directory",
			});
		}
	}
}

function checkDeprecatedUsage(polyvis: any) {
	// Check if any code is actively using polyvis.settings.json
	if (polyvis && !polyvis._comment?.includes("DEPRECATED")) {
		issues.push({
			severity: "warning",
			category: "deprecated-config",
			message: "polyvis.settings.json missing deprecation notice",
			details:
				"This config is deprecated but not marked. See docs/CONFIG_UNIFICATION.md",
		});
	}
}

function printResults() {
	const errors = issues.filter((i) => i.severity === "error");
	const warnings = issues.filter((i) => i.severity === "warning");
	const infos = issues.filter((i) => i.severity === "info");

	if (errors.length > 0) {
		console.log("❌ ERRORS:\n");
		for (const issue of errors) {
			console.log(`  [${issue.category}] ${issue.message}`);
			if (issue.details) {
				console.log(`  ${issue.details.replace(/\n/g, "\n  ")}\n`);
			}
		}
	}

	if (warnings.length > 0) {
		console.log("⚠️  WARNINGS:\n");
		for (const issue of warnings) {
			console.log(`  [${issue.category}] ${issue.message}`);
			if (issue.details) {
				console.log(`  ${issue.details.replace(/\n/g, "\n  ")}\n`);
			}
		}
	}

	if (infos.length > 0) {
		console.log("ℹ️  INFO:\n");
		for (const issue of infos) {
			console.log(`  [${issue.category}] ${issue.message}`);
			if (issue.details) {
				console.log(`  ${issue.details.replace(/\n/g, "\n  ")}\n`);
			}
		}
	}

	if (issues.length === 0) {
		console.log("✅ No configuration issues detected\n");
	} else {
		console.log(
			`\nSummary: ${errors.length} error(s), ${warnings.length} warning(s), ${infos.length} info message(s)`,
		);
	}
}

main();
