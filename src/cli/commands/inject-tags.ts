import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { injectTag } from "@src/utils/TagInjector";

export async function cmdInjectTags(args: string[]) {
	// Parse arguments
	const filePath = args.find((arg) => !arg.startsWith("--"));
	const tags = args.filter((arg) => !arg.startsWith("--") && arg !== filePath);
	const jsonOutput = args.includes("--json");

	// Validate
	if (!filePath) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Missing file path argument",
					usage: "amalfa inject-tags <file-path> <tag1> [tag2...] [--json]",
				}),
			);
		} else {
			console.error("❌ Error: Missing file path argument");
			console.error(
				"\nUsage: amalfa inject-tags <file-path> <tag1> [tag2...] [--json]",
			);
			console.error("\nExamples:");
			console.error(
				'  amalfa inject-tags docs/auth.md "authentication" "security"',
			);
			console.error("  amalfa inject-tags playbooks/oauth.md oauth patterns");
			console.error('  amalfa inject-tags docs/auth.md "tutorial" --json');
		}
		process.exit(1);
	}

	if (tags.length === 0) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "No tags provided",
					usage: "amalfa inject-tags <file-path> <tag1> [tag2...]",
				}),
			);
		} else {
			console.error("❌ Error: No tags provided");
			console.error("\nProvide at least one tag to inject");
		}
		process.exit(1);
	}

	// Resolve to absolute path
	const absolutePath = resolve(process.cwd(), filePath);

	// Check if file exists
	if (!existsSync(absolutePath)) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "File not found",
					path: absolutePath,
				}),
			);
		} else {
			console.error(`❌ File not found: ${absolutePath}`);
		}
		process.exit(1);
	}

	// Check if it's a markdown file
	if (!absolutePath.endsWith(".md")) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Not a markdown file",
					path: absolutePath,
					suggestion: "inject-tags only works with .md files",
				}),
			);
		} else {
			console.error("❌ Not a markdown file");
			console.error("inject-tags only works with .md files");
		}
		process.exit(1);
	}

	try {
		// Inject each tag
		let successCount = 0;
		for (const tag of tags) {
			const success = injectTag(absolutePath, "tag", tag);
			if (success) {
				successCount++;
			}
		}

		// Output
		if (jsonOutput) {
			console.log(
				JSON.stringify({
					success: true,
					file: absolutePath,
					tags_injected: successCount,
					tags,
				}),
			);
		} else {
			console.log(
				`\n✅ Successfully injected ${successCount} tag(s) into: ${filePath}`,
			);
			console.log("\nTags:");
			for (const tag of tags) {
				console.log(`  • ${tag}`);
			}
			console.log(
				"\n💡 Tip: Re-run 'amalfa init' to index the updated metadata\n",
			);
		}
	} catch (error) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: error instanceof Error ? error.message : String(error),
					file: absolutePath,
				}),
			);
		} else {
			console.error(
				"❌ Tag injection failed:",
				error instanceof Error ? error.message : error,
			);
		}
		process.exit(1);
	}
}
