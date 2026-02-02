import { GraphEngine } from "@src/core/GraphEngine";
import type { ResonanceDB } from "@src/resonance/db";
import type {
	ExtractedGraph,
	LangExtractClient,
} from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";
import { toRootRelative } from "@src/utils/projectRoot";
import type { EmberSidecar } from "./types";

export class EmberAnalyzer {
	private log = getLogger("EmberAnalyzer");
	private graphEngine: GraphEngine;
	private communities: Record<string, number> | null = null;
	private isGraphLoaded = false;

	constructor(
		private db: ResonanceDB,
		private langClient?: LangExtractClient,
	) {
		this.graphEngine = new GraphEngine();
	}
	/**
	 * Pre-load graph data for batch analysis
	 */
	async prepare() {
		this.log.info("Loading graph engine for analysis...");
		await this.graphEngine.load(this.db.getRawDb());
		this.communities = this.graphEngine.detectCommunities();
		this.isGraphLoaded = true;
		this.log.info("Graph engine ready.");
	}

	/**
	 * Analyze a file and generate enrichment proposals
	 */
	async analyze(
		filePath: string,
		content: string,
	): Promise<EmberSidecar | null> {
		this.log.info(`Analyzing ${filePath}...`);

		// Lazy load if not ready
		if (!this.isGraphLoaded) {
			await this.prepare();
		}

		// 1. Identify Node in Graph
		const filename = filePath.split("/").pop() || "unknown";
		const id = filename
			.replace(/\.(md|ts|js)$/, "")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "-");

		const node = this.db.getNode(id);
		if (!node) {
			this.log.warn(`Node ${id} not found in graph. Skipping analysis.`);
			return null;
		}

		const proposedTags: string[] = [];
		const proposedLinks: string[] = [];
		let extractedGraph: unknown;

		// 2. Community-based Tag Suggestion
		if (this.communities && this.communities[id] !== undefined) {
			const communityId = this.communities[id];
			const communityNodes = Object.entries(this.communities)
				.filter(([_, comm]) => comm === communityId)
				.map(([nId]) => nId);

			// Only analyze if community is large enough
			if (communityNodes.length > 2) {
				const tagFreq = new Map<string, number>();
				let neighborCount = 0;

				// Analyze neighbors specifically (stronger signal than whole community)
				const neighbors = this.graphEngine.getNeighbors(id);

				for (const neighborId of neighbors) {
					const neighbor = this.db.getNode(neighborId);
					// Robust tag extraction: handle array, string, or undefined
					const rawTags = neighbor?.meta?.tags;
					const nTags: string[] = Array.isArray(rawTags)
						? rawTags
						: typeof rawTags === "string"
							? [rawTags]
							: [];

					for (const tag of nTags) {
						tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
					}
					neighborCount++;
				}

				// Suggest tags present in > 50% of neighbors
				if (neighborCount > 0) {
					for (const [tag, count] of tagFreq.entries()) {
						if (count / neighborCount >= 0.5) {
							const rawNodeTags = node.meta?.tags;
							const currentTags: string[] = Array.isArray(rawNodeTags)
								? rawNodeTags
								: typeof rawNodeTags === "string"
									? [rawNodeTags]
									: [];

							if (!currentTags.includes(tag) && !proposedTags.includes(tag)) {
								proposedTags.push(tag);
							}
						}
					}
				}
			}
		}

		// 3. Heuristics (Stub detection)
		const tags = (node.meta?.tags as string[]) || [];
		if (content.length < 100 && !tags.includes("stub")) {
			proposedTags.push("stub");
		}

		// 5. LLM Extraction (LangExtract Sidecar)
		if (this.langClient && content.length > 200) {
			try {
				const currentTags = Array.isArray(node.meta?.tags)
					? (node.meta?.tags as string[])
					: [];

				const extracted = await this.langClient.extract(content);
				extractedGraph = extracted;

				// Expecting { entities: [{ name: "foo" }], ... }
				if (extracted?.entities && Array.isArray(extracted.entities)) {
					this.log.debug(
						{ file: filename, count: extracted.entities.length },
						"Extracted entities via Sidecar",
					);

					for (const ent of extracted.entities) {
						// Simple heuristic: Use entity name as tag if not present
						// sanitize tag: lowercase, replace non-alphanumeric with dashes, trim dashes
						const tagName = ent.name
							.toLowerCase()
							.replace(/[^a-z0-9]+/g, "-")
							.replace(/^-+|-+$/g, "");

						// Filter out short tags and numeric-only/numeric-dash tags
						if (
							tagName.length > 1 &&
							!/^[\d-]+$/.test(tagName) &&
							!currentTags.includes(tagName) &&
							!proposedTags.includes(tagName)
						) {
							proposedTags.push(tagName);
						}
					}
				}
			} catch (e) {
				// Don't fail the whole analysis if sidecar fails (e.g. rate limit, no API key)
				this.log.warn({ err: e }, "LangExtract sidecar failed for file");
			}
		}

		// If no meaningful changes, return null
		if (
			proposedTags.length === 0 &&
			proposedLinks.length === 0 &&
			!extractedGraph
		) {
			return null;
		}
		// 4. Construct Sidecar
		const sidecar: EmberSidecar = {
			targetFile: toRootRelative(filePath),
			generatedAt: new Date().toISOString(),
			confidence: 0.8,
			graphData: (extractedGraph as ExtractedGraph | undefined) || undefined,
			changes: {
				tags: proposedTags.length > 0 ? { add: proposedTags } : undefined,
				links: proposedLinks.length > 0 ? { add: proposedLinks } : undefined,
			},
		};

		return sidecar;
	}
}
