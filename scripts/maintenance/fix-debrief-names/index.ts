#!/usr/bin/env bun
/**
 * Debrief Naming Convention Enforcer
 *
 * Scans debriefs/ directory and renames files to follow the convention:
 * YYYY-MM-DD-topic.md
 *
 * Extracts dates from:
 * 1. Front matter (**Date:** field)
 * 2. File modification time (fallback)
 */

import { readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { join } from "node:path";

const DEBRIEFS_DIR = join(process.cwd(), "debriefs");
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})-/;

interface RenameCandidate {
	current: string;
	proposed: string;
	date: string;
	reason: string;
}

function extractDateFromContent(filepath: string): string | null {
	try {
		const content = readFileSync(filepath, "utf-8");

		// Look for **Date:** YYYY-MM-DD pattern in first 50 lines
		const lines = content.split("\n").slice(0, 50);
		for (const line of lines) {
			const match = line.match(/\*\*Date:\*\*\s*(\d{4})-(\d{2})-(\d{2})/);
			if (match) {
				return `${match[1]}-${match[2]}-${match[3]}`;
			}
		}
		return null;
	} catch {
		return null;
	}
}

function extractDateFromMtime(filepath: string): string {
	const stats = statSync(filepath);
	const date = new Date(stats.mtime);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function analyzeDebriefs(): RenameCandidate[] {
	const files = readdirSync(DEBRIEFS_DIR).filter((f) => f.endsWith(".md"));
	const candidates: RenameCandidate[] = [];

	for (const filename of files) {
		const filepath = join(DEBRIEFS_DIR, filename);

		// Skip files that already follow convention
		if (DATE_PATTERN.test(filename)) {
			continue;
		}

		// Extract date
		let date = extractDateFromContent(filepath);
		let reason = "from content **Date:** field";

		if (!date) {
			date = extractDateFromMtime(filepath);
			reason = "from file modification time";
		}

		// Generate new name
		// Remove common prefixes like "debrief-" or "session-"
		let topic = filename
			.replace(/^debrief-/, "")
			.replace(/^session-/, "")
			.replace(/-\d{4}-\d{2}-\d{2}/, "") // Remove date if at end
			.replace(/\.md$/, "");

		topic = slugify(topic);

		const proposed = `${date}-${topic}.md`;

		candidates.push({
			current: filename,
			proposed: proposed,
			date: date,
			reason: reason,
		});
	}

	return candidates;
}

function main() {
	console.log("🔍 Scanning debriefs directory...\n");

	const candidates = analyzeDebriefs();

	if (candidates.length === 0) {
		console.log("✅ All debriefs follow naming convention!");
		return;
	}

	console.log(`Found ${candidates.length} files to rename:\n`);

	for (const candidate of candidates) {
		console.log(`📝 ${candidate.current}`);
		console.log(`   → ${candidate.proposed}`);
		console.log(`   Date: ${candidate.date} (${candidate.reason})`);
		console.log();
	}

	// Confirm with user
	const readline = require("node:readline");
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question("Proceed with renaming? (y/n): ", (answer: string) => {
		if (answer.toLowerCase() === "y") {
			console.log("\n🔧 Renaming files...\n");

			for (const candidate of candidates) {
				const oldPath = join(DEBRIEFS_DIR, candidate.current);
				const newPath = join(DEBRIEFS_DIR, candidate.proposed);

				try {
					renameSync(oldPath, newPath);
					console.log(`✅ ${candidate.current} → ${candidate.proposed}`);
				} catch (error) {
					console.error(`❌ Failed to rename ${candidate.current}:`, error);
				}
			}

			console.log("\n✨ Done!");
		} else {
			console.log("\n❌ Cancelled.");
		}

		rl.close();
	});
}

if (import.meta.main) {
	main();
}
