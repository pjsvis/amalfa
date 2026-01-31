export interface SidecarManifestEntry {
	hash: string; // Content Hash (Key for Cache)
	path: string; // Relative Path to Source File
	uuid?: string; // Document UUID (if available at scan time)
	lastSeen: string; // ISO Date
}

export interface ExtractedEntity {
	name: string;
	type: string;
	description?: string;
}

export interface ExtractedRelation {
	source: string;
	target: string;
	type: string;
	description?: string;
}

/**
 * Structure of the cached sidecar file content.
 */
export interface LangExtractSidecar {
	entities: ExtractedEntity[];
	relationships: ExtractedRelation[];
	// Concepts might be present in some versions or LLM outputs
	concepts?: ExtractedEntity[];
}
