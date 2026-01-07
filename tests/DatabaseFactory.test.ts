import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { DatabaseFactory } from "../src/resonance/DatabaseFactory";

describe("DatabaseFactory", () => {
	const TEST_DB = "test-factory.db";

	test("connect creates a configured database", () => {
		// Setup
		if (existsSync(TEST_DB)) unlink(TEST_DB);

		const db = DatabaseFactory.connect(TEST_DB);

		try {
			// Verify Pragmas
			const journal = db.query("PRAGMA journal_mode").get() as {
				journal_mode: string;
			};
			const mmap = db.query("PRAGMA mmap_size").get() as { mmap_size: number };
			const busy = db.query("PRAGMA busy_timeout").get() as { timeout: number };

			expect(journal.journal_mode).toBe("wal");
			expect(mmap.mmap_size).toBe(0);
			expect(busy.timeout).toBeGreaterThanOrEqual(5000);

			// Verify Health Check
			const health = DatabaseFactory.performHealthCheck(db);
			expect(health.status).toBe("Healthy");
		} finally {
			db.close();
			if (existsSync(TEST_DB)) unlink(TEST_DB);
			if (existsSync(`${TEST_DB}-shm`)) unlink(`${TEST_DB}-shm`);
			if (existsSync(`${TEST_DB}-wal`)) unlink(`${TEST_DB}-wal`);
		}
	});

	test("connectToResonance returns valid connection", () => {
		// This connects to the actual dev DB configured in settings, so we just check it opens
		// We do NOT delete it.
		const db = DatabaseFactory.connectToResonance(".amalfa/resonance.db", { readonly: false }); // Ensure standard mode
		expect(db).toBeDefined();

		// Just check one pragma to ensure factory logic ran
		const mmap = db.query("PRAGMA mmap_size").get() as { mmap_size: number };
		expect(mmap.mmap_size).toBe(0);

		db.close();
	});
});
