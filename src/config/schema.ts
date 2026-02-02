/**
 * AMALFA Configuration Schema
 * Single Source of Truth: This is the ultimate gatekeeper for configuration.
 * Default values are injected here via Zod's .default() method.
 *
 * NFB-01: Configuration Rationalisation - No "Shadow Truths" outside this file.
 */

import { join } from "node:path";
import { z } from "zod";

// ============================================================================
// Provider Enums
// ============================================================================

export const ProviderEnum = z.enum([
	"gemini",
	"ollama",
	"ollama_cloud",
	"openrouter",
]);

// ============================================================================
// Sub-Schemas (defined with field-level defaults)
// ============================================================================

export const SonarTasksSearchSchema = z.object({
	enabled: z.boolean().default(true),
	timeout: z.number().default(5000),
	priority: z.enum(["high", "low"]).default("high"),
});

export const SonarTasksMetadataSchema = z.object({
	enabled: z.boolean().default(true),
	timeout: z.number().default(30000),
	autoEnhance: z.boolean().default(true),
	batchSize: z.number().default(10),
});

export const SonarTasksContentSchema = z.object({
	enabled: z.boolean().default(false),
	timeout: z.number().default(300000),
	schedule: z.string().default("daily"),
});

export const SonarCloudSchema = z.object({
	enabled: z.boolean().default(false),
	provider: z.enum(["ollama", "openrouter"]).default("openrouter"),
	host: z.string().default("openrouter.ai/api/v1"),
	model: z.string().default("qwen/qwen-2.5-72b-instruct"),
	apiKey: z.string().optional(),
});

export const SonarConfigSchema = z.object({
	enabled: z.boolean().default(false),
	autoDiscovery: z.boolean().default(true),
	discoveryMethod: z.enum(["cli", "http"]).default("cli"),
	inferenceMethod: z.enum(["http", "cli"]).default("http"),
	model: z.string().default("qwen2.5:1.5b"),
	modelPriority: z.array(z.string()).default([]),
	host: z.string().default("localhost:11434"),
	port: z.number().default(3012),
	tasks: z.object({
		search: z.object({
			enabled: z.boolean().default(true),
			timeout: z.number().default(5000),
			priority: z.enum(["high", "low"]).default("high"),
		}),
		metadata: z.object({
			enabled: z.boolean().default(true),
			timeout: z.number().default(30000),
			autoEnhance: z.boolean().default(true),
			batchSize: z.number().default(10),
		}),
		content: z.object({
			enabled: z.boolean().default(false),
			timeout: z.number().default(300000),
			schedule: z.string().default("daily"),
		}),
	}),
	cloud: z.object({
		enabled: z.boolean().default(false),
		provider: z.enum(["ollama", "openrouter"]).default("openrouter"),
		host: z.string().default("openrouter.ai/api/v1"),
		model: z.string().default("qwen/qwen-2.5-72b-instruct"),
		apiKey: z.string().optional(),
	}),
});

export const EmberConfigSchema = z.object({
	enabled: z.boolean().default(true),
	minConfidence: z.number().default(0.8),
	autoSquash: z.boolean().default(false),
	backupDir: z.string().default(join(".amalfa", "backups", "ember")),
});

export const LangExtractConfigSchema = z.object({
	provider: ProviderEnum.default("openrouter"),
	fallbackOrder: z.array(ProviderEnum).optional(),
	gemini: z.object({ model: z.string() }).optional(),
	ollama: z
		.object({ host: z.string().optional(), model: z.string() })
		.optional(),
	ollama_cloud: z
		.object({ host: z.string().optional(), model: z.string() })
		.optional(),
	openrouter: z.object({ model: z.string() }).optional(),
});

export const ScratchpadConfigSchema = z.object({
	enabled: z.boolean().default(true),
	thresholdBytes: z.number().default(4 * 1024), // 4KB
	maxAgeMs: z.number().default(24 * 60 * 60 * 1000), // 24 hours
	maxCacheSizeBytes: z.number().default(50 * 1024 * 1024), // 50MB
	includePreview: z.boolean().default(true),
	previewLength: z.number().default(200),
});

export const GraphTuningLouvainSchema = z.object({
	persona: z.number().default(0.3),
	experience: z.number().default(0.25),
	superNodeThreshold: z.number().default(50),
});

export const GraphConfigSchema = z.object({
	tuning: z.object({
		louvain: z.object({
			persona: z.number().default(0.3),
			experience: z.number().default(0.25),
			superNodeThreshold: z.number().default(50),
		}),
	}),
});

export const FixturesConfigSchema = z.object({
	lexicon: z
		.string()
		.default(join("scripts", "fixtures", "conceptual-lexicon-ref-v1.79.json")),
	cda: z.string().default(join("scripts", "fixtures", "cda-ref-v63.json")),
});

