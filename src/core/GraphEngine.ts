import type { Database } from "bun:sqlite";
import { getLogger } from "@src/utils/Logger";
import { MultiDirectedGraph } from "graphology";
import communitiesLouvain from "graphology-communities-louvain";
import {
	connectedComponents,
	countConnectedComponents,
} from "graphology-components";
import betweenness from "graphology-metrics/centrality/betweenness";
import pagerank from "graphology-metrics/centrality/pagerank";
import { bidirectional as shortestPath } from "graphology-shortest-path/unweighted";
import { bfsFromNode } from "graphology-traversal";

const log = getLogger("GraphEngine");

export interface GraphNode {
	id: string;
	type?: string;
	title?: string;
	domain?: string;
	layer?: string;
	date?: string;
}

export interface GraphEdge {
	source: string;
	target: string;
	type?: string;
}

/**
 * GraphEngine - In-memory graph management using Graphology.
 * Provides fast traversal and analysis without database overhead.
 *
 * CITATION:
 * Graphology is published on Zenodo with a DOI (10.5281/zenodo.5681257).
 * Academic users are encouraged to cite it accordingly.
 */
export class GraphEngine {
	private graph: MultiDirectedGraph;

	constructor() {
		this.graph = new MultiDirectedGraph({ allowSelfLoops: true });
	}

	/**
	 * Load the graph from ResonanceDB (SQLite)
	 * Uses "hollow nodes" - only structural metadata, no embeddings.
	 */
	async load(db: Database): Promise<void> {
		log.info("Loading graph into memory...");
		const start = Date.now();

		this.graph.clear();

		// 1. Load Nodes
		const nodes = db
			.query("SELECT id, type, title, domain, layer, date FROM nodes")
			.all() as GraphNode[];
		for (const node of nodes) {
			this.graph.addNode(node.id, {
				type: node.type,
				title: node.title,
				domain: node.domain,
				layer: node.layer,
				date: node.date,
			});
		}

		// 2. Load Edges
		const edges = db
			.query("SELECT source, target, type FROM edges")
			.all() as GraphEdge[];
		for (const edge of edges) {
			try {
				if (
					this.graph.hasNode(edge.source) &&
					this.graph.hasNode(edge.target)
				) {
					this.graph.addEdge(edge.source, edge.target, {
						type: edge.type,
					});
				}
			} catch (err) {
				log.debug(
					{ source: edge.source, target: edge.target, error: err },
					"Failed to add edge",
				);
			}
		}

		log.info(
			{
				nodes: this.graph.order,
				edges: this.graph.size,
				elapsedMs: Date.now() - start,
			},
			"Graph loaded successfully",
		);
	}

	/**
	 * Get neighbors of a node
	 */
	getNeighbors(nodeId: string): string[] {
		if (!this.graph.hasNode(nodeId)) return [];
		return this.graph.neighbors(nodeId);
	}

	/**
	 * Get attributes of a specific node
	 */
	getNodeAttributes(nodeId: string): GraphNode | null {
		if (!this.graph.hasNode(nodeId)) return null;
		return this.graph.getNodeAttributes(nodeId) as GraphNode;
	}

	/**
	 * Find shortest path between two nodes
	 */
	findShortestPath(sourceId: string, targetId: string): string[] | null {
		if (!this.graph.hasNode(sourceId) || !this.graph.hasNode(targetId)) {
			return null;
		}
		return shortestPath(this.graph, sourceId, targetId);
	}

	/**
	 * Run Louvain community detection
	 */
	detectCommunities(): Record<string, number> {
		return communitiesLouvain(this.graph);
	}

	/**
	 * Get PageRank for all nodes
	 */
	getPagerank(): Record<string, number> {
		return pagerank(this.graph);
	}

	/**
	 * Get Betweenness Centrality for all nodes
	 */
	getBetweenness(): Record<string, number> {
		return betweenness(this.graph);
	}

	/**
	 * Get connected components
	 */
	getComponents(): string[][] {
		return connectedComponents(this.graph);
	}

	/**
	 * Get a summary of all metrics
	 */
	getMetrics() {
		const pr = this.getPagerank();
		const bc = this.getBetweenness();
		const communities = this.detectCommunities();

		return {
			pagerank: pr,
			betweenness: bc,
			communities: communities,
			components: this.getComponents().length,
			stats: this.getStats(),
		};
	}

	/**
	 * Calculate Adamic-Adar index for two nodes.
	 * Higher score = more likely to have a logical relationship based on specific shared neighbors.
	 * AA(u, v) = Sum of (1 / log(degree(w))) for each shared neighbor w.
	 */
	getAdamicAdar(nodeA: string, nodeB: string): number {
		if (!this.graph.hasNode(nodeA) || !this.graph.hasNode(nodeB)) return 0;
		if (nodeA === nodeB) return 0;

		const neighborsA = new Set(this.graph.neighbors(nodeA));
		const neighborsB = this.graph.neighbors(nodeB);
		let score = 0;

		for (const neighbor of neighborsB) {
			if (neighborsA.has(neighbor)) {
				const degree = this.graph.degree(neighbor);
				// degree > 1 because it's a shared neighbor (connected to at least A and B)
				if (degree > 1) {
					score += 1 / Math.log(degree);
				}
			}
		}

		return score;
	}

	/**
	 * Find structural candidates for new edges using Adamic-Adar.
	 * Identifies nodes that are not linked but share many specific neighbors.
	 */
	findStructuralCandidates(
		limit = 10,
	): { source: string; target: string; score: number }[] {
		const candidates: { source: string; target: string; score: number }[] = [];
		const nodes = this.graph.nodes();
		const seen = new Set<string>();

		for (const u of nodes) {
			const neighborsU = new Set(this.graph.neighbors(u));
			const twoHopPotential = new Set<string>();

			// Find nodes v that share at least one neighbor w with u
			for (const w of neighborsU) {
				for (const v of this.graph.neighbors(w)) {
					if (v !== u && !neighborsU.has(v)) {
						twoHopPotential.add(v);
					}
				}
			}

			for (const v of twoHopPotential) {
				const pairId = [u, v].sort().join("|");
				if (seen.has(pairId)) continue;
				seen.add(pairId);

				const score = this.getAdamicAdar(u, v);
				if (score > 0) {
					candidates.push({ source: u, target: v, score });
				}
			}
		}

		return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
	}

	/**
	 * Get graph statistics
	 */
	getStats() {
		return {
			nodes: this.graph.order,
			edges: this.graph.size,
			density:
				this.graph.size / (this.graph.order * (this.graph.order - 1) || 1),
		};
	}

	/**
	 * Export for external tools (e.g. visualization)
	 */
	getInternalGraph(): MultiDirectedGraph {
		return this.graph;
	}

	/**
	 * Traverse graph starting from a node using BFS
	 */
	traverse(startNodeId: string, maxDepth?: number): string[] {
		if (!this.graph.hasNode(startNodeId)) return [];

		const visited: string[] = [];
		bfsFromNode(this.graph, startNodeId, (node, _attr, depth) => {
			if (maxDepth !== undefined && depth > maxDepth) return true;
			visited.push(node);
			return false;
		});
		return visited;
	}

	validateIntegrity() {
		return {
			selfLoopCount: this.graph.selfLoopCount,
			connectedComponents: countConnectedComponents(this.graph),
			order: this.graph.order,
			size: this.graph.size,
		};
	}
}
