import { join } from "node:path";
import { ResonanceDB } from "../../resonance/db";
import { JsonlUtils } from "../../utils/JsonlUtils";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("ingest");

const ROOT = process.env.AMALFA_PIPE_ROOT || process.cwd();
const NODES_FILE = join(ROOT, ".amalfa/golden-lexicon-enriched.jsonl");
const VECTORS_FILE = join(ROOT, ".amalfa/lexicon-vectors.jsonl");
const EDGES_FILE = join(ROOT, ".amalfa/proposed-edges.jsonl");

async function ingest() {
	await client.start();
	try {
		const { getDbPath } = await import("../../cli/utils");
		const dbPath = process.env.AMALFA_DB_PATH || (await getDbPath());
		await client.log(`Opening DB at ${dbPath}`);

		const db = new ResonanceDB(dbPath);

		// 1. LOAD VECTORS (Join Keys)
		const vectorMap = new Map<string, number[]>();
		if (await Bun.file(VECTORS_FILE).exists()) {
			await client.log("Loading Vectors...");
			await JsonlUtils.process<any>(VECTORS_FILE, async (v) => {
				if (v.id && v.embedding) vectorMap.set(v.id, v.embedding);
			});
			await client.log(`Loaded ${vectorMap.size} vectors.`);
		}

		// 2. INGEST NODES
		let nodeCount = 0;
		const nodes: any[] = [];
		await JsonlUtils.process<any>(NODES_FILE, async (n) => {
			const vec = vectorMap.get(n.id);
			if (vec) {
				// Convert number[] to Float32Array for DB method
				n.embedding = new Float32Array(vec);
			}
			nodes.push(n);
		});

		await client.log(`Upserting ${nodes.length} nodes...`);

		const insertTx = db.getRawDb().transaction((items: any[]) => {
			for (const item of items) {
				// Ensure embedding is Float32Array if not already (it should be)
				if (item.embedding && !(item.embedding instanceof Float32Array)) {
					item.embedding = new Float32Array(item.embedding);
				}
				db.insertNode(item);
				nodeCount++;
			}
		});

		insertTx(nodes);
		await client.update({ nodes: nodeCount });

		// 3. INGEST EDGES
		let edgeCount = 0;
		const edges: any[] = [];
		try {
			await JsonlUtils.process<any>(EDGES_FILE, async (e) => {
				edges.push(e);
			});
		} catch (_e) {
			/* ignore */
		}

		await client.log(`Upserting ${edges.length} edges...`);

		const edgeTx = db.getRawDb().transaction((items: any[]) => {
			for (const item of items) {
				db.insertSemanticEdge(
					item.source,
					item.target,
					item.type,
					item.weight || 1.0, // confidence
					1.0, // veracity
					item.meta?.origin, // context_source
				);
				// What about 'meta.desc'?
				// insertSemanticEdge doesn't support generic 'meta' blob for edges yet (only specialized columns).
				// If we want to store descriptions on edges, we might need a custom raw upsert or update DB schema.
				// For now, dropping description on edge is acceptable as per schema 'edges' table limits.
				// Or we update the edge 'meta' if the table has it?
				// The table has `meta`? No, SemanticEdge uses `context_source`.
				// Let's stick to SemanticEdge protocol.
				edgeCount++;
			}
		});

		edgeTx(edges);
		await client.update({ edges: edgeCount });

		// 4. VERIFY
		await client.log("Verifying Integrity...");

		// Use Raw DB for counts
		const raw = db.getRawDb();
		const dbNodeCount = raw
			.query("SELECT count(*) as c FROM nodes WHERE domain = 'lexicon'")
			.get() as { c: number };
		const dbEdgeCount = raw.query("SELECT count(*) as c FROM edges").get() as {
			c: number;
		};

		if (dbNodeCount.c < nodes.length) {
			await client.error(
				`Warning: DB count (${dbNodeCount.c}) < Input (${nodes.length})`,
			);
		}

		await client.log(
			`✅ Verified: ${dbNodeCount.c} Nodes, ${dbEdgeCount.c} Edges.`,
		);

		// 5. PERSIST HISTORY
		const historyFile = join(ROOT, ".amalfa/pipeline-history.jsonl");
		const entry = {
			timestamp: new Date().toISOString(),
			nodes_input: nodes.length,
			nodes_final: dbNodeCount.c,
			edges_final: dbEdgeCount.c,
			vectors_loaded: vectorMap.size,
			status: "success",
		};
		await JsonlUtils.appendAsync(historyFile, entry);

		await client.complete({
			final_nodes: dbNodeCount.c,
			final_edges: dbEdgeCount.c,
		});
	} catch (e) {
		await client.error(String(e));
		process.exit(1);
	}
}

ingest();
