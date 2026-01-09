/**
 * SemanticHarvester: TypeScript Bridge to Python Sieve+Net Pipeline
 *
 * Invokes the Python harvester via subprocess and loads the resulting
 * knowledge_graph.json artifact for integration with ResonanceDB.
 *
 * @example
 * const harvester = new SemanticHarvester();
 * const graph = await harvester.harvest("playbooks/");
 * await harvester.loadIntoResonance(graph);
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { getLogger } from "@src/utils/Logger";
import { $ } from "bun";

export interface SemanticNode {
	name: string;
	type: "concept" | "document";
	uri?: string;
}

export interface SemanticEdge {
	source: string;
	rel: string;
	target: string;
	confidence_score: number;
	context_source?: string;
}

export interface KnowledgeGraph {
	nodes: Record<string, { type: string; uri?: string }>;
	edges: SemanticEdge[];
}

export class SemanticHarvester {
	private readonly ingestDir: string;
	private readonly venvPython: string;
	private log = getLogger("Harvester");

	constructor(projectRoot?: string) {
		const root = projectRoot ?? process.cwd();
		this.ingestDir = join(root, "ingest");
		this.venvPython = join(this.ingestDir, ".venv", "bin", "python");
	}

	/**
	 * Check if the Python environment is ready.
	 */
	async isReady(): Promise<boolean> {
		// Check venv exists
		if (!existsSync(this.venvPython)) {
			this.log.warn(
				"⚠️ Python venv not found. Run: cd ingest && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt",
			);
			return false;
		}

		// Check classifier model exists
		const classifierPath = join(this.ingestDir, "polyvis_classifier_v1");
		if (!existsSync(classifierPath)) {
			this.log.warn(
				"⚠️ Classifier not trained. Run: cd ingest && .venv/bin/python train_classifier.py",
			);
			return false;
		}

		return true;
	}

	/**
	 * Harvest semantic triples from a file or directory.
	 *
	 * @param target - Path to file or directory to process
	 * @returns The extracted knowledge graph
	 */
	async harvest(target?: string): Promise<KnowledgeGraph> {
		if (!(await this.isReady())) {
			throw new Error("SemanticHarvester not ready. Check Python environment.");
		}

		this.log.info("🌾 Running Python Harvester...");

		const harvesterScript = join(this.ingestDir, "harvester.py");
		const args = target ? [harvesterScript, target] : [harvesterScript];

		try {
			const result = await $`${this.venvPython} ${args}`.quiet();

			if (result.exitCode !== 0) {
				this.log.error(
					{ stderr: result.stderr.toString() },
					"Harvester Failed",
				);
				throw new Error(`Harvester exited with code ${result.exitCode}`);
			}

			this.log.info(
				{ output: result.stdout.toString().trim() },
				"Harvester Success",
			);
		} catch (error) {
			this.log.error({ err: error }, "Harvester Execution Error");
			throw error;
		}

		// Load the artifact
		const artifactPath = join(this.ingestDir, "knowledge_graph.json");
		const artifact = await Bun.file(artifactPath).json();

		return artifact as KnowledgeGraph;
	}

	/**
	 * Get statistics about an extracted knowledge graph.
	 */
	getStats(graph: KnowledgeGraph): {
		nodes: number;
		edges: number;
		concepts: number;
		documents: number;
	} {
		const nodes = Object.keys(graph.nodes).length;
		const edges = graph.edges.length;
		const concepts = Object.values(graph.nodes).filter(
			(n) => n.type === "concept",
		).length;
		const documents = Object.values(graph.nodes).filter(
			(n) => n.type === "document",
		).length;

		return { nodes, edges, concepts, documents };
	}

	/**
	 * Load a harvested knowledge graph into ResonanceDB.
	 *
	 * @param graph - The extracted knowledge graph from harvest()
	 * @returns Statistics about the loaded data
	 */
	async loadIntoResonance(
		graph: KnowledgeGraph,
	): Promise<{ nodesLoaded: number; edgesLoaded: number }> {
		// Lazy import to avoid circular dependencies
		const { ResonanceDB } = await import("@src/resonance/db");

		const db = ResonanceDB.init();
		let nodesLoaded = 0;
		let edgesLoaded = 0;

		try {
			db.beginTransaction();

			// Load nodes
			for (const [name, meta] of Object.entries(graph.nodes)) {
				const nodeId = `semantic:${name.toLowerCase().replace(/\s+/g, "-")}`;
				db.insertNode({
					id: nodeId,
					type: meta.type,
					label: name,
					domain: "semantic",
					layer: "extracted",
					meta: { uri: meta.uri, originalName: name },
				});
				nodesLoaded++;
			}

			// Load edges
			for (const edge of graph.edges) {
				const sourceId = `semantic:${edge.source.toLowerCase().replace(/\s+/g, "-")}`;
				const targetId = `semantic:${edge.target.toLowerCase().replace(/\s+/g, "-")}`;

				db.insertSemanticEdge(
					sourceId,
					targetId,
					edge.rel.toLowerCase(),
					edge.confidence_score,
					1.0, // Default veracity
					edge.context_source,
				);
				edgesLoaded++;
			}

			db.commit();
			this.log.info(
				{ nodes: nodesLoaded, edges: edgesLoaded },
				"✅ Loaded Knowledge Graph into ResonanceDB",
			);
		} catch (error) {
			db.rollback();
			throw error;
		} finally {
			db.close();
		}

		return { nodesLoaded, edgesLoaded };
	}
}

// --- CLI Test ---
if (import.meta.main) {
	const harvester = new SemanticHarvester();
	// For CLI output, we can probably rely on the logger since it goes to stderr.
	// Maybe we want pure console.log for "user facing" CLI output?
	// But Logger.ts is configured to use pino. pino writes JSON.
	// If the user runs this manually, they might pipe to pino-pretty.
	// Let's keep it structured.

	const log = getLogger("CLI");

	log.info("Checking readiness...");
	const ready = await harvester.isReady();
	log.info({ ready }, "Readiness Check");

	if (ready) {
		const target = process.argv[2];
		const graph = await harvester.harvest(target);
		const stats = harvester.getStats(graph);
		log.info({ stats }, "📊 Extraction Stats");
	}
}
