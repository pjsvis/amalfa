import type { Database } from "bun:sqlite";
import { join } from "node:path";
import { getLogger } from "@src/utils/Logger";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DatabaseFactory } from "./DatabaseFactory";

const log = getLogger("ResonanceDB");

// Types matching Schema
export interface Node {
	id: string;
	type: string;
	label?: string; // stored as 'title'
	domain?: string;
	layer?: string;
	summary?: string; // Extracted definition/description
	embedding?: Float32Array;
	hash?: string;
	meta?: Record<string, unknown>; // JSON object for flexible metadata
	date?: string; // ISO-8601 or similar temporal anchor
}

export class ResonanceDB {
	private db: Database;
	/**
	 * Factory method to load the default Resonance Graph.
	 * @deprecated Use constructor with explicit path from config instead.
	 * NFB-01: Default path now matches AmalfaSettingsSchema.default
	 */
	static init(
		dbPath: string = join(".amalfa", "runtime", "resonance.db"),
	): ResonanceDB {
		return new ResonanceDB(dbPath);
	}

	/**
	 * @param dbPath - Absolute path to the SQLite database file
	 *
	 * Note: ResonanceDB always opens in read-write mode regardless of any options.
	 * WAL mode requires write access to the -shm (shared memory) file even for readers.
	 */
	constructor(dbPath: string) {
		// Use DatabaseFactory to ensure compliant configuration (WAL mode + timeouts)
		// Always read-write: WAL mode requires all connections to have write access to -shm file
		this.db = DatabaseFactory.connect(dbPath, { readonly: false });

		// Always check migration (it's safe now with locking)
		this.migrate();
	}

	private migrate() {
		try {
			const drizzleDb = drizzle(this.db);
			migrate(drizzleDb, {
				migrationsFolder: "src/resonance/drizzle/migrations",
			});
			log.info("📦 ResonanceDB: Drizzle migrations applied");
		} catch (error) {
			log.error({ error }, "Migration failed");
			throw new Error(`Database migration failed: ${error}`);
		}
	}

