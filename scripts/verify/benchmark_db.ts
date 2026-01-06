import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const COUNT = 10000;
const DB_PATH = ":memory:"; // In-memory for pure speed test

// Minimal Schema
const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	val: integer("val"),
});

console.log(`Benchmarking ${COUNT} Inserts (Bun SQLite)...`);
console.log("------------------------------------------------");

// --- CASE 1: Drizzle ORM Single Insert (Loop) ---
{
	const sqlite = new Database(DB_PATH);
	const db = drizzle(sqlite);
	sqlite.exec("CREATE TABLE nodes (id TEXT PRIMARY KEY, val INTEGER)");

	const start = performance.now();
	// Transaction needed for fairness, otherwise fsync kills performance
	db.transaction(() => {
		for (let i = 0; i < COUNT; i++) {
			db.insert(nodes)
				.values({ id: `orm-${i}`, val: i })
				.run();
		}
	});
	const end = performance.now();
	console.log(`Drizzle ORM (Transaction):  ${(end - start).toFixed(2)}ms`);
	sqlite.close();
}

// --- CASE 2: Raw SQL Prepared Statement (Transaction) ---
{
	const sqlite = new Database(DB_PATH);
	sqlite.exec("CREATE TABLE nodes (id TEXT PRIMARY KEY, val INTEGER)");

	const stmt = sqlite.prepare("INSERT INTO nodes (id, val) VALUES ($id, $val)");

	const start = performance.now();
	const transaction = sqlite.transaction(() => {
		for (let i = 0; i < COUNT; i++) {
			stmt.run({ $id: `raw-${i}`, $val: i });
		}
	});
	transaction();
	const end = performance.now();
	console.log(`Raw SQL (Prepared+Tx):    ${(end - start).toFixed(2)}ms`);
	sqlite.close();
}
