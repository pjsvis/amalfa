import { getLogger } from "@src/utils/Logger";
import type { EmberSidecar } from "./types";

export class EmberGenerator {
	private log = getLogger("EmberGenerator");

	/**
	 * Write the sidecar file to disk
	 */
	async generate(sidecar: EmberSidecar): Promise<string> {
		const sidecarPath = `${sidecar.targetFile}.ember.json`;

		try {
			await Bun.write(sidecarPath, JSON.stringify(sidecar, null, 2));
			this.log.info(`Generated sidecar: ${sidecarPath}`);
			return sidecarPath;
		} catch (error) {
			this.log.error(
				{ err: error, file: sidecarPath },
				"Failed to write sidecar",
			);
			throw error;
		}
	}
}
