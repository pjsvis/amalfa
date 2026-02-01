#!/usr/bin/env -S bun run
// @ts-nocheck

/**
 * LangExtract Model Comparison Script
 *
 * Compares extraction results across different models and providers.
 * Analyzes latency, quality, and success rates.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

interface Result {
	timestamp: string;
	model: string;
	provider: string;
	test_id: string;
	input_text: string;
	prompt?: string;
	latency_ms: number;
	success: boolean;
	result?: {
		entities: Array<{ name: string; type: string; description?: string }>;
		relationships: Array<{
			source: string;
			target: string;
			type: string;
			description?: string;
		}>;
	};
	error?: string;
	metadata: {
		input_length: number;
		entity_count: number;
		relationship_count: number;
		output_length: number;
	};
	manual_assessment?: {
		accuracy?: number;
		completeness?: number;
		relevance?: number;
		format?: number;
		notes?: string;
	};
}

interface ModelStats {
	model: string;
	provider: string;
	total_runs: number;
	successful_runs: number;
	failed_runs: number;
	success_rate: number;
	latency: {
		mean: number;
		median: number;
		min: number;
		max: number;
		std_dev: number;
	};
	entities: {
		mean: number;
		median: number;
		min: number;
		max: number;
	};
	relationships: {
		mean: number;
		median: number;
		min: number;
		max: number;
	};
	quality?: {
		accuracy: number;
		completeness: number;
		relevance: number;
		format: number;
		overall: number;
	};
}

interface ComparisonOptions {
	inputFile?: string;
	outputFile?: string;
	models?: string[];
	providers?: string[];
	sortBy?: "latency" | "quality" | "success";
	format?: "table" | "json" | "markdown";
}

/**
 * Read and parse JSONL file
 */
function readResults(filePath: string): Result[] {
	try {
		const content = readFileSync(filePath, "utf-8");
		const lines = content
			.trim()
			.split("\n")
			.filter((line) => line.trim());

		return lines.map((line, index) => {
			try {
				return JSON.parse(line) as Result;
			} catch (error) {
				console.error(`Failed to parse line ${index + 1}: ${line}`);
				throw error;
			}
		});
	} catch (error) {
		console.error(`Error reading file ${filePath}:`, error);
		return [];
	}
}

/**
 * Filter results by models and providers
 */
function filterResults(
	results: Result[],
	options: ComparisonOptions,
): Result[] {
	let filtered = results;

	if (options.models && options.models.length > 0) {
		filtered = filtered.filter((r) => options.models?.includes(r.model));
	}

	if (options.providers && options.providers.length > 0) {
		filtered = filtered.filter((r) => options.providers?.includes(r.provider));
	}

	return filtered;
}

/**
 * Calculate statistics for an array of numbers
 */
function calculateStats(values: number[]) {
	if (values.length === 0) {
		return { mean: 0, median: 0, min: 0, max: 0, std_dev: 0 };
	}

	const sorted = [...values].sort((a, b) => a - b);
	const sum = sorted.reduce((a, b) => a + b, 0);
	const mean = sum / sorted.length;
	const median =
		sorted.length % 2 === 0
			? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
			: sorted[Math.floor(sorted.length / 2)];
	const min = sorted[0];
	const max = sorted[sorted.length - 1];

	const variance =
		sorted.reduce((sum, val) => sum + (val - mean) ** 2, 0) / sorted.length;
	const std_dev = Math.sqrt(variance);

	return { mean, median, min, max, std_dev };
}

/**
 * Calculate statistics for each model
 */
function calculateModelStats(results: Result[]): ModelStats[] {
	const grouped = results.reduce(
		(acc, result) => {
			const key = `${result.model}|${result.provider}`;
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(result);
			return acc;
		},
		{} as Record<string, Result[]>,
	);

	return Object.entries(grouped).map(([key, modelResults]) => {
		const [model, provider] = key.split("|");
		const successful = modelResults.filter((r) => r.success);
		const failed = modelResults.filter((r) => !r.success);

		const latencyStats = calculateStats(successful.map((r) => r.latency_ms));
		const entityStats = calculateStats(
			successful.map((r) => r.metadata.entity_count),
		);
		const relationshipStats = calculateStats(
			successful.map((r) => r.metadata.relationship_count),
		);

		// Calculate quality scores if manual assessments exist
		let quality: any;
		const withAssessment = successful.filter(
			(r) => r.manual_assessment,
		) as Result[];
		if (withAssessment.length > 0) {
			const accuracy = calculateStats(
				withAssessment.map((r) => r.manual_assessment?.accuracy || 0),
			).mean;
			const completeness = calculateStats(
				withAssessment.map((r) => r.manual_assessment?.completeness || 0),
			).mean;
			const relevance = calculateStats(
				withAssessment.map((r) => r.manual_assessment?.relevance || 0),
			).mean;
			const format = calculateStats(
				withAssessment.map((r) => r.manual_assessment?.format || 0),
			).mean;

			quality = {
				accuracy,
				completeness,
				relevance,
				format,
				overall: (accuracy + completeness + relevance + format) / 4,
			};
		}

		return {
			model,
			provider,
			total_runs: modelResults.length,
			successful_runs: successful.length,
			failed_runs: failed.length,
			success_rate: (successful.length / modelResults.length) * 100,
			latency: latencyStats,
			entities: entityStats,
			relationships: relationshipStats,
			quality,
		};
	});
}