// ============================================================================
// Main Settings Schema
// ============================================================================

export const AmalfaSettingsSchema = z.object({
	// Sources & Environment
	sources: z
		.array(z.string())
		.default([
			"./docs",
			"./*.md",
			"./src/**/*.md",
			"./scripts/**/*.md",
			"./debriefs/**/*.md",
		]),
	excludePatterns: z
		.array(z.string())
		.default(["node_modules", ".git", ".amalfa", "tests"]),

	// Database
	database: z.string().default(join(".amalfa", "runtime", "resonance.db")),

	// Embeddings Engine
	embeddings: z.object({
		model: z.string().default("BAAI/bge-small-en-v1.5"),
		dimensions: z.number().default(384),
	}),

	// File Watching
	watch: z.object({
		enabled: z.boolean().default(true),
		debounce: z.number().default(1000),
		notifications: z.boolean().default(true),
	}),

	// Graph Configuration
	graph: z.object({
		tuning: z.object({
			louvain: z.object({
				persona: z.number().default(0.3),
				experience: z.number().default(0.25),
				superNodeThreshold: z.number().default(50),
			}),
		}),
	}),

	// Fixtures
	fixtures: z.object({
		lexicon: z
			.string()
			.default(
				join("scripts", "fixtures", "conceptual-lexicon-ref-v1.79.json"),
			),
		cda: z.string().default(join("scripts", "fixtures", "cda-ref-v63.json")),
	}),

	// Sonar (Local/Cloud Inference)
	sonar: z.object({
		enabled: z.boolean().default(false),
		autoDiscovery: z.boolean().default(true),
		discoveryMethod: z.enum(["cli", "http"]).default("cli"),
		inferenceMethod: z.enum(["http", "cli"]).default("http"),
		model: z.string().default("qwen2.5:1.5b"),
		modelPriority: z.array(z.string()).default([]),
		host: z.string().default("localhost:11434"),
		port: z.number().default(3012),
		tasks: z.object({
			search: z.object({
				enabled: z.boolean().default(true),
				timeout: z.number().default(5000),
				priority: z.enum(["high", "low"]).default("high"),
			}),
			metadata: z.object({
				enabled: z.boolean().default(true),
				timeout: z.number().default(30000),
				autoEnhance: z.boolean().default(true),
				batchSize: z.number().default(10),
			}),
			content: z.object({
				enabled: z.boolean().default(false),
				timeout: z.number().default(300000),
				schedule: z.string().default("daily"),
			}),
		}),
		cloud: z.object({
			enabled: z.boolean().default(false),
			provider: z.enum(["ollama", "openrouter"]).default("openrouter"),
			host: z.string().default("openrouter.ai/api/v1"),
			model: z.string().default("qwen/qwen-2.5-72b-instruct"),
			apiKey: z.string().optional(),
		}),
	}),

	// Ember (Agentic Memory/Context)
	ember: z.object({
		enabled: z.boolean().default(true),
		minConfidence: z.number().default(0.8),
		autoSquash: z.boolean().default(false),
		backupDir: z.string().default(join(".amalfa", "backups", "ember")),
	}),

	// Scratchpad (Transient cognitive space)
	scratchpad: z.object({
		enabled: z.boolean().default(true),
		thresholdBytes: z.number().default(4 * 1024), // 4KB
		maxAgeMs: z.number().default(24 * 60 * 60 * 1000), // 24 hours
		maxCacheSizeBytes: z.number().default(50 * 1024 * 1024), // 50MB
		includePreview: z.boolean().default(true),
		previewLength: z.number().default(200),
	}),

	// Language Extraction
	langExtract: z.object({
		provider: ProviderEnum.default("openrouter"),
		fallbackOrder: z.array(ProviderEnum).optional(),
		gemini: z.object({ model: z.string() }).optional(),
		ollama: z
			.object({ host: z.string().optional(), model: z.string() })
			.optional(),
		ollama_cloud: z
			.object({ host: z.string().optional(), model: z.string() })
			.optional(),
		openrouter: z.object({ model: z.string() }).optional(),
	}),
});

// Export inferred type for consumers
export type AmalfaSettings = z.infer<typeof AmalfaSettingsSchema>;

// Backward compatibility alias
export type { AmalfaSettings as AmalfaConfig };

// SubstrateError enum for LLM provider failures
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

// Export sub-schema types for consumers
export type SonarConfig = z.infer<typeof SonarConfigSchema>;
export type EmberConfig = z.infer<typeof EmberConfigSchema>;
export type LangExtractConfig = z.infer<typeof LangExtractConfigSchema>;
export type ScratchpadConfig = z.infer<typeof ScratchpadConfigSchema>;
export type GraphConfig = z.infer<typeof GraphConfigSchema>;
export type FixturesConfig = z.infer<typeof FixturesConfigSchema>;
