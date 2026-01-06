#!/usr/bin/env bun
/**
 * Territory Mapper: Briefs vs Debriefs (Filesystem-Based)
 *
 * Uses filesystem heuristics to determine:
 * - Which briefs have debriefs (completed → can archive)
 * - Which briefs are pending (no debrief → stay in pending/)
 * - File organization status
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Configuration
const BRIEFS_DIR = "briefs";
const DEBRIEFS_DIR = "debriefs";

interface Brief {
	id: string; // brief-xxx
	file: string; // Full path
	title: string; // From frontmatter
	location: string; // root/, pending/, holding/
	hasDebrief: boolean;
	debriefFile?: string;
	debriefDate?: string;
}

/**
 * Extract title from markdown frontmatter
 */
function getTitle(content: string): string {
	const match = content.match(/^title:\s*(.+)$/m);
	return match?.[1]?.trim() ?? "";
}

/**
 * Get all brief files from filesystem with metadata
 */
function getBriefs(): Brief[] {
	const briefs: Brief[] = [];

	function scanDirectory(dirPath: string, location: string) {
		if (!existsSync(dirPath)) return;

		for (const file of readdirSync(dirPath)) {
			if (!file.startsWith("brief-") || !file.endsWith(".md")) continue;

			const fullPath = join(dirPath, file);
			const content = readFileSync(fullPath, "utf-8");
			const title = getTitle(content);

			// Check for corresponding debrief
			// Debriefs are named YYYY-MM-DD-slug.md
			// Briefs are named brief-slug.md
			const slug = file.replace(/^brief-/, "").replace(/\.md$/, "");
			const debriefFile = findDebrief(slug);

			briefs.push({
				id: file.replace(/\.md$/, ""),
				file: fullPath,
				title,
				location,
				hasDebrief: !!debriefFile,
				debriefFile: debriefFile || undefined,
				debriefDate: debriefFile?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1],
			});
		}
	}

	// Scan root level
	scanDirectory(BRIEFS_DIR, "root/");

	// Scan pending/
	scanDirectory(join(BRIEFS_DIR, "pending"), "pending/");

	// Scan holding/
	scanDirectory(join(BRIEFS_DIR, "holding"), "holding/");

	return briefs;
}

/**
 * Find debrief matching a brief slug
 */
function findDebrief(slug: string): string | null {
	if (!existsSync(DEBRIEFS_DIR)) return null;

	const debriefs = readdirSync(DEBRIEFS_DIR);

	// Look for debrief containing the slug
	// e.g., "brief-slab-grid" → "2025-12-29-slab-grid-implementation"
	const match = debriefs.find((d) => d.includes(slug) && d.endsWith(".md"));

	return match || null;
}

/**
 * Main mapping function
 */
function mapTerritory() {
	console.log("🗺️  Mapping Briefs Territory (Filesystem-Based)\n");

	const briefs = getBriefs();

	// Categorize
	const completed = briefs.filter((b) => b.hasDebrief);
	const pending = briefs.filter((b) => !b.hasDebrief);
	const inRoot = briefs.filter((b) => b.location === "root/");
	const inPending = briefs.filter((b) => b.location === "pending/");
	const inHolding = briefs.filter((b) => b.location === "holding/");

	console.log(`📊 Statistics:`);
	console.log(`   Total briefs: ${briefs.length}`);
	console.log(`   Completed (has debrief): ${completed.length}`);
	console.log(`   Pending (no debrief): ${pending.length}`);
	console.log(`   In root/: ${inRoot.length}`);
	console.log(`   In pending/: ${inPending.length}`);
	console.log(`   In holding/: ${inHolding.length}\n`);

	// Report: Completed briefs that should be archived
	console.log(`✅ COMPLETED (${completed.length}): Should be in archive/`);
	console.log(`─`.repeat(80));
	if (completed.length === 0) {
		console.log("   (none)");
	} else {
		for (const brief of completed.sort((a, b) =>
			(b.debriefDate || "").localeCompare(a.debriefDate || ""),
		)) {
			console.log(`   ${brief.id}`);
			console.log(`   → Title: ${brief.title || "(no title)"}`);
			console.log(`   → Debrief: ${brief.debriefFile} (${brief.debriefDate})`);
			console.log(`   → Location: ${brief.location}`);
			console.log();
		}
	}

	// Report: Pending briefs
	console.log(`⏳ PENDING (${pending.length}): Keep in pending/`);
	console.log(`─`.repeat(80));
	if (pending.length === 0) {
		console.log("   (none)");
	} else {
		for (const brief of pending) {
			console.log(`   ${brief.id}`);
			console.log(`   → Title: ${brief.title || "(no title)"}`);
			console.log(`   → Location: ${brief.location}`);
		}
	}

	// Report: Files in wrong location
	const inRootPending = inRoot.filter((b) => !b.hasDebrief);
	const inHoldingPending = inHolding.filter((b) => !b.hasDebrief);

	if (inRootPending.length > 0 || inHoldingPending.length > 0) {
		console.log(
			`\n📁 MISPLACED (${inRootPending.length + inHoldingPending.length}): Should be in pending/`,
		);
		console.log(`─`.repeat(80));

		if (inRootPending.length > 0) {
			console.log(`\n   In root/ (should move to pending/):`);
			for (const brief of inRootPending) {
				console.log(`   → ${brief.id}`);
			}
		}

		if (inHoldingPending.length > 0) {
			console.log(`\n   In holding/ (should move to pending/):`);
			for (const brief of inHoldingPending) {
				console.log(`   → ${brief.id}: ${brief.title || "(no title)"}`);
			}
		}
	}

	console.log(`\n${"═".repeat(80)}`);

	// Summary & Recommendations
	console.log(`\n📈 SUMMARY:`);
	console.log(`   Total briefs: ${briefs.length}`);
	console.log(`   Completed (ready for archive): ${completed.length}`);
	console.log(`   Pending (keep in pending/): ${pending.length}`);
	console.log(
		`   In wrong location: ${inRootPending.length + inHoldingPending.length}`,
	);

	console.log(`\n💡 RECOMMENDATIONS:`);

	if (completed.length > 0) {
		console.log(`   1. Move ${completed.length} completed briefs to archive/`);
		console.log(`      (They have corresponding debriefs)`);
	}

	if (inRootPending.length > 0) {
		console.log(
			`   2. Move ${inRootPending.length} pending briefs from root/ to pending/`,
		);
	}

	if (inHoldingPending.length > 0) {
		console.log(`   3. Decide: holding/ has ${inHoldingPending.length} briefs`);
		console.log(`      → Move to pending/ if active`);
		console.log(`      → Delete if obsolete`);
	}

	// Generate move commands
	if (inRootPending.length > 0 || completed.length > 0) {
		console.log(`\n🔧 SUGGESTED MOVES:\n`);

		if (inRootPending.length > 0) {
			console.log(`# Move pending briefs to pending/:`);
			for (const brief of inRootPending) {
				const fileName = brief.file.split("/").pop()!;
				console.log(`mv "${brief.file}" "briefs/pending/${fileName}"`);
			}
			console.log();
		}

		if (completed.length > 0) {
			console.log(`# Move completed briefs to archive/:`);
			for (const brief of completed) {
				const fileName = brief.file.split("/").pop()!;
				console.log(`mv "${brief.file}" "briefs/archive/${fileName}"`);
			}
		}
	}
}

// Run
mapTerritory();
