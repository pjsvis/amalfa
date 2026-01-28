import type { ExtractedGraph } from "@src/services/LangExtractClient";

export interface EmberSidecar {
	targetFile: string;
	generatedAt: string;
	confidence: number;
	graphData?: ExtractedGraph;
	changes: {
		tags?: {
			add: string[];
			remove?: string[];
		};
		frontmatter?: Record<string, unknown>;
		summary?: string;
		links?: {
			add: string[]; // List of IDs or Titles to add to 'related'
		};
	};
}

export interface EmberConfig {
	enabled: boolean;
	sources?: string[];
	minConfidence: number;
	backupDir: string;
	excludePatterns?: string[];
	autoSquash?: boolean;
}

export type EnrichmentType = "tag" | "link" | "summary" | "metadata";
