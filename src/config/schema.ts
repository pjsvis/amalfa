import { z } from "zod";

export const ProviderEnum = z.enum([
	"gemini",
	"ollama",
	"ollama_cloud",
	"openrouter",
]);

export const LangExtractConfigSchema = z.object({
	provider: ProviderEnum,
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

export const SonarConfigSchema = z.object({
	enabled: z.boolean(),
	autoDiscovery: z.boolean(),
	discoveryMethod: z.enum(["cli", "http"]),
	inferenceMethod: z.enum(["http", "cli"]),
	model: z.string(),
	modelPriority: z.array(z.string()),
	host: z.string(),
	port: z.number(),
	tasks: z.object({
		search: z.object({
			enabled: z.boolean(),
			timeout: z.number(),
			priority: z.enum(["high", "low"]),
		}),
		metadata: z.object({
			enabled: z.boolean(),
			timeout: z.number(),
			autoEnhance: z.boolean(),
			batchSize: z.number(),
		}),
		content: z.object({
			enabled: z.boolean(),
			timeout: z.number(),
			schedule: z.string(),
		}),
	}),
	cloud: z
		.object({
			enabled: z.boolean(),
			provider: z.enum(["ollama", "openrouter"]),
			host: z.string(),
			model: z.string(),
			apiKey: z.string().optional(),
		})
		.optional(),
});

export const EmberConfigSchema = z.object({
	enabled: z.boolean(),
	minConfidence: z.number(),
	autoSquash: z.boolean(),
	backupDir: z.string(),
});

export const AmalfaSettingsSchema = z.object({
	sources: z.array(z.string()).optional(),
	database: z.string(),
	embeddings: z.object({
		model: z.string(),
		dimensions: z.number(),
	}),
	watch: z.object({
		enabled: z.boolean(),
		debounce: z.number(),
		notifications: z.boolean().optional(),
	}),
	excludePatterns: z.array(z.string()),
	graph: z.any().optional(), // Tuning params, loose schema for now
	fixtures: z
		.object({
			lexicon: z.string().optional(),
			cda: z.string().optional(),
		})
		.optional(),
	sonar: SonarConfigSchema,
	ember: EmberConfigSchema.optional(),
	langExtract: LangExtractConfigSchema.optional(), // Optional because legacy configs might lack it, but stricter is better? User said merge everything.
});