/**
 * Sort model stats by specified criteria
 */
function sortStats(stats: ModelStats[], sortBy: string): ModelStats[] {
	const sorted = [...stats];

	switch (sortBy) {
		case "latency":
			return sorted.sort((a, b) => a.latency.mean - b.latency.mean);
		case "quality":
			return sorted.sort(
				(a, b) => (b.quality?.overall || 0) - (a.quality?.overall || 0),
			);
		case "success":
			return sorted.sort((a, b) => b.success_rate - a.success_rate);
		default:
			return sorted;
	}
}

/**
 * Format stats as table
 */
function formatTable(stats: ModelStats[]): string {
	const lines: string[] = [];

	// Header
	lines.push(
		"Model".padEnd(40) +
			"Provider".padEnd(10) +
			"Success".padEnd(10) +
			"Latency (ms)".padEnd(20) +
			"Entities".padEnd(12) +
			"Relations".padEnd(12) +
			"Quality",
	);
	lines.push(
		"-".repeat(40) +
			" ".repeat(10) +
			"-".repeat(10) +
			"-".repeat(20) +
			"-".repeat(12) +
			"-".repeat(12) +
			"-".repeat(10),
	);

	// Rows
	for (const stat of stats) {
		const qualityStr = stat.quality ? stat.quality.overall.toFixed(1) : "N/A";
		lines.push(
			stat.model.padEnd(40) +
				stat.provider.padEnd(10) +
				`${stat.success_rate.toFixed(1)}%`.padEnd(10) +
				`${stat.latency.mean.toFixed(0)} ± ${stat.latency.std_dev.toFixed(0)}`.padEnd(
					20,
				) +
				`${stat.entities.mean.toFixed(1)}`.padEnd(12) +
				`${stat.relationships.mean.toFixed(1)}`.padEnd(12) +
				qualityStr,
		);
	}

	return lines.join("\n");
}

/**
 * Format stats as JSON
 */
function formatJson(stats: ModelStats[]): string {
	return JSON.stringify(stats, null, 2);
}

/**
 * Format stats as Markdown
 */
