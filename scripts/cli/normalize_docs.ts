import { parseArgs } from "node:util";
import { BentoNormalizer } from "@src/core/BentoNormalizer";
import { Glob } from "bun";

// Parse CLI args
const { values } = parseArgs({
	args: Bun.argv,
	options: {
		limit: { type: "string" },
		dryRun: { type: "boolean" },
		target: { type: "string" },
	},
	strict: true,
	allowPositionals: true,
});

const LIMIT = values.limit ? parseInt(values.limit, 10) : 10;
const DRY_RUN = values.dryRun ?? false;

async function main() {
	console.log(`🍱 Bento Box Normalizer`);
	console.log(`Limit: ${LIMIT}`);
	console.log(`Dry Run: ${DRY_RUN}`);

	// Load Settings
	const settingsRaw = await Bun.file("polyvis.settings.json").text();
	const settings = JSON.parse(settingsRaw);
	const directories = settings.paths.sources.experience.directories;

	// Override directories if target provided
	const searchDirs = values.target ? [values.target] : directories;

	let processedCount = 0;
	let changedCount = 0;

	for (const dir of searchDirs) {
		console.log(`📂 Scanning ${dir}...`);
		const pattern = new Glob(`${dir}/**/*.md`);

		for await (const file of pattern.scan(".")) {
			if (processedCount >= LIMIT) break;

			const content = await Bun.file(file).text();
			const filename = file.split("/").pop() || "";

			const normalized = BentoNormalizer.normalize(content, filename);

			if (content !== normalized) {
				console.log(`📝 Fixing ${file}`);
				// Simple Diff Log
				const originalFirstLine = content.split("\n")[0] || "";
				const normalizedFirstLine = normalized.split("\n")[0] || "";

				if (originalFirstLine !== normalizedFirstLine) {
					console.log(
						`   - Header Change: "${originalFirstLine.substring(0, 30)}..." -> "${normalizedFirstLine.substring(0, 30)}..."`,
					);
				}

				if (!DRY_RUN) {
					await Bun.write(file, normalized);
				}
				changedCount++;
			} else {
				// console.log(`✅ OK: ${file}`);
			}

			processedCount++;
		}
		if (processedCount >= LIMIT) break;
	}

	console.log(`\n🏁 Done.`);
	console.log(`Processed: ${processedCount}`);
	console.log(`Changed:   ${changedCount}`);
	console.log(
		`Status:    ${DRY_RUN ? "Dry Run (No changes saved)" : "Updates Applied"}`,
	);
}

main().catch(console.error);
