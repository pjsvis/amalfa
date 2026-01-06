import { Embedder } from "@src/resonance/services/embedder";
import { Glob } from "bun";

export class Harvester {
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Reserved for future embedding functionality
	private embedder: Embedder;

	constructor() {
		this.embedder = Embedder.getInstance();
	}

	/**
	 * Scans directories for `tag-` tokens.
	 * @returns A map of tag -> file paths[]
	 */
	public async scan(directories: string[]): Promise<Map<string, string[]>> {
		const tagMap = new Map<string, string[]>();

		for (const dir of directories) {
			const glob = new Glob(`${dir}/**/*.md`);
			for await (const file of glob.scan(".")) {
				const content = await Bun.file(file).text();
				const matches = content.matchAll(/\btag-([\w-]+)/g); // Matches `tag-foo-bar`

				for (const match of matches) {
					if (!match[1]) continue;
					const tag = match[1].toLowerCase(); // The slug without `tag-`
					if (!tagMap.has(tag)) {
						tagMap.set(tag, []);
					}
					tagMap.get(tag)?.push(file);
				}
			}
		}
		return tagMap;
	}

	/**
	 * Removes tags that are already in the Lexicon (Concepts) or Entity Index.
	 */
	public filterKnown(
		tags: Map<string, string[]>,
		knownIds: Set<string>,
	): Map<string, string[]> {
		const unknownTags = new Map<string, string[]>();

		for (const [tag, files] of tags) {
			// Check if tag exists as ID ("term-tag") or just "tag" or slugified
			if (!knownIds.has(tag) && !knownIds.has(`term-${tag}`)) {
				unknownTags.set(tag, files);
			}
		}
		return unknownTags;
	}

	/**
	 * Basic clustering or sorting. For V1 we might just list them alphabetically
	 * or by frequency. True semantic clustering requires sophisticated logic.
	 * For now, let's sort by frequency.
	 */
	public sortAndCluster(
		tags: Map<string, string[]>,
	): { tag: string; count: number; files: string[] }[] {
		const list = Array.from(tags.entries()).map(([tag, files]) => ({
			tag,
			count: files.length,
			files,
		}));

		// Sort by count descending
		return list.sort((a, b) => b.count - a.count);
	}
}
