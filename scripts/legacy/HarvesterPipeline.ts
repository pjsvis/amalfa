import { Harvester } from "@src/core/Harvester";

export class HarvesterPipeline {
	private harvester: Harvester;

	constructor() {
		this.harvester = new Harvester();
	}

	public async run(target?: string) {
		console.log("🌾 Resonance Harvester: Scanning...");

		// 1. Load Settings
		// biome-ignore lint/suspicious/noExplicitAny: config structure is dynamic
		let settings: any = {};
		try {
			const settingsRaw = await Bun.file("polyvis.settings.json").text();
			settings = JSON.parse(settingsRaw);
		} catch (_e) {
			console.warn(
				"⚠️ Could not load polyvis.settings.json, running in standalone mode.",
			);
			settings = {
				paths: {
					sources: {
						persona: { lexicon: null },
						experience: { directories: [] },
					},
				},
			};
		}

		const knownIds = new Set<string>();

		// 2. Load Lexicon (to identify known terms)
		if (settings.paths?.sources?.persona?.lexicon) {
			try {
				const lexRaw = await Bun.file(
					settings.paths.sources.persona.lexicon,
				).text();
				const lex = JSON.parse(lexRaw);
				const items = Array.isArray(lex) ? lex : lex.concepts || [];

				items.forEach((t: { id: string }) => {
					knownIds.add(t.id);
					if (t.id.startsWith("term-")) knownIds.add(t.id.replace("term-", ""));
				});
			} catch (_e) {
				console.warn(
					`⚠️ Could not load lexicon at ${settings.paths.sources.persona.lexicon}`,
				);
			}
		}

		// 3. Determine Scan Directories
		// Use target arg OR settings directories OR default to 'docs'
		const scanDirs = target
			? [target]
			: Array.isArray(settings.paths?.sources?.experience)
				? settings.paths.sources.experience.map((s: { path: string }) => s.path)
				: ["docs"];

		console.log(`Scanning: ${scanDirs.join(", ")}`);

		// 4. Scan & Filter
		const allTags = await this.harvester.scan(scanDirs);
		console.log(`Found ${allTags.size} unique tags.`);

		const unknownTags = this.harvester.filterKnown(allTags, knownIds);
		console.log(`Filtered to ${unknownTags.size} new emerging concepts.`);

		// 5. Generate Output
		const sorted = this.harvester.sortAndCluster(unknownTags);
		await this.generateReport(sorted);

		console.log("✅ Harvest Complete.");
	}

	private async generateReport(
		items: { tag: string; count: number; files: string[] }[],
	) {
		let mdOutput = "# Staging Area\n\n";
		mdOutput +=
			"These concepts have been harvested from the codebase. Review and Promote.\n\n";

		for (const item of items) {
			mdOutput += `## ${item.tag}\n`;
			mdOutput += `- **Frequency:** ${item.count}\n`;
			mdOutput += `- **Occurrences:**\n`;

			const uniqueFiles = [...new Set(item.files)];
			for (const f of uniqueFiles) {
				mdOutput += `  - ${f}\n`;
			}
			mdOutput += "\n";
		}

		await Bun.write("_staging.md", mdOutput);
		console.log("✅ Generated _staging.md");
	}
}
