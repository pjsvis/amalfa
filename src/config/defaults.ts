/**
 * AMALFA Configuration
 * Default settings that can be overridden via amalfa.config.{ts,js,json}
 */

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** AMALFA directory structure */
export const AMALFA_DIRS = {
	base: ".amalfa",
	get logs() {
		return join(this.base, "logs");
	},
	get runtime() {
		return join(this.base, "runtime");
	},
	get agent() {
		return join(this.base, "agent");
	},
	get tasks() {
		return {
			pending: join(this.base, "agent", "tasks", "pending"),
			processing: join(this.base, "agent", "tasks", "processing"),
			completed: join(this.base, "agent", "tasks", "completed"),
		};
	},
} as const;

/** Initialize AMALFA directory structure */
export function initAmalfaDirs(): void {
	const dirs = [
		AMALFA_DIRS.base,
		AMALFA_DIRS.logs,
		AMALFA_DIRS.runtime,
		AMALFA_DIRS.tasks.pending,
		AMALFA_DIRS.tasks.processing,
		AMALFA_DIRS.tasks.completed,
	];
	for (const dir of dirs) {
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}
}

import type { EmberConfig } from "@src/ember/types";

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
				superNodeThreshold?: number;
			};
		};
	};
	/** Persona fixture paths (optional, for legacy Resonance features) */
	fixtures?: {
		lexicon?: string;
		cda?: string;
	};
	/** Sonar multi-purpose sub-agent configuration */
	sonar: SonarConfig;
	/** @deprecated Use sonar instead */
	phi3?: SonarConfig;
	/** Ember automated enrichment configuration */
	ember: EmberConfig;
}

export interface SonarConfig {
	/** Enable Sonar features */
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
	/** Port for Sonar daemon service */
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
	/** Cloud inference configuration (dev-cloud/prod-local strategy) */
	cloud?: {
		/** Enable cloud inference (overrides local Ollama) */
		enabled: boolean;
		/** Provider type: 'ollama' for self-hosted, 'openrouter' for OpenRouter.ai */
		provider: "ollama" | "openrouter";
		/** API endpoint (e.g., your-gpu-server:11434 or openrouter.ai/api/v1) */
		host: string;
		/** Model to use on cloud (can be larger than local) */
		model: string;
		/** API key for authenticated endpoints (required for OpenRouter) */
		apiKey?: string;
	};
}

export const DEFAULT_CONFIG: AmalfaConfig = {
	sources: [
		"./docs",
		"./*.md", // Root documentation (README.md, _CURRENT_TASK.md, etc.)
		"./src/**/*.md", // Documentation co-located with code
		"./scripts/**/*.md", // Documentation in scripts
	],
	database: ".amalfa/resonance.db",
	embeddings: {
		model: "BAAI/bge-small-en-v1.5",
		dimensions: 384,
	},
	ember: {
		enabled: true,
		minConfidence: 0.8,
		autoSquash: false,
		backupDir: ".amalfa/backups/ember",
	},
	watch: {
		enabled: true,
		debounce: 1000,
		notifications: true,
	},
	excludePatterns: ["node_modules", ".git", ".amalfa", "tests"],
	// Optional graph tuning (for advanced use)
	graph: {
		tuning: {
			louvain: {
				persona: 0.3,
				experience: 0.25,
				superNodeThreshold: 50,
			},
		},
	},
	// Optional fixtures (for legacy Resonance features)
	fixtures: {
		lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
		cda: "scripts/fixtures/cda-ref-v63.json",
	},
	// Sonar multi-purpose sub-agent configuration
	sonar: {
		enabled: false,
		autoDiscovery: true,
		discoveryMethod: "cli",
		inferenceMethod: "http",
		model: "qwen2.5:1.5b",
		modelPriority: [
			"qwen2.5:1.5b", // Best-in-class reasoning for size
			"tinydolphin:latest",
			"tinyllama:latest",
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
	} satisfies SonarConfig,
};

// Aliasing for backward compatibility
export type Phi3Config = SonarConfig;

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

				// Handle legacy phi3 key
				if (userConfig.phi3 && !userConfig.sonar) {
					userConfig.sonar = userConfig.phi3;
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
					sonar: {
						...DEFAULT_CONFIG.sonar,
						...(userConfig.sonar || {}),
						tasks: {
							...DEFAULT_CONFIG.sonar.tasks,
							...(userConfig.sonar?.tasks || {}),
							search: {
								...DEFAULT_CONFIG.sonar.tasks.search,
								...(userConfig.sonar?.tasks?.search || {}),
							},
							metadata: {
								...DEFAULT_CONFIG.sonar.tasks.metadata,
								...(userConfig.sonar?.tasks?.metadata || {}),
							},
							content: {
								...DEFAULT_CONFIG.sonar.tasks.content,
								...(userConfig.sonar?.tasks?.content || {}),
							},
						},
					} as SonarConfig,
					ember: {
						...DEFAULT_CONFIG.ember,
						...(userConfig.ember || {}),
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
		} catch (_e) {}
	}

	// Return defaults if no config found
	const defaultCopy = { ...DEFAULT_CONFIG };
	// Ensure sources is always an array
	if (!defaultCopy.sources || defaultCopy.sources.length === 0) {
		defaultCopy.sources = ["./docs"];
	}
	return defaultCopy;
}
