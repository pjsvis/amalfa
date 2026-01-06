#!/usr/bin/env bun
/**
 * Root Documentation Organizer
 *
 * Scans root directory for documentation files and organizes them properly:
 * - Keep: README.md, LICENSE, .md files that must stay in root
 * - Move to docs/: Analysis files, walkthroughs, reviews, prompts
 * - Archive: Temporary/completed task docs
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	statSync,
} from "node:fs";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const DOCS_DIR = join(ROOT_DIR, "docs");
const _ARCHIVE_DIR = join(DOCS_DIR, "archive");

// Files that MUST stay in root
const KEEP_IN_ROOT = new Set([
	"README.md",
	"LICENSE.md",
	"LICENSE",
	"CHANGELOG.md",
	"CONTRIBUTING.md",
	"CODE_OF_CONDUCT.md",
	"SECURITY.md",
	"AGENTS.md", // Core operational protocols
	"_CURRENT-PROJECT-STATE.md", // Active state document
	"_CURRENT_TASK.md", // Active task tracking
]);

// Patterns for categorization
const CATEGORIES = {
	analysis: /^(CDA_|ORPHAN_|PERSONA_).*ANALYSIS/i,
	walkthrough: /^walkthrough/i,
	review: /review|summary/i,
	prompt: /prompt/i,
	staging: /^_staging|^TEMP/i,
	plan: /implementation_plan|final_review/i,
	claude: /^CLAUDE\.md$/i,
};

interface MoveCandidate {
	filename: string;
	category: string;
	destination: string;
	reason: string;
}

function categorizeFile(filename: string): {
	category: string;
	subdirectory: string;
} | null {
	// Keep in root
	if (KEEP_IN_ROOT.has(filename)) {
		return null;
	}

	// Check patterns
	if (CATEGORIES.analysis.test(filename)) {
		return { category: "analysis", subdirectory: "analysis" };
	}
	if (CATEGORIES.walkthrough.test(filename)) {
		return { category: "walkthrough", subdirectory: "walkthroughs" };
	}
	if (CATEGORIES.staging.test(filename)) {
		return { category: "staging", subdirectory: "archive" };
	}
	if (CATEGORIES.plan.test(filename)) {
		return { category: "completed-task", subdirectory: "archive" };
	}
	if (CATEGORIES.review.test(filename)) {
		return { category: "review", subdirectory: "reviews" };
	}
	if (CATEGORIES.prompt.test(filename)) {
		return { category: "prompt", subdirectory: "prompts" };
	}
	if (CATEGORIES.claude.test(filename)) {
		return { category: "agent-note", subdirectory: "archive" };
	}

	// Default: move to docs root
	return { category: "general-doc", subdirectory: "" };
}

function analyzeRootDocs(): MoveCandidate[] {
	const files = readdirSync(ROOT_DIR).filter(
		(f) => f.endsWith(".md") && statSync(join(ROOT_DIR, f)).isFile(),
	);

	const candidates: MoveCandidate[] = [];

	for (const filename of files) {
		const categorization = categorizeFile(filename);

		if (!categorization) {
			continue; // Keep in root
		}

		const destDir = categorization.subdirectory
			? join(DOCS_DIR, categorization.subdirectory)
			: DOCS_DIR;

		const destination = join(destDir, filename);

		candidates.push({
			filename,
			category: categorization.category,
			destination: destination.replace(`${ROOT_DIR}/`, ""),
			reason: `${categorization.category} document`,
		});
	}

	return candidates;
}

function ensureDirectories(candidates: MoveCandidate[]) {
	const dirs = new Set(
		candidates.map((c) =>
			join(ROOT_DIR, c.destination.split("/").slice(0, -1).join("/")),
		),
	);

	for (const dir of dirs) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
			console.log(`📁 Created directory: ${dir.replace(`${ROOT_DIR}/`, "")}`);
		}
	}
}

function main() {
	console.log("🔍 Scanning root directory for documentation files...\n");

	const candidates = analyzeRootDocs();

	if (candidates.length === 0) {
		console.log("✅ Root directory is already clean!");
		return;
	}

	console.log(`Found ${candidates.length} files to organize:\n`);

	// Group by category
	const byCategory = new Map<string, MoveCandidate[]>();
	for (const candidate of candidates) {
		const existing = byCategory.get(candidate.category) || [];
		existing.push(candidate);
		byCategory.set(candidate.category, existing);
	}

	// Display organized by category
	for (const [category, files] of byCategory) {
		console.log(`\n📦 ${category.toUpperCase()}`);
		for (const file of files) {
			console.log(`   ${file.filename}`);
			console.log(`   → ${file.destination}`);
		}
	}

	console.log("\n");

	// Confirm with user
	const readline = require("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question("Proceed with reorganization? (y/n): ", (answer: string) => {
		if (answer.toLowerCase() === "y") {
			console.log("\n🔧 Reorganizing files...\n");

			// Ensure directories exist
			ensureDirectories(candidates);

			// Move files
			for (const candidate of candidates) {
				const oldPath = join(ROOT_DIR, candidate.filename);
				const newPath = join(ROOT_DIR, candidate.destination);

				try {
					renameSync(oldPath, newPath);
					console.log(`✅ ${candidate.filename} → ${candidate.destination}`);
				} catch (error) {
					console.error(`❌ Failed to move ${candidate.filename}:`, error);
				}
			}

			console.log("\n✨ Done!");
			console.log(
				"\n💡 Don't forget to update any references to these files in documentation.",
			);
		} else {
			console.log("\n❌ Cancelled.");
		}

		rl.close();
	});
}

if (import.meta.main) {
	main();
}
