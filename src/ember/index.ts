import { join } from "node:path";
import type { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { Glob } from "bun";
import { EmberAnalyzer } from "./analyzer";
import { EmberGenerator } from "./generator";
import { EmberSquasher } from "./squasher";
import type { EmberConfig } from "./types";

export class EmberService {
	private analyzer: EmberAnalyzer;
	private generator: EmberGenerator;
	private squasher: EmberSquasher;
	private log = getLogger("EmberService");

	constructor(
		db: ResonanceDB,
		private config: EmberConfig,
	) {
		this.analyzer = new EmberAnalyzer(db);
		this.generator = new EmberGenerator();
		this.squasher = new EmberSquasher();
	}

	/**
	 * Run a full sweep of all configured sources
	 */
	async runFullSweep(dryRun = false) {
		this.log.info("Starting full Ember sweep...");

		const files = await this.discoverFiles();
		let enrichedCount = 0;

		for (const file of files) {
			const content = await Bun.file(file).text();
			const sidecar = await this.analyzer.analyze(file, content);

			if (sidecar) {
				if (dryRun) {
					this.log.info(`[Dry Run] Would generate sidecar for ${file}`);
					console.log(JSON.stringify(sidecar, null, 2));
				} else {
					await this.generator.generate(sidecar);
					enrichedCount++;
				}
			}
		}

		this.log.info(`Sweep complete. Enriched ${enrichedCount} files.`);
		return enrichedCount;
	}

	/**
	 * Squash all pending sidecars
	 */
	async squashAll() {
		this.log.info("Squashing all pending sidecars...");
		let count = 0;

		// Simpler scan:
		const sidecars = await this.findSidecars();
		for (const sidecarPath of sidecars) {
			await this.squasher.squash(sidecarPath);
			count++;
		}

		this.log.info(`Squashed ${count} sidecars.`);
		return count;
	}

	private async findSidecars(): Promise<string[]> {
		const sidecars: string[] = [];
		const glob = new Glob("**/*.ember.json");
		// Scan sources
		for (const source of this.config.sources) {
			// Assuming source is like "./docs"
			const sourcePath = join(process.cwd(), source);
			for (const file of glob.scanSync({ cwd: sourcePath })) {
				sidecars.push(join(sourcePath, file));
			}
		}
		return sidecars;
	}

	private async discoverFiles(): Promise<string[]> {
		const files: string[] = [];
		const glob = new Glob("**/*.{md,mdx}"); // Only markdown for now

		for (const source of this.config.sources) {
			const sourcePath = join(process.cwd(), source);
			try {
				for (const file of glob.scanSync({ cwd: sourcePath })) {
					const shouldExclude = this.config.excludePatterns.some((p) =>
						file.includes(p),
					);
					if (!shouldExclude) {
						files.push(join(sourcePath, file));
					}
				}
			} catch (e) {
				this.log.warn({ source: sourcePath, err: e }, "Failed to scan source");
			}
		}
		return files;
	}
}