function formatMarkdown(stats: ModelStats[]): string {
	const lines: string[] = [];

	lines.push("# Model Comparison Report");
	lines.push("");
	lines.push("## Summary");
	lines.push("");
	lines.push(
		"| Model | Provider | Success Rate | Latency (ms) | Entities | Relationships | Quality |",
	);
	lines.push(
		"|-------|----------|--------------|--------------|----------|----------------|---------|",
	);

	for (const stat of stats) {
		const qualityStr = stat.quality ? stat.quality.overall.toFixed(1) : "N/A";
		lines.push(
			`| ${stat.model} | ${stat.provider} | ${stat.success_rate.toFixed(1)}% | ${stat.latency.mean.toFixed(0)} ± ${stat.latency.std_dev.toFixed(0)} | ${stat.entities.mean.toFixed(1)} | ${stat.relationships.mean.toFixed(1)} | ${qualityStr} |`,
		);
	}

	lines.push("");
	lines.push("## Detailed Statistics");
	lines.push("");

	for (const stat of stats) {
		lines.push(`### ${stat.model} (${stat.provider})`);
		lines.push("");
		lines.push("- **Total Runs:**", stat.total_runs);
		lines.push("- **Successful:**", stat.successful_runs);
		lines.push("- **Failed:**", stat.failed_runs);
		lines.push(`- **Success Rate:** ${stat.success_rate.toFixed(1)}%`);
		lines.push("");
		lines.push("#### Latency");
		lines.push(`- Mean: ${stat.latency.mean.toFixed(0)}ms`);
		lines.push(`- Median: ${stat.latency.median.toFixed(0)}ms`);
		lines.push(`- Min: ${stat.latency.min.toFixed(0)}ms`);
		lines.push(`- Max: ${stat.latency.max.toFixed(0)}ms`);
		lines.push(`- Std Dev: ${stat.latency.std_dev.toFixed(0)}ms`);
		lines.push("");
		lines.push("#### Entity Extraction");
		lines.push(`- Mean: ${stat.entities.mean.toFixed(1)} entities`);
		lines.push(`- Median: ${stat.entities.median.toFixed(1)} entities`);
		lines.push(`- Min: ${stat.entities.min} entities`);
		lines.push(`- Max: ${stat.entities.max} entities`);
		lines.push("");
		lines.push("#### Relationship Extraction");
		lines.push(`- Mean: ${stat.relationships.mean.toFixed(1)} relationships`);
		lines.push(
			`- Median: ${stat.relationships.median.toFixed(1)} relationships`,
		);
		lines.push(`- Min: ${stat.relationships.min} relationships`);
		lines.push(`- Max: ${stat.relationships.max} relationships`);

		if (stat.quality) {
			lines.push("");
			lines.push("#### Quality Assessment");
			lines.push(`- Accuracy: ${stat.quality.accuracy.toFixed(1)}/5`);
			lines.push(`- Completeness: ${stat.quality.completeness.toFixed(1)}/5`);
			lines.push(`- Relevance: ${stat.quality.relevance.toFixed(1)}/5`);
			lines.push(`- Format: ${stat.quality.format.toFixed(1)}/5`);
			lines.push(`- Overall: ${stat.quality.overall.toFixed(1)}/5`);
		}

		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Main comparison function
 */
function compareModels(options: ComparisonOptions) {
	const inputFile =
		options.inputFile || resolve("tests/langextract-results/results.jsonl");

	console.log(`📊 Reading results from: ${inputFile}`);
	const results = readResults(inputFile);

	if (results.length === 0) {
		console.error("❌ No results found in file");
		process.exit(1);
	}

	console.log(`✅ Found ${results.length} results`);

	// Filter results
	const filtered = filterResults(results, options);
	console.log(`🔍 Filtered to ${filtered.length} results`);

	if (filtered.length === 0) {
		console.error("❌ No results match the specified filters");
		process.exit(1);
	}

	// Calculate statistics
	const stats = calculateModelStats(filtered);
	console.log(`📈 Analyzed ${stats.length} models`);

	// Sort statistics
	const sorted = sortStats(stats, options.sortBy || "latency");

	// Format output
	let output: string;
	switch (options.format) {
		case "json":
			output = formatJson(sorted);
			break;
		case "markdown":
			output = formatMarkdown(sorted);
			break;
		default:
			output = formatTable(sorted);
			break;
	}

	// Print to console
	console.log(`\n${"=".repeat(120)}`);
	console.log(output);
	console.log("=".repeat(120));

	// Save to file if specified
	if (options.outputFile) {
		writeFileSync(options.outputFile, output);
		console.log(`\n💾 Results saved to: ${options.outputFile}`);
	}

	// Print recommendations
	console.log("\n💡 Recommendations:");

	const fastest = sorted[0];
	console.log(
		`   🚀 Fastest: ${fastest.model} (${fastest.latency.mean.toFixed(0)}ms)`,
	);

	const mostReliable = [...sorted].sort(
		(a, b) => b.success_rate - a.success_rate,
	)[0];
	console.log(
		`   ✅ Most Reliable: ${mostReliable.model} (${mostReliable.success_rate.toFixed(1)}% success)`,
	);

	const mostProductive = [...sorted].sort(
		(a, b) =>
			b.entities.mean +
			b.relationships.mean -
			(a.entities.mean + a.relationships.mean),
	)[0];
	console.log(
		`   📊 Most Productive: ${mostProductive.model} (${(mostProductive.entities.mean + mostProductive.relationships.mean).toFixed(1)} items)`,
	);

	if (sorted.some((s) => s.quality)) {
		const bestQuality = [...sorted].sort(
			(a, b) => (b.quality?.overall || 0) - (a.quality?.overall || 0),
		)[0];
		console.log(
			`   🏆 Best Quality: ${bestQuality.model} (${bestQuality.quality?.overall.toFixed(1)}/5)`,
		);
	}
}

/**
 * Parse command line arguments
 */
function parseArgs(): ComparisonOptions {
	const args = process.argv.slice(2);
	const options: ComparisonOptions = {};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case "--input":
			case "-i":
				options.inputFile = args[++i];
				break;
			case "--output":
			case "-o":
				options.outputFile = args[++i];
				break;
			case "--models":
			case "-m":
				options.models = args[++i].split(",");
				break;
			case "--providers":
			case "-p":
				options.providers = args[++i].split(",");
				break;
			case "--sort":
			case "-s":
				options.sortBy = args[++i] as "latency" | "quality" | "success";
				break;
			case "--format":
			case "-f":
				options.format = args[++i] as "table" | "json" | "markdown";
				break;
			case "--help":
			case "-h":
				console.log(`
LangExtract Model Comparison Script

Usage:
  bun run compare-models.ts [options]

Options:
  -i, --input <file>      Input JSONL file (default: tests/langextract-results/results.jsonl)
  -o, --output <file>     Output file for results
  -m, --models <list>     Comma-separated list of models to compare
  -p, --providers <list>  Comma-separated list of providers to compare
  -s, --sort <criteria>   Sort by: latency, quality, success (default: latency)
  -f, --format <type>     Output format: table, json, markdown (default: table)
  -h, --help              Show this help message

Examples:
  # Compare all models
  bun run compare-models.ts

  # Compare specific models
  bun run compare-models.ts -m "mistral-nemo:latest,nemotron-3-nano:30b-cloud"

  # Sort by quality and output as markdown
  bun run compare-models.ts -s quality -f markdown -o comparison.md

  # Compare only local providers
  bun run compare-models.ts -p local
        `);
				process.exit(0);
		}
	}

	return options;
}

// Run comparison
if (import.meta.main) {
	const options = parseArgs();
	compareModels(options);
}
