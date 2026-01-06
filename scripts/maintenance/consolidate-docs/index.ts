#!/usr/bin/env bun
/**
 * Documentation Consolidation Script
 *
 * PURPOSE:
 * Consolidates documentation into a clear structure:
 * - docs/webdocs/ = Technical reference documentation
 * - docs/architecture/ = System design docs (unchanged)
 *
 * WHAT IT DOES:
 * 1. Creates docs/webdocs/ directory
 * 2. Moves all .md files from docs/ root → docs/webdocs/
 * 3. Moves all files from public/docs/vectra-docs/ → docs/webdocs/
 * 4. Removes empty vectra-docs directory
 * 5. Leaves public/docs/ structure intact (website content)
 *
 * WHAT IT DOES NOT DO:
 * - Does NOT modify public/docs/ (website content stays)
 * - Does NOT modify docs/architecture/ (stays as-is)
 * - Does NOT update code references (done separately)
 *
 * RESULT:
 * docs/
 * ├── README.md (explains structure)
 * ├── webdocs/ (25-30 files: all technical docs + vectra legacy)
 * └── architecture/ (unchanged)
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	renameSync,
	rmdirSync,
	statSync,
} from "node:fs";
import { join } from "node:path";
import settings from "@/polyvis.settings.json";

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, settings.paths.docs.root);
const WEBDOCS_DIR = join(ROOT, settings.paths.docs.webdocs);
const PUBLIC_DOCS = join(ROOT, settings.paths.docs.public);
const PUBLIC_VECTRA = join(PUBLIC_DOCS, "vectra-docs");

interface MoveOperation {
	source: string;
	destination: string;
	type: "file" | "directory";
}

function analyzeMoves(): MoveOperation[] {
	const operations: MoveOperation[] = [];

	// 1. Find all .md files in docs/ root (not subdirectories)
	const docsFiles = readdirSync(DOCS_DIR).filter((f) => {
		const fullPath = join(DOCS_DIR, f);
		return statSync(fullPath).isFile() && f.endsWith(".md");
	});

	for (const file of docsFiles) {
		operations.push({
			source: join(DOCS_DIR, file),
			destination: join(WEBDOCS_DIR, file),
			type: "file",
		});
	}

	// 2. Find all files in public/docs/vectra-docs/
	if (existsSync(PUBLIC_VECTRA)) {
		const vectraFiles = readdirSync(PUBLIC_VECTRA);
		for (const file of vectraFiles) {
			const fullPath = join(PUBLIC_VECTRA, file);
			if (statSync(fullPath).isFile()) {
				operations.push({
					source: fullPath,
					destination: join(WEBDOCS_DIR, file),
					type: "file",
				});
			}
		}
	}

	return operations;
}

function main() {
	console.log("📋 Documentation Consolidation Script\n");

	// Analyze what will be moved
	const operations = analyzeMoves();

	console.log(`Found ${operations.length} files to consolidate:\n`);

	// Group by source directory
	const fromDocs = operations.filter((op) => op.source.startsWith(DOCS_DIR));
	const fromVectra = operations.filter((op) =>
		op.source.startsWith(PUBLIC_VECTRA),
	);

	console.log(`📁 From docs/ → docs/webdocs/ (${fromDocs.length} files):`);
	fromDocs.slice(0, 5).forEach((op) => {
		console.log(`   ${op.source.replace(`${ROOT}/`, "")}`);
	});
	if (fromDocs.length > 5) {
		console.log(`   ... and ${fromDocs.length - 5} more`);
	}

	console.log(
		`\n📁 From public/docs/vectra-docs/ → docs/webdocs/ (${fromVectra.length} files):`,
	);
	fromVectra.slice(0, 5).forEach((op) => {
		console.log(`   ${op.source.replace(`${ROOT}/`, "")}`);
	});
	if (fromVectra.length > 5) {
		console.log(`   ... and ${fromVectra.length - 5} more`);
	}

	console.log("\n📝 RESULT:");
	console.log("   docs/");
	console.log("   ├── README.md (explains structure)");
	console.log(`   ├── webdocs/ (${operations.length} files)`);
	console.log("   └── architecture/ (unchanged)");

	console.log("\n⚠️  PRESERVED:");
	console.log("   public/docs/ (website content - NOT touched)");

	console.log("\n");

	// Confirm with user
	const readline = require("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question("Proceed with consolidation? (y/n): ", (answer: string) => {
		if (answer.toLowerCase() === "y") {
			console.log("\n🔧 Consolidating documentation...\n");

			// Create webdocs directory
			if (!existsSync(WEBDOCS_DIR)) {
				mkdirSync(WEBDOCS_DIR, { recursive: true });
				console.log(`✅ Created ${WEBDOCS_DIR.replace(`${ROOT}/`, "")}`);
			}

			// Move files
			let movedCount = 0;
			for (const op of operations) {
				try {
					renameSync(op.source, op.destination);
					movedCount++;
				} catch (error) {
					console.error(`❌ Failed to move ${op.source}:`, error);
				}
			}

			console.log(`\n✅ Moved ${movedCount}/${operations.length} files`);

			// Clean up empty vectra-docs directory
			if (existsSync(PUBLIC_VECTRA)) {
				try {
					const remaining = readdirSync(PUBLIC_VECTRA);
					if (remaining.length === 0) {
						rmdirSync(PUBLIC_VECTRA);
						console.log("✅ Removed empty vectra-docs directory");
					} else {
						console.log(
							`⚠️  vectra-docs not empty (${remaining.length} files remain)`,
						);
					}
				} catch (error) {
					console.warn("⚠️  Could not remove vectra-docs:", error);
				}
			}

			console.log("\n✨ Done!");
			console.log("\n📋 NEXT STEPS:");
			console.log("   1. Verify: tree docs -L 2");
			console.log("   2. Check: ls public/docs/vectra-docs (should not exist)");
			console.log("   3. Update any code references to public/docs");
			console.log(
				"   4. Search for broken links: rg 'public/docs/vectra' docs/ briefs/",
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
