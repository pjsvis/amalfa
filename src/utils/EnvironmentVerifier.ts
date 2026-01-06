import { existsSync } from "node:fs";
import { resolve } from "node:path";
import settings from "../../polyvis.settings.json";

/**
 * EnvironmentVerifier
 *
 * Responsible for verifying that the runtime environment matches the
 * expectations set in polyvis.settings.json.
 *
 * Usage:
 * await EnvironmentVerifier.verifyOrExit();
 */
export const EnvironmentVerifier = {
	async verifyOrExit(): Promise<void> {
		const errors: string[] = [];
		const cwd = process.cwd();

		console.error(`🛡️  [Env] Verifying filesystem context in: ${cwd}`);

		// 1. Verify Database Directory
		const dbPath = settings.paths.database.resonance;
		const dbDir = resolve(cwd, dbPath, "..");
		if (!existsSync(dbDir)) {
			errors.push(`Database directory missing: ${dbDir}`);
		}

		// 2. Verify Source Directories
		// We iterate over the 'sources' config to ensure target folders exist
		const experienceSources = settings.paths.sources.experience;
		for (const source of experienceSources) {
			const absPath = resolve(cwd, source.path);
			if (!existsSync(absPath)) {
				console.warn(
					`   ⚠️  Optional source directory missing: ${source.path} (created automatically by some tools, but worth noting)`,
				);
				// We don't hard fail on standard folders, as they might be empty/missing in a fresh repo.
				// But specifically for 'docs' or critical ones we might want to be stricter.
				// For now, we WARN.
			}
		}

		// 3. Verify Static Assets (Lexicon/CDA)
		const lexiconPath = resolve(cwd, settings.paths.sources.persona.lexicon);
		if (!existsSync(lexiconPath)) {
			errors.push(`Critical Artifact missing: Lexicon (${lexiconPath})`);
		}

		const cdaPath = resolve(cwd, settings.paths.sources.persona.cda);
		if (!existsSync(cdaPath)) {
			errors.push(`Critical Artifact missing: CDA (${cdaPath})`);
		}

		if (errors.length > 0) {
			console.error("\n❌ Environment Verification Failed:");
			errors.forEach((e) => {
				console.error(`   - ${e}`);
			});
			console.error(
				"\nPlease ensure you are running from the project root and all assets are present.",
			);
			process.exit(1);
		}

		console.error("   ✅ Environment Verified.");
	},
};
