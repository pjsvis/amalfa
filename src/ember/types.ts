export interface EmberSidecar {
	targetFile: string;
	generatedAt: string;
	confidence: number;
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
	sources: string[];
	minConfidence: number;
	backupDir: string;
	excludePatterns: string[];
}

export type EnrichmentType = "tag" | "link" | "summary" | "metadata";
