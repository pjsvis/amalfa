import type { Database } from "bun:sqlite";
import { MultiDirectedGraph } from "graphology";
import { bidirectional as shortestPath } from "graphology-shortest-path/unweighted";
import communitiesLouvain from "graphology-communities-louvain";
import pagerank from "graphology-metrics/centrality/pagerank";
import betweenness from "graphology-metrics/centrality/betweenness";
import { connectedComponents } from "graphology-components";
import { getLogger } from "@src/utils/Logger";

const log = getLogger("GraphEngine");

export interface GraphNode {
	id: string;
	type?: string;
	title?: string;
	domain?: string;
	layer?: string;
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
			.query("SELECT id, type, title, domain, layer FROM nodes")
			.all() as GraphNode[];
		for (const node of nodes) {
			this.graph.addNode(node.id, {
				type: node.type,
				title: node.title,
				domain: node.domain,
				layer: node.layer,
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
}
