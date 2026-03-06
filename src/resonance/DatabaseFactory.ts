import { Database } from "bun:sqlite";

import { loadSettings } from "@src/config/defaults";

/**
 * 🏭 DATABASE FACTORY (The Enforcer)
 *
 * Single Source of Truth for instantiating SQLite connections in Amalfa.
 * Strictly enforces the configuration defined in `playbooks/sqlite-standards.md`.
 */

/**
 * Creates a fully configured, concurrent-safe SQLite connection.
 */
export function connect(
  path: string,
  options: { readonly?: boolean; create?: boolean } = {},
): Database {
  // Bun's Database constructor requires explicit flags if an options object is passed.
  // Default to { create: true } (ReadWrite + Create) if not specified.
  const finalOptions = {
    create: options.readonly ? undefined : true,
    ...options,
  };
  const db = new Database(path, finalOptions);

  // ------------------------------------------------------------------
  // 🔒 SQLITE STANDARDS (CANON)
  // Reference: playbooks/sqlite-standards.md
  // ------------------------------------------------------------------

  // 1. Concurrency (WAL + BusyTimeout)
  // CRITICAL: Set busy_timeout FIRST so we wait for any startup locks/recoveries.
  db.run("PRAGMA busy_timeout = 5000;"); // 5s wait for locks

  // Check current mode first to avoid unnecessary write locks
  const currentMode = db.query("PRAGMA journal_mode;").get() as {
    journal_mode: string;
  };
  if (currentMode?.journal_mode !== "wal") {
    db.run("PRAGMA journal_mode = WAL;");
  }

  db.run("PRAGMA synchronous = NORMAL;");

  // 2. Performance & Safety
  db.run("PRAGMA mmap_size = 0;"); // Disabled (Stability > Speed)
  db.run("PRAGMA temp_store = memory;");

  // 3. Integrity
  db.run("PRAGMA foreign_keys = ON;");

  return db;
}

/**
 * Connects specifically to the main Resonance Graph database.
 */
export function connectToResonance(options?: { readonly?: boolean }): Database;
export function connectToResonance(
  dbPath?: string,
  options?: { readonly?: boolean },
): Database;
export function connectToResonance(
  dbPathOrOptions?: string | { readonly?: boolean },
  options: { readonly?: boolean } = {},
): Database {
  let finalPath: string | undefined;
  let finalOptions = options;

  if (typeof dbPathOrOptions === "object" && dbPathOrOptions !== null) {
    console.warn(
      "⚠️  Legacy: Calling connectToResonance(options) is deprecated. Use connectToResonance(undefined, options) or connectToResonance(dbPath, options).",
    );
    finalOptions = dbPathOrOptions;
    finalPath = undefined;
  } else {
    finalPath = dbPathOrOptions;
  }

  // Standard Alignment: Force ReadWrite for WAL compatibility
  if (finalOptions.readonly) {
    console.warn(
      "⚠️  Standard Violation: WAL mode requires ReadWrite access even for readers. Overriding to readonly: false.",
    );
    finalOptions = { ...finalOptions, readonly: false };
  }

  const path = finalPath || loadSettings(false).database;
  return connect(path, finalOptions);
}

/**
 * 🩺 HEALTH CHECK (Validation)
 * Verifies that the connection is compliant with standards.
 */
export function performHealthCheck(db: Database) {
  const journal = db.query("PRAGMA journal_mode;").get() as {
    journal_mode: string;
  };
  const mmap = db.query("PRAGMA mmap_size;").get() as { mmap_size: number };
  const busy = db.query("PRAGMA busy_timeout;").get() as { timeout: number };

  if (journal.journal_mode !== "wal")
    console.warn("⚠️ HealthWarning: WAL mode not active.");
  if (mmap.mmap_size !== 0)
    console.warn("⚠️ HealthWarning: mmap should be 0 for stability.");
  if (busy.timeout < 5000)
    console.warn("⚠️ HealthWarning: busy_timeout < 5000ms.");

  // Write/Read Test
  try {
    db.run(
      "CREATE TABLE IF NOT EXISTS _health (id INTEGER PRIMARY KEY, ts TEXT)",
    );
    db.run("INSERT INTO _health (ts) VALUES (datetime('now'))");
    // Optional: Limit size of health table?
    db.run(
      "DELETE FROM _health WHERE id NOT IN (SELECT id FROM _health ORDER BY id DESC LIMIT 10)",
    );
    return { status: "Healthy", mode: journal.journal_mode };
  } catch (e) {
    console.error("❌ HealthCheck Failed:", e);
    throw e;
  }
}

/**
 * @deprecated Use individual exports instead
 */
export const DatabaseFactory = {
  connect,
  connectToResonance,
  performHealthCheck,
};
