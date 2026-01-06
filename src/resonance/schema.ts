export const CURRENT_SCHEMA_VERSION = 5;

export const GENESIS_SQL = `
    CREATE TABLE IF NOT EXISTS nodes (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        domain TEXT,
        layer TEXT,
        embedding BLOB,
        hash TEXT, 
        meta TEXT
    );
    
    CREATE TABLE IF NOT EXISTS edges (
        source TEXT,
        target TEXT,
        type TEXT,
        confidence REAL DEFAULT 1.0,
        veracity REAL DEFAULT 1.0,
        context_source TEXT,
        PRIMARY KEY (source, target, type)
    );
    
    CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
    CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
`;

import type { Database } from "bun:sqlite";

export interface Migration {
	version: number;
	description: string;
	sql?: string;
	up?: (db: Database) => void;
}

export const MIGRATIONS: Migration[] = [
	{
		version: 1,
		description: "Genesis: Initial Tables (nodes, edges, fts)",
		sql: `
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                type TEXT,
                title TEXT,
                content TEXT,
                domain TEXT,
                layer TEXT,
                embedding BLOB
            );
            CREATE TABLE IF NOT EXISTS edges (
                source TEXT,
                target TEXT,
                type TEXT,
                PRIMARY KEY (source, target, type)
            );
            CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
            CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
            CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
                id UNINDEXED, title, content, meta, tokenize='porter'
            );
            CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON nodes BEGIN
                INSERT INTO nodes_fts(rowid, id, title, content, meta) 
                VALUES (new.rowid, new.id, new.title, new.content, new.meta);
            END;
            CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON nodes BEGIN
                DELETE FROM nodes_fts WHERE rowid = old.rowid;
            END;
            CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON nodes BEGIN
                INSERT INTO nodes_fts(nodes_fts, rowid, id, title, content, meta) 
                VALUES('delete', old.rowid, old.id, old.title, old.content, old.meta);
                INSERT INTO nodes_fts(rowid, id, title, content, meta) 
                VALUES (new.rowid, new.id, new.title, new.content, new.meta);
            END;
        `,
	},
	{
		version: 2,
		description: "Add 'hash' column to nodes",
		up: (db) => {
			try {
				db.run("ALTER TABLE nodes ADD COLUMN hash TEXT");
			} catch (e: unknown) {
				const err = e as { message: string };
				if (!err.message.includes("duplicate column")) throw e;
			}
		},
	},
	{
		version: 3,
		description: "Add 'meta' column to nodes",
		up: (db) => {
			try {
				db.run("ALTER TABLE nodes ADD COLUMN meta TEXT");
			} catch (e: unknown) {
				const err = e as { message: string };
				if (!err.message.includes("duplicate column")) throw e;
			}
		},
	},
	{
		version: 4,
		description:
			"Add semantic edge metadata (confidence, veracity, context_source)",
		up: (db) => {
			// Add columns for semantic harvester edges
			for (const col of [
				"confidence REAL DEFAULT 1.0",
				"veracity REAL DEFAULT 1.0",
				"context_source TEXT",
			]) {
				try {
					db.run(`ALTER TABLE edges ADD COLUMN ${col}`);
				} catch (e: unknown) {
					const err = e as { message: string };
					if (!err.message.includes("duplicate column")) throw e;
				}
			}
		},
	},
	{
		version: 5,
		description: "Hollow Node: Remove FTS and content column",
		up: (db) => {
			// Drop FTS table and triggers
			db.run("DROP TABLE IF EXISTS nodes_fts");
			db.run("DROP TRIGGER IF EXISTS nodes_ai");
			db.run("DROP TRIGGER IF EXISTS nodes_ad");
			db.run("DROP TRIGGER IF EXISTS nodes_au");

			// SQLite < 3.35 doesn't support DROP COLUMN, recreate table
			// For now, we keep content column in existing DBs but stop using it
			// New databases created from GENESIS_SQL won't have content column
			console.log("   Migration v5: FTS removed, content column deprecated");
		},
	},
];
