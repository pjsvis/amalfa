import { sql } from "drizzle-orm";
import {
	blob,
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

/**
 * NODES Table
 * Core entity storage. Now "Hollow" (no content).
 */
export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	type: text("type"),
	title: text("title"),
	domain: text("domain"),
	layer: text("layer"),
	// Embeddings are stored as raw BLOBs (Float32Array bytes)
	embedding: blob("embedding"),
	hash: text("hash"),
	meta: text("meta"), // JSON string
	date: text("date"), // ISO string or YYYY-MM-DD
});

/**
 * EDGES Table
 * Defines relationships between nodes.
 */
export const edges = sqliteTable(
	"edges",
	{
		source: text("source").notNull(),
		target: text("target").notNull(),
		type: text("type").notNull(),
		confidence: real("confidence").default(1.0),
		veracity: real("veracity").default(1.0),
		contextSource: text("context_source"),
	},
	(table) => ({
		// Composite Primary Key
		pk: primaryKey({ columns: [table.source, table.target, table.type] }),
		// Indices for traversal speed
		sourceIdx: index("idx_edges_source").on(table.source),
		targetIdx: index("idx_edges_target").on(table.target),
	}),
);

/**
 * EMBER STATE Table (Pilot)
 * Tracks the state of the Ember Service (automated enrichment).
 */
export const emberState = sqliteTable("ember_state", {
	filePath: text("file_path").primaryKey(),
	lastAnalyzed: text("last_analyzed"),
	sidecarCreated: integer("sidecar_created", { mode: "boolean" }),
	confidence: real("confidence"),
});

/**
 * PIPELINE HISTORY Table
 * Audit trail for graph mutations (Added in Phase 5).
 */
export const history = sqliteTable("history", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	entityType: text("entity_type").notNull(),
	entityId: text("entity_id").notNull(),
	action: text("action").notNull(),
	oldValue: text("old_value"),
	newValue: text("new_value"),
	timestamp: text("timestamp").default(sql`(CURRENT_TIMESTAMP)`),
});
