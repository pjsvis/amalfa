import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { getLogger } from "@src/utils/Logger";

const log = getLogger("TagInjector");

/**
 * TagInjector - Utility for safely injecting semantic tags and links into markdown files.
 * Supports FAFCAS-compliant tag syntax.
 */
export class TagInjector {
	/**
	 * Injects a semantic tag into a markdown file.
	 * If the file has frontmatter, it appends to the frontmatter.
	 * Otherwise, it adds a tag block at the top.
	 */
	static injectTag(
		filePath: string,
		relation: string,
		targetId: string,
	): boolean {
		if (!existsSync(filePath)) {
			log.error({ filePath }, "File not found for tag injection");
			return false;
		}

		try {
			let content = readFileSync(filePath, "utf-8");
			const tagString = `[${relation.toUpperCase()}: ${targetId}]`;

			// Check if tag already exists to avoid duplicates
			if (content.includes(tagString)) {
				return true;
			}

			// Look for existing tag block: <!-- tags: ... -->
			const tagBlockRegex = /<!-- tags: (.*?) -->/;
			const match = content.match(tagBlockRegex);

			if (match) {
				// Append to existing block
				const oldBlock = match[0];
				const innerTags = match[1];
				const newBlock = `<!-- tags: ${innerTags} ${tagString} -->`;
				content = content.replace(oldBlock, newBlock);
			} else {
				// Create new block after frontmatter or at top
				const frontmatterRegex = /^---\n[\s\S]*?\n---\n/;
				const fmMatch = content.match(frontmatterRegex);
				const newTagBlock = `\n<!-- tags: ${tagString} -->\n`;

				if (fmMatch) {
					content = content.replace(fmMatch[0], fmMatch[0] + newTagBlock);
				} else {
					content = newTagBlock + content;
				}
			}

			writeFileSync(filePath, content, "utf-8");
			return true;
		} catch (error) {
			log.error({ error, filePath }, "Failed to inject tag");
			return false;
		}
	}

	/**
	 * Injects a WikiLink into the end of a markdown file.
	 */
	static injectLink(
		filePath: string,
		targetId: string,
		label?: string,
	): boolean {
		if (!existsSync(filePath)) return false;

		try {
			let content = readFileSync(filePath, "utf-8");
			const link = label ? `[[${targetId}|${label}]]` : `[[${targetId}]]`;

			if (content.includes(link)) return true;

			content = content.trimEnd() + `\n\nSee also: ${link}\n`;
			writeFileSync(filePath, content, "utf-8");
			return true;
		} catch (error) {
			log.error({ error, filePath }, "Failed to inject link");
			return false;
		}
	}
}