	insertNode(node: Node) {
		// No inline migrations here anymore!

		// Schema v9: content column removed (Hollow Node enforcement)
		// Content is read from filesystem via GraphGardener.getContent()
		const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO nodes (id, type, title, domain, layer, embedding, hash, meta, date)
            VALUES ($id, $type, $title, $domain, $layer, $embedding, $hash, $meta, $date)
        `);

		try {
			// FAFCAS Protocol: Trust pre-normalized embeddings from Embedder/VectorEngine
			// Embeddings are already normalized at generation boundary
			// Fix: Copy actual Float32Array data, not the full underlying buffer
			const blob = node.embedding
				? new Uint8Array(
						node.embedding.buffer,
						node.embedding.byteOffset,
						node.embedding.byteLength,
					)
				: null;

			stmt.run({
				$id: String(node.id),
				$type: String(node.type),
				$title: node.label ? String(node.label) : null,
				// $content removed - always NULL per schema v6
				$domain: String(node.domain || "knowledge"),
				$layer: String(node.layer || "experience"),
				$embedding: blob,
				$hash: node.hash ? String(node.hash) : null,
				$meta: node.meta ? JSON.stringify(node.meta) : null,
				$date: node.date ? String(node.date) : null,
			});
			this.logHistory("upsert", "node", node.id, undefined, node);
		} catch (err) {
			log.error(
				{
					err,
					id: node.id,
					blobSize: node.embedding ? node.embedding.byteLength : 0,
					blobType: node.embedding
						? node.embedding instanceof Float32Array
							? "F32"
							: "Other"
						: "Null",
				},
				"❌ Failed to insert node",
			);
			throw err;
		}
	}

	getRawDb(): Database {
		return this.db;
	}

	insertEdge(source: string, target: string, type: string = "related_to") {
		this.db.run(
			`
            INSERT OR IGNORE INTO edges (source, target, type)
            VALUES (?, ?, ?)
        `,
			[source, target, type],
		);
		this.logHistory(
			"insert",
			"edge",
			`${source}-${target}-${type}`,
			undefined,
			{
				source,
				target,
				type,
			},
		);
	}

	/**
	 * Insert a semantic edge with confidence and veracity metadata.
	 * Used by the Sieve+Net harvester for extracted triples.
	 */
	insertSemanticEdge(
		source: string,
		target: string,
		type: string,
		confidence: number = 1.0,
		veracity: number = 1.0,
		contextSource?: string,
	) {
		this.db.run(
			`
            INSERT INTO edges (source, target, type, confidence, veracity, context_source)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(source, target, type) DO UPDATE SET
                confidence = excluded.confidence,
                veracity = excluded.veracity,
                context_source = excluded.context_source
        `,
			[source, target, type, confidence, veracity, contextSource ?? null],
		);
	}

	// Typed Data Accessors

	// Typed Data Accessors

	/**
	 * Fetch nodes with Safe Limits.
	 * @param options.excludeContent If true, skips 'content' and 'embedding' columns (Large BLOBs).
	 */
	getNodes(
		options: {
			domain?: string;
			type?: string;
			limit?: number;
			offset?: number;
			excludeContent?: boolean; // FAFCAS: Optimization for metadata scans
		} = {},
	): Node[] {
		// Safe Default Limit? User specifically asked to fix unbounded.
		// But for backward compatibility with scripts that expect everything, we might need a high limit or explicit 'unlimited' flag.
		// Let's default to unlimited IF not specified, but strongly encourage limits in docs.
		// Actually, 'sloppy code' implies implicit SELECT * is bad.
		// Let's implement options but keep default behavior 'all' to avoid breaking existing logic silently,
		// BUT we will log a warning if count > 1000 and no limit?
		// No, let's just implement the capabilities first. callers must opt-in to limits.

		const cols = options.excludeContent
			? "id, type, title, domain, layer, hash, meta" // No content, No embedding
			: "*";

		let sql = `SELECT ${cols} FROM nodes WHERE 1=1`;
		const params: (string | number)[] = [];

		if (options.domain) {
			sql += " AND domain = ?";
			params.push(options.domain);
		}
		if (options.type) {
			sql += " AND type = ?";
			params.push(options.type);
		}

		if (options.limit) {
			sql += " LIMIT ?";
			params.push(options.limit);
		}
		if (options.offset) {
			sql += " OFFSET ?";
			params.push(options.offset);
		}

		const rows = this.db.query(sql).all(...params) as Record<string, unknown>[];
		return rows.map((row) => this.mapRowToNode(row));
	}

	updateNodeDate(id: string, date: string) {
		this.db.run("UPDATE nodes SET date = ? WHERE id = ?", [date, id]);
	}

	getLexicon(): {
		id: string;
		label: string;
		aliases: string[];
		definition: string;
	}[] {
		// Optimized: Exclude content/embedding since we only need ID, Title, Aliases
		const _sql =
			"SELECT id, title, meta, content FROM nodes WHERE domain = 'lexicon' AND type = 'concept'";
		// Note: content is 'definition', usually small. Keep it. Embedding is big.
		// Actually, let's select specific columns to avoid embedding blob

		const rows = this.db
			.query(
				"SELECT id, title, meta, content FROM nodes WHERE domain = 'lexicon' AND type = 'concept'",
			)
			.all() as { id: string; title: string; meta: string; content: string }[];

		return rows.map((row) => {
			const meta = row.meta ? JSON.parse(row.meta) : {};
			return {
				id: row.id,
				label: row.title,
				aliases: meta.aliases || [],
				definition: row.content,
				...meta,
			};
		});
	}

	private mapRowToNode(row: any): Node {
		return {
			id: row.id,
			type: row.type,
			label: row.title,
			domain: row.domain,
			layer: row.layer,
			summary: row.summary,
			// Only hydrate embedding if it exists (was selected)
			embedding: row.embedding
				? new Float32Array(
						row.embedding.buffer,
						row.embedding.byteOffset,
						row.embedding.byteLength / 4,
					)
				: undefined,
			hash: row.hash,
			meta: row.meta ? JSON.parse(row.meta) : {},
			date: row.date,
		};
	}

	getNodeHash(id: string): string | null {
		const row = this.db
			.prepare("SELECT hash FROM nodes WHERE id = ?")
			.get(id) as { hash: string } | undefined;
		return row ? row.hash : null;
	}

	getStats() {
		const nodesCount = (
			this.db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
		).c;
		const edgesCount = (
			this.db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number }
		).c;
		const vectorsCount = (
			this.db
				.query("SELECT COUNT(*) as c FROM nodes WHERE embedding IS NOT NULL")
				.get() as { c: number }
		).c;
		const semanticTokensCount = (
			this.db
				.query(
					"SELECT COUNT(*) as c FROM nodes WHERE meta LIKE '%semantic_tokens%'",
				)
				.get() as { c: number }
		).c;

		return {
			nodes: nodesCount,
			edges: edgesCount,
			vectors: vectorsCount,
			semantic_tokens: semanticTokensCount,
			db_size_bytes:
				(this.db.query("PRAGMA page_count").get() as { page_count: number })
					.page_count *
				(this.db.query("PRAGMA page_size").get() as { page_size: number })
					.page_size,
		};
	}

	getNodesByType(type: string): Node[] {
		// Forward to new method
		return this.getNodes({ type });
	}

	// searchText method removed (Hollow Node Simplification)

	/**
	 * Transaction Management
	 * Wraps database operations in transactions for atomicity and performance
	 */
	beginTransaction() {
		this.db.run("BEGIN TRANSACTION");
	}

	commit() {
		this.db.run("COMMIT");
	}

	rollback() {
		this.db.run("ROLLBACK");
	}

	close() {
		this.db.close();
	}

	checkpoint() {
		this.db.run("PRAGMA wal_checkpoint(TRUNCATE);");
	}
	getNode(id: string): Node | null {
		const row = this.db.query("SELECT * FROM nodes WHERE id = ?").get(id);
		if (!row) return null;
		return this.mapRowToNode(row);
	}

	/**
	 * Generates a consistent Node ID from a file path or name.
	 * Matches the logic used in AmalfaIngestor.
	 */
	generateId(input: string): string {
		const withoutRelativePrefix = input.replace(/^\.*\//, "");
		const withoutExtension = withoutRelativePrefix.replace(
			/\.(md|ts|js|json)$/,
			"",
		);
		const lowercased = withoutExtension.toLowerCase();
		const alphanumericWithSlashes = lowercased.replace(/[^a-z0-9/]/g, "-");
		const slashesToDashes = alphanumericWithSlashes.replace(/\/+/g, "-");
		const collapsedDashes = slashesToDashes.replace(/-+/g, "-");
		const trimmed = collapsedDashes.replace(/^-|-$/g, "");

		return trimmed;
	}

	updateNodeMeta(id: string, meta: Record<string, unknown>) {
		const oldMeta = this.getNode(id)?.meta;
		this.db.run("UPDATE nodes SET meta = ? WHERE id = ?", [
			JSON.stringify(meta),
			id,
		]);
		this.logHistory("update", "node", id, oldMeta, meta);
	}

	private logHistory(
		action: string,
		type: string,
		id: string,
		oldValue?: unknown,
		newValue?: unknown,
	) {
		try {
			this.db.run(
				`INSERT INTO history (entity_type, entity_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
				[
					type,
					id,
					action,
					oldValue ? JSON.stringify(oldValue) : null,
					newValue ? JSON.stringify(newValue) : null,
				],
			);
		} catch (_e) {}
	}
}

