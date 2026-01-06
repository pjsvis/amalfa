import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

/**
 * Database Migration: Add Full-Text Search (FTS5) Capability
 *
 * This migration adds FTS5 virtual tables and triggers to enable
 * fast, ranked full-text search on node content and titles.
 *
 * IDEMPOTENT: Safe to run multiple times (uses IF NOT EXISTS).
 */

async function addFTS() {
	console.log(`🔧 Adding FTS5 to Resonance DB...`);

	const db = DatabaseFactory.connectToResonance();

	try {
		// Enable WAL mode (should already be set but ensure consistency)
		db.run("PRAGMA journal_mode = WAL;");

		// Create FTS5 virtual table
		console.log("📝 Creating FTS5 virtual table...");
		db.run(`
			CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
				id UNINDEXED,
				title,
				content,
				tokenize = 'porter unicode61'
			);
		`);

		// Populate FTS from existing nodes
		console.log("🔄 Populating FTS from existing nodes...");
		db.run(`
			INSERT INTO nodes_fts(rowid, id, title, content)
			SELECT rowid, id, title, content FROM nodes
			WHERE NOT EXISTS (SELECT 1 FROM nodes_fts WHERE nodes_fts.rowid = nodes.rowid);
		`);

		// Create triggers to keep FTS in sync
		console.log("⚡ Creating sync triggers...");

		// INSERT trigger
		db.run(`
			CREATE TRIGGER IF NOT EXISTS nodes_fts_insert AFTER INSERT ON nodes BEGIN
				INSERT INTO nodes_fts(rowid, id, title, content)
				VALUES (new.rowid, new.id, new.title, new.content);
			END;
		`);

		// DELETE trigger
		db.run(`
			CREATE TRIGGER IF NOT EXISTS nodes_fts_delete AFTER DELETE ON nodes BEGIN
				DELETE FROM nodes_fts WHERE rowid = old.rowid;
			END;
		`);

		// UPDATE trigger
		db.run(`
			CREATE TRIGGER IF NOT EXISTS nodes_fts_update AFTER UPDATE ON nodes BEGIN
				DELETE FROM nodes_fts WHERE rowid = old.rowid;
				INSERT INTO nodes_fts(rowid, id, title, content)
				VALUES (new.rowid, new.id, new.title, new.content);
			END;
		`);

		// Verify FTS setup
		const ftsCount = db.query("SELECT COUNT(*) as c FROM nodes_fts").get() as {
			c: number;
		};
		const nodesCount = db.query("SELECT COUNT(*) as c FROM nodes").get() as {
			c: number;
		};

		console.log("\n✅ FTS5 Migration Complete!");
		console.log(`   - Nodes in main table: ${nodesCount.c}`);
		console.log(`   - Nodes in FTS index: ${ftsCount.c}`);

		if (ftsCount.c !== nodesCount.c) {
			console.warn(
				`⚠️  WARNING: FTS count (${ftsCount.c}) != nodes count (${nodesCount.c})`,
			);
		}

		// Example search query
		console.log("\n📚 Example FTS Query:");
		console.log(
			'   SELECT id, title FROM nodes_fts WHERE nodes_fts MATCH "graph OR vector" LIMIT 5;',
		);

		db.close();
		return true;
	} catch (error) {
		console.error("❌ Migration failed:", error);
		db.close();
		return false;
	}
}

// Run migration
if (import.meta.main) {
	const success = await addFTS();
	process.exit(success ? 0 : 1);
}

export { addFTS };
