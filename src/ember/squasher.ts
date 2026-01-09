import { unlink } from "node:fs/promises";
import { getLogger } from "@src/utils/Logger";
import matter from "gray-matter";
import type { EmberSidecar } from "./types";

export class EmberSquasher {
	private log = getLogger("EmberSquasher");

	/**
	 * Apply the sidecar changes to the target file
	 */
	async squash(sidecarPath: string): Promise<void> {
		try {
			// 1. Read Sidecar
			const sidecarContent = await Bun.file(sidecarPath).text();
			const sidecar: EmberSidecar = JSON.parse(sidecarContent);

			const targetPath = sidecar.targetFile;

			// 2. Read Target File
			const fileContent = await Bun.file(targetPath).text();

			// 3. Parse with gray-matter
			const parsed = matter(fileContent);
			const data = parsed.data || {};

			// 4. Apply Changes
			if (sidecar.changes.tags) {
				const currentTags = (
					Array.isArray(data.tags) ? data.tags : []
				) as string[];
				const toAdd = sidecar.changes.tags.add || [];
				const toRemove = sidecar.changes.tags.remove || [];

				const newTags = new Set(currentTags);
				for (const t of toAdd) {
					newTags.add(t);
				}
				for (const t of toRemove) {
					newTags.delete(t);
				}

				data.tags = Array.from(newTags);
			}

			if (sidecar.changes.frontmatter) {
				Object.assign(data, sidecar.changes.frontmatter);
			}

			if (sidecar.changes.summary) {
				data.summary = sidecar.changes.summary;
			}

			// 5. Reconstruct File
			const newContent = matter.stringify(parsed.content, data);

			// 6. Write Back
			await Bun.write(targetPath, newContent);
			this.log.info(`Squashed sidecar into ${targetPath}`);

			// 7. Cleanup Sidecar
			await unlink(sidecarPath);
		} catch (error) {
			this.log.error(
				{ err: error, file: sidecarPath },
				"Failed to squash sidecar",
			);
			throw error;
		}
	}
}
