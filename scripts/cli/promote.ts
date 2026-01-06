import { createInterface } from "node:readline";
import { Glob } from "bun";

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const question = (query: string) =>
	new Promise<string>((resolve) => rl.question(query, resolve));

async function main() {
	console.log("🚀 Resonance Promoter");
	console.log("Reading _staging.md...");

	if (!(await Bun.file("_staging.md").exists())) {
		console.error(
			"❌ _staging.md not found. Run 'bun scripts/harvest.ts' first.",
		);
		process.exit(1);
	}

	const content = await Bun.file("_staging.md").text();

	// Simple parser: Find h2 sections
	const blocks = content.split(/^## /gm).slice(1);

	const settingsRaw = await Bun.file("polyvis.settings.json").text();
	const settings = JSON.parse(settingsRaw);
	const lexiconPath = settings.paths.sources.persona.lexicon;
	const lexiconRaw = await Bun.file(lexiconPath).text();
	const lexicon = JSON.parse(lexiconRaw);

	let promotedCount = 0;

	for (const block of blocks) {
		const lines = block.split("\n");
		const tag = lines[0]?.trim();
		if (!tag) continue;

		console.log(`\n----------------------------------------`);
		console.log(`📦 Candidate: [${tag}]`);

		const action = await question("Promote this term? (y/n/skip): ");
		if (action.toLowerCase() === "y" || action.toLowerCase() === "yes") {
			// 1. Definition
			const title =
				(await question(`Title [${toTitleCase(tag)}]: `)) || toTitleCase(tag);
			const def = await question("Definition: ");

			// 2. Add to Lexicon
			const newTerm = {
				id: `term-${tag}`,
				title: title,
				definition: def,
				tags: [],
				aliases: [],
			};
			lexicon.push(newTerm);

			// 3. Strip Tags from Files
			console.log("Cleaning up source files...");
			const scanDirs = settings.paths.sources.experience.directories;
			let filesCleaned = 0;

			for (const dir of scanDirs) {
				const glob = new Glob(`${dir}/**/*.md`);
				for await (const file of glob.scan(".")) {
					const text = await Bun.file(file).text();

					// Regex: \btag-tag\b -> tag
					// e.g. tag-recursive-bullshit -> recursive-bullshit
					const regex = new RegExp(`\\btag-${tag}\\b`, "g");

					if (regex.test(text)) {
						const newText = text.replace(regex, tag); // Replacement is just the slug
						await Bun.write(file, newText);
						filesCleaned++;
					}
				}
			}
			console.log(`✨ Promoted '${title}' and cleaned ${filesCleaned} files.`);
			promotedCount++;
		}
	}

	// Save Lexicon
	if (promotedCount > 0) {
		console.log(`\n💾 Saving Lexicon (${lexicon.length} terms)...`);
		await Bun.write(lexiconPath, JSON.stringify(lexicon, null, 2));
	}

	console.log("Done.");
	process.exit(0);
}

function toTitleCase(slug: string) {
	return slug
		.split("-")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

main().catch(console.error);
