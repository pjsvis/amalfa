/**
 * AMALFA Configuration
 * Default settings that can be overridden via amalfa.config.{ts,js,json}
 */

import { mkdirSync, existsSync } from "fs";
import { join } from "path";

/** AMALFA directory structure */
export const AMALFA_DIRS = {
	base: ".amalfa",
	get logs() {
		return join(this.base, "logs");
	},
	get runtime() {
		return join(this.base, "runtime");
	},
} as const;

/** Initialize AMALFA directory structure */
export function initAmalfaDirs(): void {
	const dirs = [AMALFA_DIRS.base, AMALFA_DIRS.logs, AMALFA_DIRS.runtime];
	for (const dir of dirs) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}
}

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
		notifications?: boolean;
	};
	excludePatterns: string[];
	/** Graph analysis tuning parameters (optional) */
	graph?: {
		tuning?: {
			louvain?: {
				persona?: number;
				experience?: number;
			};
		};
	};
	/** Persona fixture paths (optional, for legacy Resonance features) */
	fixtures?: {
		lexicon?: string;
		cda?: string;
	};
	/** Phi3 multi-purpose sub-agent configuration */
	phi3: Phi3Config;
}

export interface Phi3Config {
	/** Enable Phi3 features */
	enabled: boolean;
	/** Auto-detect Ollama on startup */
	autoDiscovery: boolean;
	/** Use CLI for discovery (reliable) */
	discoveryMethod: "cli" | "http";
	/** Use HTTP for inference (faster) */
	inferenceMethod: "http" | "cli";
	/** Model name (auto-selected based on availability) */
	model: string;
	/** Priority order for model selection */
	modelPriority: string[];
	/** Ollama host */
	host: string;
	/** Port for Phi3 daemon service */
	port: number;
	/** Task-specific configuration */
	tasks: {
		search: {
			enabled: boolean;
			timeout: number;
			priority: "high" | "low";
		};
		metadata: {
			enabled: boolean;
			timeout: number;
			autoEnhance: boolean;
			batchSize: number;
		};
		content: {
			enabled: boolean;
			timeout: number;
			schedule: string;
		};
	};
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
		notifications: true,
	},
	excludePatterns: ["node_modules", ".git", ".amalfa"],
	// Optional graph tuning (for advanced use)
	graph: {
		tuning: {
			louvain: {
				persona: 0.3,
				experience: 0.25,
			},
		},
	},
	// Optional fixtures (for legacy Resonance features)
	fixtures: {
		lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
		cda: "scripts/fixtures/cda-ref-v63.json",
	},
	// Phi3 multi-purpose sub-agent configuration
	phi3: {
		enabled: false,
		autoDiscovery: true,
		discoveryMethod: "cli",
		inferenceMethod: "http",
		model: "phi3:latest",
		modelPriority: [
			"tinydolphin:latest",
			"tinyllama:latest",
			"phi3:latest",
			"mistral:7b-instruct-v0.3-q4_K_M",
			"llama3.1:8b",
		],
		host: "localhost:11434",
		port: 3012,
		tasks: {
			search: {
				enabled: true,
				timeout: 5000,
				priority: "high",
			},
			metadata: {
				enabled: true,
				timeout: 30000,
				autoEnhance: true,
				batchSize: 10,
			},
			content: {
				enabled: false,
				timeout: 300000,
				schedule: "daily",
			},
		},
	} satisfies Phi3Config,
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
					graph: {
						...DEFAULT_CONFIG.graph,
						...(userConfig.graph || {}),
						tuning: {
							...(DEFAULT_CONFIG.graph?.tuning || {}),
							...(userConfig.graph?.tuning || {}),
						},
					},
					fixtures: {
						...DEFAULT_CONFIG.fixtures,
						...(userConfig.fixtures || {}),
					},
					phi3: {
						...DEFAULT_CONFIG.phi3,
						...(userConfig.phi3 || {}),
						tasks: {
							...DEFAULT_CONFIG.phi3.tasks,
							...(userConfig.phi3?.tasks || {}),
							search: {
								...DEFAULT_CONFIG.phi3.tasks.search,
								...(userConfig.phi3?.tasks?.search || {}),
							},
							metadata: {
								...DEFAULT_CONFIG.phi3.tasks.metadata,
								...(userConfig.phi3?.tasks?.metadata || {}),
							},
							content: {
								...DEFAULT_CONFIG.phi3.tasks.content,
								...(userConfig.phi3?.tasks?.content || {}),
							},
						},
					} as Phi3Config,
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