// Helper: Calculate magnitude (L2 norm) of a vector
function magnitude(vec: Float32Array): number {
	let sum = 0;
	// Modern JS engines SIMD-optimize this loop automatically
	for (let i = 0; i < vec.length; i++) {
		sum += (vec[i] || 0) * (vec[i] || 0);
	}
	return Math.sqrt(sum);
}

// FAFCAS Protocol: use Dot Product for normalized vectors
// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
//
// Returns 0 for zero-magnitude vectors (failed embeddings) to prevent
// false matches in search results.
export function dotProduct(a: Float32Array, b: Float32Array): number {
	// Check for zero vectors (failed embeddings)
	const magA = magnitude(a);
	const magB = magnitude(b);

	if (magA < 1e-6 || magB < 1e-6) {
		// log.warn("⚠️ Zero vector detected in dot product, skipping comparison"); // Too noisy for tight loops
		return 0;
	}

	let sum = 0;
	// Modern JS engines SIMD-optimize this loop automatically
	for (let i = 0; i < a.length; i++) {
		sum += (a[i] || 0) * (b[i] || 0);
	}
	return sum;
}

// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function toFafcas(vector: Float32Array): Uint8Array {
	// 1. Calculate Magnitude (L2 Norm)
	let sum = 0;
	for (let i = 0; i < vector.length; i++) {
		const val = vector[i] || 0;
		sum += val * val;
	}
	const magnitude = Math.sqrt(sum);

	// 2. Normalize (Divide by Magnitude)
	// Optimization: If magnitude is 0, return zero vector
	if (magnitude > 1e-6) {
		for (let i = 0; i < vector.length; i++) {
			const val = vector[i] || 0;
			vector[i] = val / magnitude;
		}
	}

	// 3. Serialize to Raw Bytes (FAFCAS Blob)
	return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}
