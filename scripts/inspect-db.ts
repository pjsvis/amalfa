#!/usr/bin/env bun
/**
 * scripts/inspect-db.ts
 *
 * Quick SQLite database inspection tool
 * Shows schema, row counts, sample data, and statistics
 *
 * Usage:
 *   bun run scripts/inspect-db.ts <database-file>
 *   bun run scripts/inspect-db.ts canary-persistence.db
 *   bun run scripts/inspect-db.ts public/resonance.db
 */

import { Database } from "bun:sqlite";

// ANSI color codes
const colors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	cyan: "\x1b[36m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	red: "\x1b[31m",
};

function colorize(text: string, color: keyof typeof colors): string {
	return `${colors[color]}${text}${colors.reset}`;
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

function formatNumber(num: number): string {
	return num.toLocaleString();
}

function truncateString(str: string, maxLength = 50): string {
	if (str.length <= maxLength) return str;
	return `${str.substring(0, maxLength - 3)}...`;
}

interface TableInfo {
	name: string;
	rowCount: number;
	columns: Array<{
		cid: number;
		name: string;
		type: string;
		notnull: number;
		dflt_value: string | null;
		pk: number;
	}>;
	indexes: Array<{
		name: string;
		unique: number;
		origin: string;
		partial: number;
	}>;
	sampleRows: Array<Record<string, unknown>>;
}

async function inspectDatabase(dbPath: string) {
	console.log(colorize("\n🔍 SQLite Database Inspector\n", "bold"));
	console.log(colorize(`Database: ${dbPath}`, "cyan"));
	console.log(colorize("─".repeat(80), "dim"));

	// Check if file exists
	const file = Bun.file(dbPath);
	const exists = await file.exists();
	if (!exists) {
		console.error(
			colorize(`\n❌ Error: Database file not found: ${dbPath}`, "red"),
		);
		process.exit(1);
	}

	// Get file size
	const fileSize = file.size;
	console.log(colorize(`File size: ${formatBytes(fileSize)}`, "dim"));

	// Open database
	let db: Database;
	try {
		db = new Database(dbPath, { readonly: true });
	} catch (error) {
		console.error(colorize(`\n❌ Error opening database: ${error}`, "red"));
		process.exit(1);
	}

	try {
		// Get database metadata
		const _pragmaInfo = db.query("PRAGMA database_list").all() as Array<{
			seq: number;
			name: string;
			file: string;
		}>;

		// Get all tables
		const tables = db
			.query(
				"SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
			)
			.all() as Array<{ name: string }>;

		if (tables.length === 0) {
			console.log(colorize("\n⚠️  No tables found in database", "yellow"));
			db.close();
			return;
		}

		console.log(colorize(`\nTables: ${tables.length}`, "green"));
		console.log(colorize("─".repeat(80), "dim"));

		const tableInfos: TableInfo[] = [];

		// Inspect each table
		for (const table of tables) {
			const tableName = table.name;

			// Get column info
			const columns = db
				.query(`PRAGMA table_info(${tableName})`)
				.all() as Array<{
				cid: number;
				name: string;
				type: string;
				notnull: number;
				dflt_value: string | null;
				pk: number;
			}>;

			// Get row count
			const rowCountResult = db
				.query(`SELECT COUNT(*) as count FROM ${tableName}`)
				.get() as { count: number };
			const rowCount = rowCountResult.count;

			// Get indexes
			const indexes = db
				.query(`PRAGMA index_list(${tableName})`)
				.all() as Array<{
				seq: number;
				name: string;
				unique: number;
				origin: string;
				partial: number;
			}>;

			// Get sample rows (limit 3)
			const sampleRows = db
				.query(`SELECT * FROM ${tableName} LIMIT 3`)
				.all() as Array<Record<string, unknown>>;

			tableInfos.push({
				name: tableName,
				rowCount,
				columns,
				indexes,
				sampleRows,
			});
		}

		// Display table summaries
		console.log(colorize("\n📊 Table Overview\n", "bold"));

		const totalRows = tableInfos.reduce((sum, t) => sum + t.rowCount, 0);
		console.log(
			colorize(
				`Total rows across all tables: ${formatNumber(totalRows)}`,
				"cyan",
			),
		);
		console.log();

		// Table summary
		console.log(
			colorize("Table".padEnd(30), "bold") +
				colorize("Rows".padStart(15), "bold") +
				colorize("Columns".padStart(15), "bold"),
		);
		console.log(colorize("─".repeat(60), "dim"));

		for (const table of tableInfos) {
			const name = truncateString(table.name, 28).padEnd(30);
			const rows = formatNumber(table.rowCount).padStart(15);
			const cols = table.columns.length.toString().padStart(15);
			console.log(name + rows + cols);
		}

		// Detailed table info
		console.log(colorize("\n\n📋 Detailed Table Information\n", "bold"));

		for (const table of tableInfos) {
			console.log(colorize(`\n▸ ${table.name}`, "cyan"));
			console.log(colorize(`  ${"─".repeat(78)}`, "dim"));
			console.log(colorize(`  Rows: ${formatNumber(table.rowCount)}`, "dim"));

			// Columns
			console.log(colorize("\n  Columns:", "yellow"));
			for (const col of table.columns) {
				const pk = col.pk ? colorize(" [PK]", "magenta") : "";
				const notnull = col.notnull ? colorize(" NOT NULL", "red") : "";
				const dflt = col.dflt_value ? ` DEFAULT ${col.dflt_value}` : "";
				console.log(
					`    • ${colorize(col.name, "green")}: ${col.type}${pk}${notnull}${dflt}`,
				);
			}

			// Indexes
			if (table.indexes.length > 0) {
				console.log(colorize("\n  Indexes:", "yellow"));
				for (const idx of table.indexes) {
					const unique = idx.unique ? colorize(" [UNIQUE]", "magenta") : "";
					const origin =
						idx.origin === "pk" ? colorize(" [PRIMARY KEY]", "blue") : "";
					console.log(`    • ${idx.name}${unique}${origin}`);
				}
			}

			// Sample rows
			if (table.sampleRows.length > 0) {
				console.log(colorize("\n  Sample rows:", "yellow"));
				for (let i = 0; i < table.sampleRows.length; i++) {
					const row = table.sampleRows[i];
					if (!row) continue;
					console.log(colorize(`\n    Row ${i + 1}:`, "dim"));

					// Show each column value
					for (const col of table.columns) {
						let value = row[col.name];

						// Format value
						if (value === null) {
							value = colorize("NULL", "dim");
						} else if (typeof value === "string") {
							value = `"${truncateString(value, 60)}"`;
						} else if (typeof value === "number") {
							value = formatNumber(value);
						} else if (typeof value === "boolean") {
							value = value
								? colorize("true", "green")
								: colorize("false", "red");
						} else {
							value = String(value);
						}

						console.log(`      ${colorize(col.name, "dim")}: ${value}`);
					}
				}
			} else {
				console.log(colorize("\n  (No rows in table)", "dim"));
			}
		}

		// Database statistics
		console.log(colorize("\n\n📈 Database Statistics\n", "bold"));

		// Page size and counts
		const pageSize =
			(db.query("PRAGMA page_size").get() as { page_size: number })
				?.page_size || 0;
		const pageCount =
			(db.query("PRAGMA page_count").get() as { page_count: number })
				?.page_count || 0;
		const freePages =
			(db.query("PRAGMA freelist_count").get() as { freelist_count: number })
				?.freelist_count || 0;

		console.log(colorize(`Page size: ${formatBytes(pageSize)}`, "dim"));
		console.log(colorize(`Total pages: ${formatNumber(pageCount)}`, "dim"));
		console.log(colorize(`Free pages: ${formatNumber(freePages)}`, "dim"));
		console.log(
			colorize(
				`Estimated data size: ${formatBytes((pageCount - freePages) * pageSize)}`,
				"dim",
			),
		);

		// Fragmentation
		if (pageCount > 0) {
			const fragmentation = ((freePages / pageCount) * 100).toFixed(2);
			console.log(colorize(`Fragmentation: ${fragmentation}%`, "dim"));
		}

		console.log(colorize(`\n${"─".repeat(80)}`, "dim"));
		console.log(colorize("\n✅ Inspection complete\n", "green"));
	} catch (error) {
		console.error(colorize(`\n❌ Error during inspection: ${error}`, "red"));
		throw error;
	} finally {
		db.close();
	}
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
	console.log(colorize("\n🔍 SQLite Database Inspector\n", "bold"));
	console.log("Usage: bun run scripts/inspect-db.ts <database-file>\n");
	console.log("Examples:");
	console.log("  bun run scripts/inspect-db.ts canary-persistence.db");
	console.log("  bun run scripts/inspect-db.ts public/resonance.db");
	console.log("  bun run scripts/inspect-db.ts bento_ledger.sqlite\n");
	process.exit(1);
}

const dbPath = args[0];
if (!dbPath) {
	console.error("Error: Database path is required");
	process.exit(1);
}
await inspectDatabase(dbPath);
