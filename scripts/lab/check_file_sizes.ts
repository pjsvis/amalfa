#!/usr/bin/env bun

/**
 * Script to analyze markdown file sizes and recommend chunking strategies.
 *
 * Usage:
 *   bun run scripts/lab/check_file_sizes.ts
 */

import { readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

// Configuration
const CONFIG = {
	// Directories to scan (relative to project root)
	scanDirs: ["docs", "playbooks", "briefs", "debriefs"],
	// Ignore specific paths
	ignore: ["node_modules", ".resonance", "dist", ".git"],
	// Thresholds (in bytes)
	thresholds: {
		warning: 15 * 1024, // 15KB - Consider reviewing
		critical: 30 * 1024, // 30KB - Definitely chunk
	},
	// Token estimation (rough 4 chars per token)
	charsPerToken: 4,
	// Context window limit (e.g., for embedding models)
	embeddingLimitTokens: 8192,
};

interface FileStats {
	path: string;
	size: number;
	tokens: number;
}

async function scanDirectory(dir: string, fileList: FileStats[] = []) {
	try {
		const entries = await readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = join(dir, entry.name);

			// Skip ignored directories/files
			if (CONFIG.ignore.some((i) => fullPath.includes(i))) continue;

			if (entry.isDirectory()) {
				await scanDirectory(fullPath, fileList);
			} else if (entry.isFile() && entry.name.endsWith(".md")) {
				const stats = await stat(fullPath);
				fileList.push({
					path: fullPath,
					size: stats.size,
					tokens: Math.ceil(stats.size / CONFIG.charsPerToken),
				});
			}
		}
	} catch (error) {
		// Ignore errors for non-existent directories defined in config
		if ((error as any).code !== "ENOENT") {
			console.error(`Error scanning ${dir}:`, error);
		}
	}
	return fileList;
}

async function analyze() {
	console.log("🔍 Scanning Markdown files for size analysis...\n");

	const rootDir = process.cwd();
	const allFiles: FileStats[] = [];

	for (const dir of CONFIG.scanDirs) {
		await scanDirectory(join(rootDir, dir), allFiles);
	}

	// Statistics
	const totalFiles = allFiles.length;
	if (totalFiles === 0) {
		console.log("No markdown files found.");
		return;
	}

	const sortedFiles = allFiles.sort((a, b) => b.size - a.size);
	const totalSize = allFiles.reduce((sum, f) => sum + f.size, 0);
	const avgSize = totalSize / totalFiles;

	// Percentile calculations
	const p50 = sortedFiles[Math.floor(totalFiles * 0.5)].size;
	const p75 = sortedFiles[Math.floor(totalFiles * 0.25)].size; // Top 25% (sorted desc)
	const p90 = sortedFiles[Math.floor(totalFiles * 0.1)].size; // Top 10%
	const p95 = sortedFiles[Math.floor(totalFiles * 0.05)].size; // Top 5%

	console.log(`📊 Corpus Statistics:`);
	console.log(`   Total Markdown Files: ${totalFiles}`);
	console.log(`   Total Size:           ${(totalSize / 1024).toFixed(2)} KB`);
	console.log(`   Average Size:         ${(avgSize / 1024).toFixed(2)} KB`);
	console.log(`   Median Size (p50):    ${(p50 / 1024).toFixed(2)} KB`);
	console.log(`   Top 25% (p75):        ${(p75 / 1024).toFixed(2)} KB`);
	console.log(`   Top 10% (p90):        ${(p90 / 1024).toFixed(2)} KB`);
	console.log(`   Top 5% (p95):         ${(p95 / 1024).toFixed(2)} KB`);
	console.log("");

	// Threshold Analysis
	const criticalFiles = sortedFiles.filter(
		(f) => f.size > CONFIG.thresholds.critical,
	);
	const warningFiles = sortedFiles.filter(
		(f) =>
			f.size > CONFIG.thresholds.warning &&
			f.size <= CONFIG.thresholds.critical,
	);

	console.log(
		`🚨 Critical Files (> ${(CONFIG.thresholds.critical / 1024).toFixed(0)}KB): ${criticalFiles.length}`,
	);
	if (criticalFiles.length > 0) {
		console.log("   Strong candidates for chunking/bento-boxing:");
		criticalFiles.forEach((f) => {
			console.log(
				`   - ${relative(rootDir, f.path)}: ${(f.size / 1024).toFixed(1)} KB (~${f.tokens} tokens)`,
			);
		});
	}
	console.log("");

	console.log(
		`⚠️  Warning Files (> ${(CONFIG.thresholds.warning / 1024).toFixed(0)}KB): ${warningFiles.length}`,
	);
	if (warningFiles.length > 0) {
		console.log("   Monitor these for growth:");
		warningFiles.slice(0, 5).forEach((f) => {
			console.log(
				`   - ${relative(rootDir, f.path)}: ${(f.size / 1024).toFixed(1)} KB`,
			);
		});
		if (warningFiles.length > 5)
			console.log(`   ...and ${warningFiles.length - 5} more.`);
	}
	console.log("");

	// Recommendation
	console.log("🧠 Recommendation:");
	const maxTokenEst = sortedFiles[0].tokens;

	if (criticalFiles.length > 0) {
		console.log(`   ❗ Fragmentation is RECOMMENDED.`);
		console.log(
			`      We have ${criticalFiles.length} files significantly larger than the median.`,
		);
		console.log(`      The largest file is ~${maxTokenEst} tokens.`);
		console.log(
			`      Strategy: Break huge files into "Part 1, Part 2" or atomic concept files.`,
		);
	} else if (warningFiles.length > totalFiles * 0.2) {
		console.log(`   👀 Watch List.`);
		console.log(
			`      No critical giants, but 20%+ of corpus is getting heavy.`,
		);
		console.log(`      Consider tightening "One Concept Per File" rules.`);
	} else {
		console.log(`   ✅ Healthy Distribution.`);
		console.log(`      Most files are concise. No immediate action needed.`);
	}
}

analyze().catch(console.error);
