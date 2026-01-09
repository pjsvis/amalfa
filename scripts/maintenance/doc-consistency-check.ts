/**
 * Documentation Consistency Checker
 *
 * Extracts CLI commands from src/cli.ts and cross-references them
 * with documentation to identify undocumented features.
 *
 * Usage: bun run scripts/maintenance/doc-consistency-check.ts
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

interface CommandInfo {
	name: string;
	description: string;
	documented: boolean;
	foundIn: string[];
}

// Extract CLI commands from src/cli.ts
function extractCliCommands(): Map<string, string> {
	const cliPath = join(process.cwd(), "src/cli.ts");
	const content = readFileSync(cliPath, "utf-8");

	const commands = new Map<string, string>();

	// Extract from showHelp() function
	const helpMatch = content.match(
		/function showHelp\(\)[\s\S]*?console\.log\(`([\s\S]*?)`\)/,
	);
	if (helpMatch) {
		const helpText = helpMatch[1];
		const commandLines = helpText.match(/^\s{2}(\w+[\w\-\s<>]*)\s{2,}(.+)$/gm);
		if (commandLines) {
			for (const line of commandLines) {
				const match = line.match(/^\s{2}(\w+(?:\s+\S+)?)\s{2,}(.+)$/);
				if (match) {
					const cmdName = match[1].trim().split(/\s+/)[0]; // Get base command
					commands.set(cmdName, match[2].trim());
				}
			}
		}
	}

	// Also extract from switch cases in main()
	const switchMatch = content.match(
		/switch\s*\(command\)\s*\{([\s\S]*?)default:/,
	);
	if (switchMatch) {
		const cases = switchMatch[1].matchAll(/case\s+"(\w+)":/g);
		for (const c of cases) {
			if (!commands.has(c[1])) {
				commands.set(c[1], "(No description in help)");
			}
		}
	}

	return commands;
}

// Recursively find all markdown files
function findMarkdownFiles(dir: string, files: string[] = []): string[] {
	const items = readdirSync(dir);
	for (const item of items) {
		const fullPath = join(dir, item);
		const stat = statSync(fullPath);
		if (stat.isDirectory()) {
			// Skip node_modules, .git, .amalfa
			if (!["node_modules", ".git", ".amalfa", "archive"].includes(item)) {
				findMarkdownFiles(fullPath, files);
			}
		} else if (item.endsWith(".md")) {
			files.push(fullPath);
		}
	}
	return files;
}

// Search for command mentions in docs
function searchDocsForCommand(command: string, docFiles: string[]): string[] {
	const foundIn: string[] = [];
	const patterns = [
		new RegExp(`amalfa\\s+${command}`, "i"),
		new RegExp(`\`${command}\``, "i"),
		new RegExp(`\\b${command}\\b.*command`, "i"),
	];

	for (const file of docFiles) {
		const content = readFileSync(file, "utf-8");
		for (const pattern of patterns) {
			if (pattern.test(content)) {
				foundIn.push(relative(process.cwd(), file));
				break;
			}
		}
	}

	return foundIn;
}

// Main analysis
async function main() {
	console.log("🔍 Documentation Consistency Check");
	console.log("═".repeat(60));
	console.log();

	// Extract CLI commands
	const commands = extractCliCommands();
	console.log(`📋 Found ${commands.size} CLI commands in src/cli.ts\n`);

	// Find all markdown files
	const docFiles = findMarkdownFiles(process.cwd());
	console.log(`📄 Found ${docFiles.length} markdown files\n`);

	// Cross-reference
	const results: CommandInfo[] = [];
	for (const [name, description] of commands) {
		const foundIn = searchDocsForCommand(name, docFiles);
		results.push({
			name,
			description,
			documented: foundIn.length > 0,
			foundIn,
		});
	}

	// Report
	console.log("📊 Command Documentation Status");
	console.log("─".repeat(60));

	const documented = results.filter((r) => r.documented);
	const undocumented = results.filter((r) => !r.documented);

	console.log(`\n✅ Documented (${documented.length}/${results.length}):`);
	for (const cmd of documented) {
		console.log(`   ${cmd.name.padEnd(15)} → ${cmd.foundIn[0]}`);
	}

	console.log(`\n❌ Undocumented (${undocumented.length}/${results.length}):`);
	for (const cmd of undocumented) {
		console.log(`   ${cmd.name.padEnd(15)} - ${cmd.description}`);
	}

	// Summary
	console.log("\n" + "═".repeat(60));
	const coverage = ((documented.length / results.length) * 100).toFixed(1);
	console.log(`📈 Documentation Coverage: ${coverage}%`);

	if (undocumented.length > 0) {
		console.log("\n💡 Suggested Actions:");
		for (const cmd of undocumented.slice(0, 5)) {
			console.log(`   → Add documentation for 'amalfa ${cmd.name}'`);
		}
	} else {
		console.log("\n✨ All commands are documented!");
	}

	// Exit with error if coverage is below threshold
	if (Number.parseFloat(coverage) < 70) {
		console.log("\n⚠️  Coverage below 70% - consider improving documentation.");
		process.exit(1);
	}
}

main().catch(console.error);
