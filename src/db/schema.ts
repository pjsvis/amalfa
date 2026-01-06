import {
	blob,
	primaryKey,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),

	// Node Identity
	title: text("title"),
	// content: removed - Hollow Node architecture retrieves from filesystem

	// Taxonomy
	domain: text("domain").default("knowledge"),
	layer: text("layer").default("experience"),

	// Vector Search (FAFCAS)
	embedding: blob("embedding", { mode: "buffer" }),

	// Integrity
	hash: text("hash"),

	// Metadata (JSON) - includes source path for file retrieval
	meta: text("meta"),
});

export const edges = sqliteTable(
	"edges",
	{
		source: text("source").notNull(),
		target: text("target").notNull(),
		type: text("type").notNull(),

		// Semantic Harvester Metadata (v4)
		confidence: real("confidence").default(1.0),
		veracity: real("veracity").default(1.0),
		contextSource: text("context_source"),
	},
	(t) => ({
		pk: primaryKey({ columns: [t.source, t.target, t.type] }),
	}),
);
