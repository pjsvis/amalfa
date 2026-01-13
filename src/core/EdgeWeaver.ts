import type { AmalfaConfig } from "@src/config/defaults";
import type { ResonanceDB } from "@src/resonance/db";
import { LouvainGate } from "./LouvainGate";

export class EdgeWeaver {
	private db: ResonanceDB;
	private superNodeThreshold = 50;
	// Lexicon for lookups (Slug -> ID)
	private lexicon: Map<string, string>;
	private stats = { checked: 0, rejected: 0 };

	constructor(
		db: ResonanceDB,
		context: { id: string; title?: string; aliases?: string[] }[] = [],
		config?: AmalfaConfig,
	) {
		this.db = db;
		this.lexicon = new Map();
		if (config?.graph?.tuning?.louvain?.superNodeThreshold) {
			this.superNodeThreshold = config.graph.tuning.louvain.superNodeThreshold;
		}

		// Build efficient lookup map (Slug -> ID)
		if (Array.isArray(context)) {
			for (const item of context) {
				if (!item || !item.id) continue;

				const id = item.id;
				// Index by ID
				this.lexicon.set(id.toLowerCase(), id);

				// Index by Label (Slugified)
				if (item.title) {
					this.lexicon.set(this.slugify(item.title), id);
				}

				// Index by Aliases
				if (item.aliases && Array.isArray(item.aliases)) {
					for (const alias of item.aliases) {
						this.lexicon.set(this.slugify(alias), id);
					}
				}
			}
		}
	}

	/**
	 * STRICT MODE: Scans content ONLY for explicit semantic tags and WikiLinks.
	 * No fuzzy token matching allowed.
	 *
	 * @param sourceNodeId The ID of the node containing the text
	 * @param content The text content to scan
	 */
	public weave(sourceNodeId: string, content: string): void {
		this.processTags(sourceNodeId, content);
		this.processWikiLinks(sourceNodeId, content);
		this.processMetadataTags(sourceNodeId, content);
		this.processMarkdownLinks(sourceNodeId, content);
	}

	private processTags(sourceId: string, content: string): void {
		// New Strict Syntax: [Tag: Value] or [Tag:Value]
		// Legacy Syntax Support: tag-something (keeping for backward compat for now, or removing?)
		// Brief says: "allow only WikiLinks, Tags"
		// Let's support both explicit [Tag: ...] and the inline tag-slug for now to be safe.

		// 1. Explicit [Tag: Concept]
		const explicitMatches = content.matchAll(/\[tag:\s*(.*?)\]/gi);
		for (const match of explicitMatches) {
			if (match[1]) {
				const tagValue = match[1].trim();
				const conceptId = this.lexicon.get(this.slugify(tagValue));
				if (conceptId) {
					this.safeInsertEdge(sourceId, conceptId, "TAGGED_AS");
				}
			}
		}

		// 2. Legacy `tag-slug` (Deprecated but ubiquitous)
		const matches = content.matchAll(/\btag-([\w-]+)/g);
		const legacyMatches = Array.from(matches);
		if (legacyMatches.length > 0) {
			console.warn(
				`⚠️  Legacy 'tag-slug' format detected in ${sourceId}. Use [tag: Concept] instead.`,
			);
		}
		for (const match of legacyMatches) {
			if (match[1]) {
				const tagStub = match[1].toLowerCase();
				const conceptId = this.lexicon.get(tagStub);
				if (conceptId) {
					this.safeInsertEdge(sourceId, conceptId, "EXEMPLIFIES");
				}
			}
		}
	}

	private processMetadataTags(sourceId: string, content: string): void {
		// Ported from ResonanceSync: Handle <!-- tags: [RELATION: Target] -->
		const tagBlockMatch = content.match(/<!-- tags: (.*?) -->/);
		if (tagBlockMatch?.[1]) {
			const tagString = tagBlockMatch[1];
			// Regex to find [KEY: Value] patterns
			const tagRegex = /\[([\w_]+):\s*([^\]]+)\]/g;

			const matches = tagString.matchAll(tagRegex);
			for (const match of matches) {
				if (match[1] && match[2]) {
					const relType = match[1].toLowerCase();
					const targetId = match[2].trim();

					// Filter out non-structural tags (Qualities, Hashtags)
					if (relType === "quality" || relType.startsWith("#")) continue;

					// Insert Edge
					this.safeInsertEdge(sourceId, targetId, relType.toUpperCase());
				}
			}
		}
	}

	private processWikiLinks(sourceId: string, content: string): void {
		// Match `[[Target]]` or `[[Target|Label]]`
		const matches = content.matchAll(/\[\[(.*?)(?:\|.*?)?\]\]/g);

		for (const match of matches) {
			if (!match[1]) continue;
			const rawTarget = match[1].trim();

			// 1. Try Lexicon Lookup (Prioritize Concepts)
			const conceptId = this.lexicon.get(this.slugify(rawTarget));
			if (conceptId) {
				this.safeInsertEdge(sourceId, conceptId, "CITES");
			} else {
				// 2. Assume it's a file path or direct ID link
				// In strict mode, if it's not in the lexicon/nodes, we might create a "Ghost Edge"
				// or just ignore it.
				// For now, if we can't resolve it to an ID, we ignore it to prevent Orphans.
				// (Orphan Rescue is a separate process).
			}
		}
	}

	private processMarkdownLinks(sourceId: string, content: string): void {
		// Match standard markdown links: [text](./file.md) or [text](file.md)
		const matches = content.matchAll(/\[([^\]]+)\]\(([^)]+\.md)\)/g);

		for (const match of matches) {
			if (!match[2]) continue;
			const linkPath = match[2].trim();

			// Skip external links (http/https)
			if (linkPath.startsWith("http://") || linkPath.startsWith("https://")) {
				continue;
			}

			// Extract filename from path
			const filename = linkPath.split("/").pop();
			if (!filename) continue;

			// Convert filename to node ID (same logic as ingestion)
			const targetId = filename
				.replace(".md", "")
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-");

			// Insert edge only if target node exists in lexicon
			if (this.lexicon.has(targetId)) {
				this.safeInsertEdge(sourceId, targetId, "LINKS_TO");
			}
		}
	}

	private safeInsertEdge(source: string, target: string, type: string) {
		const check = LouvainGate.check(
			this.db.getRawDb(),
			source,
			target,
			this.superNodeThreshold,
		);
		this.stats.checked++;
		if (check.allowed) {
			this.db.insertEdge(source, target, type);
		} else {
			this.stats.rejected++;
		}
	}

	public getStats() {
		return { ...this.stats };
	}

	private slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}
}
