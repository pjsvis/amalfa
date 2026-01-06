#!/usr/bin/env node

/**
 * CSS Variables Validation Script
 *
 * Validates CSS files against Zero Magic principles:
 * - No hardcoded colors in component CSS
 * - Consistent variable naming
 * - Proper theme.css usage
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const CSS_DIR = "src/css";
const _THEME_FILE = join(CSS_DIR, "layers/theme.css");

// Validation rules
const RULES = {
	// Hardcoded colors (hex, rgb, hsl, named colors)
	hardcodedColors:
		/#[0-9a-fA-F]{3,8}|\brgb\(|hsl\(|rgba\(|hsla\(|red|blue|green|yellow|black|white|gray|grey\b/g,

	// Hardcoded pixel values (except in theme.css)
	hardcodedPixels: /\b\d+px\b/g,

	// Inconsistent spacing variables
	mixedSpacing: /--spacing-\d+/g, // Should use --size-*

	// Magic numbers (arbitrary decimals)
	magicNumbers: /\b0\.\d{2,}\b/g,

	// Missing var() wrapper
	unwrappedVariables: /--[a-zA-Z-]+(?![;\s])/g,
};

// Files to exclude from strict validation
const EXCLUDED_FILES = [
	"theme.css", // Allowed to have raw values
	"utilities.css", // Debug utilities may need !important
];

function validateFile(filePath) {
	const content = readFileSync(filePath, "utf8");
	const filename = filePath.split("/").pop();
	const isExcluded = EXCLUDED_FILES.some((ex) => filename.includes(ex));

	const issues = [];

	// Check for hardcoded colors (except in theme.css)
	if (!isExcluded) {
		const colorMatches = content.match(RULES.hardcodedColors);
		if (colorMatches) {
			issues.push({
				rule: "hardcoded-colors",
				message: `Found hardcoded colors: ${colorMatches.join(", ")}`,
				severity: "error",
				suggestion:
					"Use semantic color variables from theme.css (e.g., var(--surface-2))",
			});
		}
	}

	// Check for hardcoded pixels (except in theme.css)
	if (!isExcluded) {
		const pixelMatches = content.match(RULES.hardcodedPixels);
		if (pixelMatches) {
			issues.push({
				rule: "hardcoded-pixels",
				message: `Found hardcoded pixel values: ${pixelMatches.slice(0, 5).join(", ")}${pixelMatches.length > 5 ? "..." : ""}`,
				severity: "warning",
				suggestion: "Use --size-* variables from theme.css",
			});
		}
	}

	// Check for mixed spacing variables
	const spacingMatches = content.match(RULES.mixedSpacing);
	if (spacingMatches) {
		issues.push({
			rule: "mixed-spacing",
			message: `Found --spacing-* variables: ${spacingMatches.join(", ")}`,
			severity: "warning",
			suggestion: "Use --size-* variables for consistency with Open Props",
		});
	}

	// Check for magic numbers
	const magicMatches = content.match(RULES.magicNumbers);
	if (magicMatches) {
		issues.push({
			rule: "magic-numbers",
			message: `Found magic numbers: ${magicMatches.slice(0, 3).join(", ")}${magicMatches.length > 3 ? "..." : ""}`,
			severity: "info",
			suggestion: "Consider extracting to theme.css as semantic variables",
		});
	}

	// Check for unwrapped CSS variables
	const unwrappedMatches = content.match(RULES.unwrappedVariables);
	if (unwrappedMatches) {
		// Filter out actual CSS variable declarations
		const actualUnwrapped = unwrappedMatches.filter(
			(match) =>
				!content.includes(`${match}:`) && !content.includes(`${match} `),
		);
		if (actualUnwrapped.length > 0) {
			issues.push({
				rule: "unwrapped-variables",
				message: `Found unwrapped CSS variables: ${actualUnwrapped.slice(0, 3).join(", ")}`,
				severity: "warning",
				suggestion: "Wrap in var() function: var(--variable-name)",
			});
		}
	}

	return issues;
}

function validateDirectory(dirPath) {
	const files = readdirSync(dirPath);
	const allIssues = [];

	for (const file of files) {
		const filePath = join(dirPath, file);
		const stat = statSync(filePath);

		if (stat.isDirectory()) {
			allIssues.push(...validateDirectory(filePath));
		} else if (extname(file) === ".css") {
			const issues = validateFile(filePath);
			if (issues.length > 0) {
				allIssues.push({
					file: filePath,
					issues,
				});
			}
		}
	}

	return allIssues;
}

function printReport(issues) {
	if (issues.length === 0) {
		console.log("✅ CSS validation passed! No issues found.");
		return;
	}

	console.log("🚨 CSS Validation Issues Found:\n");

	for (const fileIssue of issues) {
		console.log(`📁 ${fileIssue.file}:`);
		for (const issue of fileIssue.issues) {
			const icon =
				issue.severity === "error"
					? "❌"
					: issue.severity === "warning"
						? "⚠️"
						: "ℹ️";
			console.log(`  ${icon} ${issue.rule}: ${issue.message}`);
			console.log(`    💡 ${issue.suggestion}`);
		}
		console.log("");
	}

	const errorCount = issues.reduce(
		(sum, file) =>
			sum + file.issues.filter((i) => i.severity === "error").length,
		0,
	);
	const warningCount = issues.reduce(
		(sum, file) =>
			sum + file.issues.filter((i) => i.severity === "warning").length,
		0,
	);

	console.log(`📊 Summary: ${errorCount} errors, ${warningCount} warnings`);

	if (errorCount > 0) {
		console.log(
			"❌ Validation failed due to errors. Please fix before committing.",
		);
		process.exit(1);
	} else {
		console.log("✅ Validation passed (warnings are informational).");
	}
}

// Main execution
try {
	console.log("🔍 Validating CSS files against Zero Magic principles...\n");
	const issues = validateDirectory(CSS_DIR);
	printReport(issues);
} catch (error) {
	console.error("❌ Validation script failed:", error.message);
	process.exit(1);
}
