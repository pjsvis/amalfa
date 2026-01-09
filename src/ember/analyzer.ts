import { GraphEngine } from "@src/core/GraphEngine";
import type { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import type { EmberSidecar } from "./types";

export class EmberAnalyzer {
	private log = getLogger("EmberAnalyzer");
	private graphEngine: GraphEngine;
	private communities: Record<string, number> | null = null;
	private isGraphLoaded = false;

	constructor(private db: ResonanceDB) {
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
					const nTags = (neighbor?.meta?.tags as string[]) || [];

					for (const tag of nTags) {
						tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
					}
					neighborCount++;
				}

				// Suggest tags present in > 50% of neighbors
				if (neighborCount > 0) {
					for (const [tag, count] of tagFreq.entries()) {
						if (count / neighborCount >= 0.5) {
							const currentTags = (node.meta?.tags as string[]) || [];
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

		// If no meaningful changes, return null
		if (proposedTags.length === 0 && proposedLinks.length === 0) {
			return null;
		}

		// 4. Construct Sidecar
		const sidecar: EmberSidecar = {
			targetFile: filePath,
			generatedAt: new Date().toISOString(),
			confidence: 0.8,
			changes: {
				tags: proposedTags.length > 0 ? { add: proposedTags } : undefined,
				links: proposedLinks.length > 0 ? { add: proposedLinks } : undefined,
			},
		};

		return sidecar;
	}
}
