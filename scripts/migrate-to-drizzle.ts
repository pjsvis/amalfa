#!/usr/bin/env bun
/**
 * Migration: Custom Migrations → Drizzle
 *
 * This script transitions AMALFA from the custom migration array
 * to Drizzle Kit managed migrations.
 *
 * ONLY RUN ONCE per database.
 */

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { existsSync } from "node:fs";

const DB_PATH = ".amalfa/resonance.db";

console.log("🔄 AMALFA: Custom → Drizzle Migration");
console.log("=" .repeat(60));

if (!existsSync(DB_PATH)) {
	console.error(`❌ Database not found: ${DB_PATH}`);
	console.error(
		"   Run 'amalfa init' first to create the database.",
	);
	process.exit(1);
}

// 1. Check current state
const sqlite = new Database(DB_PATH);
const currentVersion = sqlite
	.query("PRAGMA user_version")
	.get() as { user_version: number };

console.log(`\n📊 Current State:`);
console.log(`   Custom migration version: ${currentVersion.user_version}`);

if (currentVersion.user_version < 9) {
	console.error(
		`\n❌ Database must be at v9 before transitioning to Drizzle.`,
	);
	console.error(`   Current version: ${currentVersion.user_version}`);
	console.error(`   Run the custom migrations first:\n`);
	console.error(`   bun run scripts/migrate-v9-remove-content.ts\n`);
	process.exit(1);
}

// 2. Verify Drizzle migrations exist
const MIGRATIONS_DIR = "src/resonance/drizzle/migrations";
if (!existsSync(MIGRATIONS_DIR)) {
	console.error(`\n❌ Drizzle migrations not found: ${MIGRATIONS_DIR}`);
	console.error(`   Run 'bunx drizzle-kit generate' first.`);
	process.exit(1);
}

// 3. Backup database
console.log(`\n💾 Creating backup...`);
const backupPath = `${DB_PATH}.backup-pre-drizzle-${Date.now()}`;
await Bun.write(backupPath, await Bun.file(DB_PATH).arrayBuffer());
console.log(`   ✅ Backup created: ${backupPath}`);

// 4. Initialize Drizzle migrations table (mark existing migrations as applied)
console.log(`\n🚀 Initializing Drizzle migrations table...`);
try {
	// Create Drizzle migrations tracking table
	sqlite.run(`CREATE TABLE IF NOT EXISTS __drizzle_migrations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		hash text NOT NULL,
		created_at numeric
	)`);

	// Check if migrations already marked
	const existingMigrations = sqlite
		.query("SELECT hash FROM __drizzle_migrations")
		.all() as { hash: string }[];

	if (existingMigrations.length > 0) {
		console.log(`   ℹ️  Drizzle migrations already tracked (${existingMigrations.length} entries)`);
	} else {
		// Mark 0000 and 0001 as applied (tables already exist from custom migrations)
		console.log(`   📝 Marking existing migrations as applied...`);

		// Read migration hashes from meta
		const meta = await Bun.file(
			`${MIGRATIONS_DIR}/meta/_journal.json`,
		).json() as {
			entries: { tag: string; when: number }[];
		};

		for (const entry of meta.entries) {
			// Hash is the tag name (e.g., "0000_happy_thaddeus_ross")
			sqlite.run(
				"INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
				[entry.tag, entry.when],
			);
			console.log(`      ✅ ${entry.tag}`);
		}
	}

	console.log(`   ✅ Drizzle state initialized`);
} catch (error) {
	console.error(`\n❌ Drizzle initialization failed:`, error);
	console.error(`\n   Restoring from backup...`);
	await Bun.write(DB_PATH, await Bun.file(backupPath).arrayBuffer());
	console.error(`   ✅ Database restored`);
	process.exit(1);
}

// 5. Verify schema matches
console.log(`\n🔍 Verifying schema...`);
const tables = sqlite
	.query(
		"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
	)
	.all() as { name: string }[];

const expectedTables = ["__drizzle_migrations", "edges", "ember_state", "history", "nodes"];
const actualTables = tables.map((t) => t.name);

console.log(`   Expected tables: ${expectedTables.join(", ")}`);
console.log(`   Actual tables:   ${actualTables.join(", ")}`);

const missing = expectedTables.filter((t) => !actualTables.includes(t));
if (missing.length > 0) {
	console.error(`\n❌ Missing tables: ${missing.join(", ")}`);
	process.exit(1);
}

// 6. Check nodes table schema
const nodesSchema = sqlite
	.query("PRAGMA table_info(nodes)")
	.all() as { name: string }[];
const nodeColumns = nodesSchema.map((c) => c.name);

console.log(`\n   Nodes columns: ${nodeColumns.join(", ")}`);

if (nodeColumns.includes("content")) {
	console.error(`\n❌ CRITICAL: 'content' column still exists in nodes table`);
	console.error(`   This should have been removed in custom migration v9.`);
	process.exit(1);
}

// 7. Mark transition complete
console.log(`\n✅ Migration Complete!`);
console.log(`\n📝 Next Steps:`);
console.log(`   1. ✅ DONE: Custom migrations removed from src/resonance/schema.ts`);
console.log(`   2. ✅ DONE: ResonanceDB now uses Drizzle migrations`);
console.log(`   3. ✅ DONE: Documentation updated`);
console.log(`   4. Test application: bun test`);
console.log(`   5. Commit changes\n`);
console.log(`⚠️  Future schema changes: Edit src/resonance/drizzle/schema.ts`);
console.log(`   Then run: bunx drizzle-kit generate`);
console.log(`   Migrations apply automatically on ResonanceDB init\n`);

sqlite.close();
