import type { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { fromRootRelative } from "@src/utils/projectRoot";
import type { GraphEngine } from "./GraphEngine";
import type { VectorEngine } from "./VectorEngine";

const log = getLogger("GraphGardener");

export interface BridgeSuggestion {
	sourceId: string;
	targetId: string;
	reason: string;
	similarity: number;
}

export interface ClusterInsight {
	clusterId: number;
	nodes: string[];
	suggestedTag?: string;
}

/**
 * GraphGardener - Semantic Graph Optimization
 * Exploits the duality of Vector Search (Semantic) and Graphology (Structural)
 * to find missing links and optimize knowledge topology.
 */
export class GraphGardener {
	constructor(
		private db: ResonanceDB,
		private graph: GraphEngine,
		private vector: VectorEngine,
	) {}

	/**
	 * findGaps: Finds nodes that are semantically similar but structurally distant.
	 * These are "hidden relationships" that should probably be links or shared tags.
	 */
	async findGaps(
		limit = 10,
		similarityThreshold = 0.82,
	): Promise<BridgeSuggestion[]> {
		log.info("Analyzing graph for semantic gaps...");
		const candidates = this.db
			.getRawDb()
			.query(
				"SELECT id, embedding FROM nodes WHERE embedding IS NOT NULL LIMIT 100",
			)
			.all() as { id: string; embedding: Uint8Array }[];

		const suggestions: BridgeSuggestion[] = [];

		for (const node of candidates) {
			if (!node.embedding) continue;

			// Convert blob to Float32Array for search
			const queryFloats = new Float32Array(
				node.embedding.buffer,
				node.embedding.byteOffset,
				node.embedding.byteLength / 4,
			);

			// 1. Get Vector Neighbors using stored embedding (FAFCAS Dot Product)
			const semanticNeighbors = await this.vector.searchByVector(
				queryFloats,
				5,
			);

			// 2. Get Graph Neighbors
			const graphNeighbors = new Set(this.graph.getNeighbors(node.id));

			for (const sn of semanticNeighbors) {
				if (sn.id === node.id) continue;
				if (sn.score < similarityThreshold) continue;

				// 3. If semantically close but NOT a graph neighbor -> Potential GAP
				if (!graphNeighbors.has(sn.id)) {
					// Check if inverse already in suggestions
					if (
						!suggestions.find(
							(s) =>
								(s.sourceId === node.id && s.targetId === sn.id) ||
								(s.sourceId === sn.id && s.targetId === node.id),
						)
					) {
						suggestions.push({
							sourceId: node.id,
							targetId: sn.id,
							reason: "Semantic proximity without structural link",
							similarity: sn.score,
						});
					}
				}
			}
		}

		return suggestions
			.sort((a, b) => b.similarity - a.similarity)
			.slice(0, limit);
	}

	/**
	 * findStructuralGaps: Finds nodes that share significant structural context (Adamic-Adar)
	 * but are not directly linked. This is pure topological link prediction.
	 */
	findStructuralGaps(limit = 10): BridgeSuggestion[] {
		log.info("Analyzing graph for structural gaps (Adamic-Adar)...");
		const candidates = this.graph.findStructuralCandidates(limit);

		return candidates.map((c) => ({
			sourceId: c.source,
			targetId: c.target,
			reason: `Structural Adamic-Adar overlap (score: ${c.score.toFixed(2)})`,
			similarity: c.score,
		}));
	}

	/**
	 * analyzeCommunities: Provides insights into detected clusters.
	 */
	analyzeCommunities(): ClusterInsight[] {
		const communities = this.graph.detectCommunities();
		const clusters: Map<number, string[]> = new Map();

		for (const [nodeId, clusterId] of Object.entries(communities)) {
			if (!clusters.has(clusterId)) clusters.set(clusterId, []);
			clusters.get(clusterId)?.push(nodeId);
		}

		return Array.from(clusters.entries()).map(([clusterId, nodes]) => ({
			clusterId,
			nodes,
		}));
	}

	/**
	 * summarizeCluster: Logic resides in agent calling LLM,
	 * but helper to get representative nodes is useful.
	 */
	getClusterRepresentatives(nodes: string[], top = 3): string[] {
		// Get highest PageRank nodes within this set
		const pr = this.graph.getPagerank();
		return nodes.sort((a, b) => (pr[b] || 0) - (pr[a] || 0)).slice(0, top);
	}

	/**
	 * findRelated: Search for nodes related to a query.
	 */
	async findRelated(query: string, limit = 5) {
		return await this.vector.search(query, limit);
	}

	/**
	 * weaveTimeline: Proposes FOLLOWS/PRECEDES edges based on date metadata.
	 */
	weaveTimeline(): BridgeSuggestion[] {
		const nodes = this.db
			.getRawDb()
			.query("SELECT id, date FROM nodes WHERE date IS NOT NULL")
			.all() as { id: string; date: string }[];

		if (nodes.length < 2) return [];

		// Sort by date
		nodes.sort((a, b) => a.date.localeCompare(b.date));

		const clusters = this.analyzeCommunities();
		const nodeToCluster = new Map<string, number>();
		for (const c of clusters) {
			for (const nodeId of c.nodes) {
				nodeToCluster.set(nodeId, c.clusterId);
			}
		}

		const suggestions: BridgeSuggestion[] = [];
		const lastInCluster = new Map<number, { id: string; date: string }>();

		for (const node of nodes) {
			const clusterId = nodeToCluster.get(node.id);
			if (clusterId === undefined) continue;

			const last = lastInCluster.get(clusterId);
			if (last) {
				suggestions.push({
					sourceId: last.id,
					targetId: node.id,
					reason: `Temporal sequence (${last.date} -> ${node.date}) in community ${clusterId}`,
					similarity: 1.0,
				});
			}

			lastInCluster.set(clusterId, node);
		}

		return suggestions;
	}

	/**
	 * identifyHubs: Finds nodes with high betweenness or pagerank that lack tags.
	 */

	/**
	 * resolveSource: Returns the absolute file path for a node ID.
	 * Converts root-relative paths to absolute paths.
	 */
	resolveSource(nodeId: string): string | null {
		const row = this.db
			.getRawDb()
			.query("SELECT meta FROM nodes WHERE id = ?")
			.get(nodeId) as { meta: string } | null;
		if (row?.meta) {
			try {
				const meta = JSON.parse(row.meta);
				if (!meta.source) return null;

				// Convert root-relative path to absolute
				return fromRootRelative(meta.source);
			} catch {
				return null;
			}
		}
		return null;
	}

	/**
	 * getContent: Reads the raw markdown content for a node.
	 */
	async getContent(nodeId: string): Promise<string | null> {
		const sourcePath = this.resolveSource(nodeId);
		if (!sourcePath) return null;
		try {
			return await Bun.file(sourcePath).text();
		} catch {
			return null;
		}
	}

	identifyHubs(top = 5) {
		const pr = this.graph.getPagerank();
		const bc = this.graph.getBetweenness();

		const nodes = Object.keys(pr).map((id) => ({
			id,
			pagerank: pr[id],
			betweenness: bc[id],
			score: (pr[id] || 0) + (bc[id] || 0),
		}));

		return nodes.sort((a, b) => b.score - a.score).slice(0, top);
	}
}
