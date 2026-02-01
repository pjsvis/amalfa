/**
 * AMALFA Configuration
 * Single Source of Truth: amalfa.settings.json
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { EmberConfig } from "@src/ember/types";
import { AmalfaSettingsSchema } from "./schema";

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
	get cache() {
		return join(this.base, "cache");
	},
	get scratchpad() {
		return join(this.base, "cache", "scratchpad");
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
		AMALFA_DIRS.cache,
		AMALFA_DIRS.scratchpad,
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

export interface ScratchpadConfig {
	enabled: boolean;
	thresholdBytes: number;
	maxAgeMs: number;
	maxCacheSizeBytes: number;
}

export interface SonarConfig {
	enabled: boolean;
	autoDiscovery: boolean;
	discoveryMethod: "cli" | "http";
	inferenceMethod: "http" | "cli";
	model: string;
	modelPriority: string[];
	host: string;
	port: number;
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
	cloud?: {
		enabled: boolean;
		provider: "ollama" | "openrouter";
		host: string;
		model: string;
		apiKey?: string;
	};
}

export interface LangExtractConfig {
	provider: "gemini" | "ollama" | "ollama_cloud" | "openrouter";
	fallbackOrder?: ("gemini" | "ollama" | "ollama_cloud" | "openrouter")[];
	gemini?: { model: string };
	ollama?: { host: string; model: string };
	ollama_cloud?: { host: string; model: string };
	openrouter?: { model: string };
}

/**
 * AMALFA Settings (Single Source of Truth)
 * Stored in amalfa.settings.json
 */
export interface AmalfaSettings {
	source?: string; // deprecated
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
	graph?: {
		tuning?: {
			louvain?: {
				persona?: number;
				experience?: number;
				superNodeThreshold?: number;
			};
		};
	};
	fixtures?: {
		lexicon?: string;
		cda?: string;
	};
	sonar: SonarConfig;
	phi3?: SonarConfig; // deprecated
	ember: EmberConfig;
	scratchpad?: ScratchpadConfig;
	langExtract?: LangExtractConfig;
}

// Alias for backward compatibility
export type AmalfaConfig = AmalfaSettings;

export enum SubstrateError {
	MISSING_API_KEY = "MISSING_API_KEY",
	INVALID_API_KEY = "INVALID_API_KEY",
	OUT_OF_CREDIT = "OUT_OF_CREDIT",
	NETWORK_ERROR = "NETWORK_ERROR",
	TIMEOUT = "TIMEOUT",
	UNKNOWN = "UNKNOWN_ERROR",
}

export interface SubstrateFailure {
	error: SubstrateError;
	provider: string;
	message: string;
	suggestion?: string;
}

export const DEFAULT_CONFIG: AmalfaSettings = {
	sources: [
		"./docs",
		"./*.md",
		"./src/**/*.md",
		"./scripts/**/*.md",
		"./debriefs/**/*.md",
	],
	database: join(".amalfa", "runtime", "resonance.db"),
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
	scratchpad: {
		enabled: true,
		thresholdBytes: 4 * 1024,
		maxAgeMs: 24 * 60 * 60 * 1000,
		maxCacheSizeBytes: 50 * 1024 * 1024,
	},
	watch: {
		enabled: true,
		debounce: 1000,
		notifications: true,
	},
	excludePatterns: ["node_modules", ".git", ".amalfa", "tests"],
	graph: {
		tuning: {
			louvain: {
				persona: 0.3,
				experience: 0.25,
				superNodeThreshold: 50,
			},
		},
	},
	fixtures: {
		lexicon: "scripts/fixtures/conceptual-lexicon-ref-v1.79.json",
		cda: "scripts/fixtures/cda-ref-v63.json",
	},
	sonar: {
		enabled: false,
		autoDiscovery: true,
		discoveryMethod: "cli",
		inferenceMethod: "http",
		model: "qwen2.5:1.5b",
		modelPriority: [],
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
	},
} as unknown as AmalfaSettings; // Cast because EmberConfig is imported type

/**
 * Load AMALFA settings from amalfa.settings.json
 * Merges with DEFAULT_CONFIG and enforces Schema
 */
export function loadSettings(exitOnError = true): AmalfaSettings {
	const settingsPath = join(process.cwd(), "amalfa.settings.json");

	if (!existsSync(settingsPath)) {
		if (!exitOnError) throw new Error(`Missing settings file: ${settingsPath}`);

		console.error("\n🛑 CRITICAL SYSTEM FAILURE: CONFIGURATION MISSING");
		console.error("==================================================");
		console.error("The Single Source of Truth file is missing:");
		console.error(`   ${settingsPath}`);
		console.error("--------------------------------------------------");
		console.error("The system cannot operate without this file.");
		console.error("To fix this immediately:");
		console.error("   cp amalfa.settings.example.json amalfa.settings.json");
		console.error("==================================================\n");
		process.exit(1);
	}

	try {
		const content = readFileSync(settingsPath, "utf-8");
		const rawUser = JSON.parse(content);

		// Merge with defaults
		const merged = {
			...DEFAULT_CONFIG,
			...rawUser,
			embeddings: {
				...DEFAULT_CONFIG.embeddings,
				...(rawUser.embeddings || {}),
			},
			watch: {
				...DEFAULT_CONFIG.watch,
				...(rawUser.watch || {}),
			},
			graph: {
				...DEFAULT_CONFIG.graph,
				...(rawUser.graph || {}),
				tuning: {
					...(DEFAULT_CONFIG.graph?.tuning || {}),
					...(rawUser.graph?.tuning || {}),
				},
			},
			fixtures: {
				...DEFAULT_CONFIG.fixtures,
				...(rawUser.fixtures || {}),
			},
			sonar: {
				...DEFAULT_CONFIG.sonar,
				...(rawUser.sonar || {}),
				tasks: {
					...DEFAULT_CONFIG.sonar.tasks,
					...(rawUser.sonar?.tasks || {}),
					search: {
						...DEFAULT_CONFIG.sonar.tasks.search,
						...(rawUser.sonar?.tasks?.search || {}),
					},
					metadata: {
						...DEFAULT_CONFIG.sonar.tasks.metadata,
						...(rawUser.sonar?.tasks?.metadata || {}),
					},
					content: {
						...DEFAULT_CONFIG.sonar.tasks.content,
						...(rawUser.sonar?.tasks?.content || {}),
					},
				},
			},
			ember: {
				...DEFAULT_CONFIG.ember,
				...(rawUser.ember || {}),
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

		// STRICT SCHEMA VALIDATION (Single Source of Truth Enforcement)
		// We validate the MERGED object to ensure completeness
		const settings = AmalfaSettingsSchema.parse(merged);

		return settings as AmalfaSettings;
	} catch (error) {
		if (!exitOnError) throw error;

		console.error("\n🛑 CONFIGURATION INVALID");
		console.error("==================================================");
		console.error(
			"The 'amalfa.settings.json' file violates the Source of Truth schema.",
		);
		console.error("Please fix the errors below:");
		console.error("--------------------------------------------------");
		console.error(error);
		console.error("==================================================\n");
		process.exit(1);
	}
}

/**
 * Legacy wrapper for backward compatibility
 */
export async function loadConfig(): Promise<AmalfaSettings> {
	return loadSettings();
}
