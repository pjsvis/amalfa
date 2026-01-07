#!/usr/bin/env bun
/**
 * Codebase Audit
 * 
 * Walks the codebase and categorizes files by:
 * - Purpose (core, docs, config, legacy, unclear)
 * - Size (flag files > 500 lines)
 * - Freshness (flag files not modified recently)
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface FileInfo {
	path: string;
	size: number;
	lines: number;
	modified: Date;
	category: string;
}

const SKIP_DIRS = [
	"node_modules",
	".git",
	".amalfa",
	"local_cache",
	".resonance/cache",
];

const CATEGORIES = {
	CORE: "Core functionality",
	DOCS: "Documentation",
	CONFIG: "Configuration",
	TEST: "Tests & scripts",
	LEGACY: "Legacy/deprecated",
	UNCLEAR: "Purpose unclear",
};

function shouldSkip(path: string): boolean {
	return SKIP_DIRS.some((dir) => path.includes(dir));
}

async function countLines(path: string): Promise<number> {
	try {
		const content = await Bun.file(path).text();
		return content.split("\n").length;
	} catch {
		return 0;
	}
}

function categorizeFile(path: string): string {
	// Core source code
	if (path.includes("/src/")) {
		if (path.includes("/mcp/")) return "Core: MCP Server";
		if (path.includes("/core/")) return "Core: Graph Engine";
		if (path.includes("/resonance/")) return "Core: Database";
		if (path.includes("/pipeline/")) return "Core: Ingestion";
		if (path.includes("/utils/")) return "Core: Utilities";
		if (path.includes("/config/")) return "Core: Config";
		if (path.includes("/daemon/")) return "Core: Daemon";
		return "Core: Other";
	}

	// Documentation
	if (path.includes("/docs/")) {
		if (path.endsWith(".pdf")) return "Docs: PDF (external)";
		if (path.endsWith(".html")) return "Docs: HTML";
		if (path.endsWith(".png")) return "Docs: Images";
		if (path.includes("DEPRECATION")) return "Docs: Deprecation";
		if (path.includes("_current-")) return "Docs: Status";
		if (path.includes("LEGACY")) return "Docs: Legacy";
		return "Docs: General";
	}

	// Playbooks
	if (path.includes("/playbooks/")) return "Docs: Playbooks";

	// Debriefs & Briefs
	if (path.includes("/debriefs/")) return "Docs: Debriefs";
	if (path.includes("/briefs/")) return "Docs: Briefs";

	// Tests and scripts
	if (path.includes("/scripts/")) {
		if (path.includes("test-")) return "Test: Scripts";
		if (path.includes("verify")) return "Test: Verification";
		if (path.includes("maintenance")) return "Scripts: Maintenance";
		if (path.includes("legacy")) return "Scripts: Legacy";
		return "Scripts: Other";
	}

	if (path.includes("/tests/")) return "Test: Unit tests";

	// Config files
	if (
		path.endsWith(".json") ||
		path.endsWith(".yaml") ||
		path.endsWith(".toml") ||
		path.includes("config")
	) {
		if (path.includes(".beads/")) return "Config: Beads (unused?)";
		if (path.includes(".claude/")) return "Config: Claude";
		return "Config: Root";
	}

	// Special files
	if (path.endsWith(".gitignore")) return "Config: Git";
	if (path.endsWith(".npmignore")) return "Config: NPM";
	if (path.endsWith(".env")) return "Config: Env";
	if (path.endsWith("README.md")) return "Docs: README";
	if (path.endsWith("package.json")) return "Config: Package";

	return "Unclear";
}

async function walkDir(dir: string, files: FileInfo[] = []): Promise<FileInfo[]> {
	try {
		const entries = readdirSync(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);
			const relativePath = fullPath.replace(process.cwd() + "/", "./");

			if (shouldSkip(relativePath)) continue;

			if (entry.isDirectory()) {
				await walkDir(fullPath, files);
			} else if (entry.isFile()) {
				const stats = statSync(fullPath);
				const lines = await countLines(fullPath);

				files.push({
					path: relativePath,
					size: stats.size,
					lines,
					modified: stats.mtime,
					category: categorizeFile(relativePath),
				});
			}
		}
	} catch (error) {
		// Skip directories we can't read
	}

	return files;
}

async function main() {
	console.log("🔍 AMALFA Codebase Audit\n");
	console.log("Scanning files...\n");

	const files = await walkDir(process.cwd());

	// Categorize
	const byCategory = new Map<string, FileInfo[]>();
	for (const file of files) {
		const existing = byCategory.get(file.category) || [];
		existing.push(file);
		byCategory.set(file.category, existing);
	}

	// Flag large files (>500 lines)
	const largeFiles = files.filter((f) => f.lines > 500).sort((a, b) => b.lines - a.lines);

	// Flag old files (not modified in 30+ days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
	const oldFiles = files.filter((f) => f.modified < thirtyDaysAgo);

	// Flag unclear files
	const unclearFiles = files.filter((f) => f.category === "Unclear");

	// Display results
	console.log("📊 Summary by Category:\n");
	const sortedCategories = Array.from(byCategory.entries()).sort(
		(a, b) => b[1].length - a[1].length,
	);

	for (const [category, categoryFiles] of sortedCategories) {
		const totalLines = categoryFiles.reduce((sum, f) => sum + f.lines, 0);
		console.log(
			`${category.padEnd(30)} ${categoryFiles.length.toString().padStart(3)} files  ${totalLines.toString().padStart(6)} lines`,
		);
	}

	// Large files
	if (largeFiles.length > 0) {
		console.log("\n\n⚠️  Large Files (>500 lines):\n");
		for (const file of largeFiles.slice(0, 20)) {
			console.log(
				`${file.lines.toString().padStart(5)} lines  ${file.path}`,
			);
		}
	}

	// Old files
	if (oldFiles.length > 10) {
		console.log(
			`\n\n📅 Old Files: ${oldFiles.length} files not modified in 30+ days`,
		);
		console.log("   (May be stable or may be stale - review needed)\n");
	}

	// Unclear files
	if (unclearFiles.length > 0) {
		console.log("\n\n❓ Files with Unclear Purpose:\n");
		for (const file of unclearFiles) {
			console.log(`   ${file.path}`);
		}
	}

	// Recommendations
	console.log("\n\n💡 Recommendations:\n");

	const beadsFiles = files.filter((f) => f.path.includes(".beads/"));
	if (beadsFiles.length > 0) {
		console.log(
			`   ⚠️  .beads/ directory (${beadsFiles.length} files) - Is this still needed?`,
		);
	}

	const htmlFiles = files.filter((f) => f.path.endsWith(".html"));
	if (htmlFiles.length > 0) {
		console.log(
			`   ⚠️  ${htmlFiles.length} HTML files in docs/ - Should these be markdown?`,
		);
	}

	const pdfFiles = files.filter((f) => f.path.endsWith(".pdf"));
	if (pdfFiles.length > 0) {
		console.log(
			`   ⚠️  ${pdfFiles.length} PDF files - Consider linking externally instead`,
		);
	}

	const deprecationFiles = files.filter((f) =>
		f.path.toUpperCase().includes("DEPRECATION"),
	);
	if (deprecationFiles.length > 0) {
		console.log(
			`   ⚠️  ${deprecationFiles.length} deprecation docs - Can old code be removed now?`,
		);
	}

	const legacyFiles = files.filter(
		(f) =>
			f.path.includes("/legacy/") || f.path.toUpperCase().includes("LEGACY"),
	);
	if (legacyFiles.length > 0) {
		console.log(
			`   ⚠️  ${legacyFiles.length} legacy files - Time to archive or delete?`,
		);
	}

	console.log("\n✅ Audit complete\n");
}

main().catch((error) => {
	console.error("❌ Audit failed:", error);
	process.exit(1);
});
