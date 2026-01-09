import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const ResonanceConfigSchema = z.object({
	paths: z.object({
		database: z.object({
			resonance: z.string().default("public/resonance.db"),
		}),
		sources: z.object({
			experience: z.object({
				directories: z
					.array(z.string())
					.default(["debriefs", "playbooks", "briefs"]),
			}),
			persona: z.object({
				lexicon: z
					.string()
					.default("scripts/fixtures/conceptual-lexicon-ref-v1.79.json"),
				cda: z.string().default("scripts/fixtures/cda-ref-v63.json"),
			}),
		}),
	}),
});

export type ResonanceConfig = z.infer<typeof ResonanceConfigSchema>;

export function loadConfig(): ResonanceConfig {
	const configPath = join(process.cwd(), "polyvis.settings.json");
	if (!existsSync(configPath)) {
		throw new Error("polyvis.settings.json not found");
	}

	// DEPRECATION WARNING
	console.warn(
		"⚠️  WARNING: polyvis.settings.json is DEPRECATED and will be removed in v2.0",
	);
	console.warn("   Please migrate to amalfa.config.json");
	console.warn("   See: docs/CONFIG_UNIFICATION.md\n");

	try {
		const data = JSON.parse(readFileSync(configPath, "utf-8"));
		return ResonanceConfigSchema.parse(data);
	} catch (e) {
		console.error("❌ Invalid configuration file:", e);
		throw e;
	}
}
