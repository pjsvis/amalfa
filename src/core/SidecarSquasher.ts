import { readFileSync } from "node:fs";
import type { EmberSidecar } from "@src/ember/types";
import type { ResonanceDB } from "@src/resonance/db";
import type { ExtractedGraph } from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";
import { toRootRelative } from "@src/utils/projectRoot";
import { glob } from "glob";

const log = getLogger("SidecarSquasher");

export class SidecarSquasher {
	constructor(private db: ResonanceDB) {}

	/**
	 * Squashes all sidecar files matching the pattern into the database.
	 * @param pattern Glob pattern (default: "**\/*.json")
	 */
	async squash(
		pattern = "**/*.json",
	): Promise<{ nodes: number; edges: number; files: number }> {
		const sidecars = await glob(pattern, { cwd: process.cwd() });
		let totalNodes = 0;
		let totalEdges = 0;
		let processedFiles = 0;

		log.info(
			{ count: sidecars.length, pattern },
			"Found sidecar files to squash",
		);

		for (const sidecarPath of sidecars) {
			try {
				const stats = await this.squashFile(sidecarPath);
				if (stats) {
					totalNodes += stats.nodes;
					totalEdges += stats.edges;
					processedFiles++;
				}
			} catch (e) {
				log.error({ file: sidecarPath, err: e }, "Failed to squash sidecar");
			}
		}

		log.info(
			{ processedFiles, totalNodes, totalEdges },
			"Squash routine complete",
		);

		return { nodes: totalNodes, edges: totalEdges, files: processedFiles };
	}

	/**
	 * Process a single sidecar file.
	 */
	async squashFile(
		sidecarPath: string,
	): Promise<{ nodes: number; edges: number } | null> {
		// 1. Read and Parse
		const content = readFileSync(sidecarPath, "utf-8");
		let data: ExtractedGraph | undefined;

		try {
			const jsonStr = content.replace(/```json\n?|\n?```/g, "").trim();
			const parsed = JSON.parse(jsonStr);

			// Detect format: EmberSidecar vs Raw ExtractedGraph
			if (parsed.changes || parsed.graphData) {
				// It's an EmberSidecar
				const sidecar = parsed as EmberSidecar;
				if (sidecar.graphData) {
					data = sidecar.graphData;
				} else {
					log.debug(
						{ file: sidecarPath },
						"Sidecar has no graphData, skipping graph squash",
					);
					return null;
				}
			} else if (parsed.entities) {
				// It's a raw ExtractedGraph (legacy/test fixture)
				data = parsed as ExtractedGraph;
			} else {
				log.warn({ file: sidecarPath }, "Unknown sidecar format");
				return null;
			}
		} catch (_e) {
			log.warn({ file: sidecarPath }, "Invalid JSON in sidecar, skipping");
			return null;
		}

		const relativePath = toRootRelative(sidecarPath);
		const parentPath = relativePath.replace(/\.ember\.json$/, "");

		const parentId = this.db.generateId(parentPath);

		// Verify parent exists
		const parentNode = this.db.getNode(parentId);
		if (!parentNode) {
			log.debug(
				{ parentPath, parentId },
				"Parent node not found, skipping squash",
			);
			return null;
		}

		let nodeCount = 0;
		let edgeCount = 0;

		// 3. Transactional Write (Synchronous in bun:sqlite)
		const runTransaction = this.db.getRawDb().transaction(() => {
			log.info({ entityCount: data.entities.length }, "Processing entities");
			const symbolIdMap = new Map<string, string>();

			// Prepare Statements
			const insertNodeStmt = this.db.getRawDb().prepare(`
                INSERT INTO nodes (id, type, title, domain, layer, summary, meta, date)
                VALUES ($id, $type, $title, $domain, $layer, $summary, $meta, $date)
                ON CONFLICT(id) DO UPDATE SET
                summary = excluded.summary,
                date = excluded.date
            `);

			const insertEdgeStmt = this.db.getRawDb().prepare(`
                INSERT OR IGNORE INTO edges (source, target, type, confidence, veracity, context_source)
                VALUES ($source, $target, $type, $confidence, $veracity, $contextSource)
            `);

			// A. Insert Entities (Symbols)
			for (const entity of data.entities) {
				const symbolId = this.db.generateId(`${parentPath}:${entity.name}`);
				symbolIdMap.set(entity.name, symbolId);

				insertNodeStmt.run({
					$id: symbolId,
					$type: entity.type.toLowerCase(),
					$title: entity.name,
					$domain: parentNode.domain || "code",
					$layer: "symbol",
					$summary: entity.description || null,
					$meta: JSON.stringify({
						source: parentPath,
						parent_id: parentId,
						extraction_source: "lang-extract",
					}),
					$date: new Date().toISOString(),
				});

				nodeCount++;

				// B. Link Symbol to Parent (DEFINES)
				insertEdgeStmt.run({
					$source: parentId,
					$target: symbolId,
					$type: "DEFINES",
					$confidence: 1.0,
					$veracity: 1.0,
					$contextSource: "lang-extract",
				});

				edgeCount++;
			}

			// C. Insert Relationships
			for (const rel of data.relationships) {
				const sourceId = symbolIdMap.get(rel.source);
				if (sourceId) {
					const targetId = symbolIdMap.get(rel.target);
					if (targetId) {
						insertEdgeStmt.run({
							$source: sourceId,
							$target: targetId,
							$type: rel.type.toUpperCase(),
							$confidence: 0.8,
							$veracity: 1.0,
							$contextSource: "lang-extract",
						});
						edgeCount++;
					}
				}
			}
		});

		// Execute the transaction
		runTransaction();

		return { nodes: nodeCount, edges: edgeCount };
	}
}
