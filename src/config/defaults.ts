/**
 * AMALFA Configuration
 * Default settings that can be overridden via amalfa.config.{ts,js,json}
 */

export interface AmalfaConfig {
	/** @deprecated Use sources array instead */
	source?: string;
	sources?: string[];
	database: string;
	embeddings: {
		model: string;
		dimensions: number;
	};
	watch: {
		enabled: boolean;
		debounce: number;
	};
	excludePatterns: string[];
}

export const DEFAULT_CONFIG: AmalfaConfig = {
	sources: ["./docs"],
	database: ".amalfa/resonance.db",
	embeddings: {
		model: "BAAI/bge-small-en-v1.5",
		dimensions: 384,
	},
	watch: {
		enabled: true,
		debounce: 1000,
	},
	excludePatterns: ["node_modules", ".git", ".amalfa"],
};

/**
 * Load user configuration from project root
 * Checks for amalfa.config.{ts,js,json} in order
 */
export async function loadConfig(): Promise<AmalfaConfig> {
	const configFiles = [
		"amalfa.config.ts",
		"amalfa.config.js",
		"amalfa.config.json",
	];

	for (const configFile of configFiles) {
		try {
			const file = Bun.file(configFile);
			if (await file.exists()) {
				let userConfig: Partial<AmalfaConfig>;

				if (configFile.endsWith(".json")) {
					userConfig = await file.json();
				} else {
					// Dynamic import for .ts/.js
					const imported = await import(`${process.cwd()}/${configFile}`);
					userConfig = imported.default || imported;
				}

				// Merge with defaults
				const merged = {
					...DEFAULT_CONFIG,
					...userConfig,
					embeddings: {
						...DEFAULT_CONFIG.embeddings,
						...(userConfig.embeddings || {}),
					},
					watch: {
						...DEFAULT_CONFIG.watch,
						...(userConfig.watch || {}),
					},
				};

				// Normalize: Convert legacy 'source' to 'sources' array
				if (merged.source && !merged.sources) {
					merged.sources = [merged.source];
				}
				if (!merged.sources || merged.sources.length === 0) {
					merged.sources = ["./docs"];
				}
				delete merged.source; // Clean up legacy field

				return merged;
			}
		} catch (e) {
			// Silently continue to next config file
			continue;
		}
	}

	// Return defaults if no config found
	const defaultCopy = { ...DEFAULT_CONFIG };
	// Ensure sources is always an array
	if (!defaultCopy.sources || defaultCopy.sources.length === 0) {
		defaultCopy.sources = ["./docs"];
	}
	return defaultCopy;
}
