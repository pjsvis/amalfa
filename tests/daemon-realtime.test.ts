#!/usr/bin/env bun
/**
 * Real-time Daemon Tests
 * Verifies daemon behavior with actual file system operations
 */

import { afterAll, beforeAll, expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { sleep } from "bun";
import { ResonanceDB } from "../src/resonance/db";

const TEST_DIR = join(process.cwd(), "tests/fixtures/daemon-test");
const TEST_DB = join(TEST_DIR, ".amalfa/resonance.db");
const TEST_CONFIG = join(TEST_DIR, "amalfa.config.json");
const DAEMON_DEBOUNCE_MS = 500;

let daemonProcess: ReturnType<typeof spawn> | null = null;

beforeAll(() => {
	// Clean and setup test directory
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}
	mkdirSync(TEST_DIR, { recursive: true });
	mkdirSync(join(TEST_DIR, "docs"), { recursive: true });
	mkdirSync(join(TEST_DIR, ".amalfa/logs"), { recursive: true });
	mkdirSync(join(TEST_DIR, ".amalfa/runtime"), { recursive: true });

	// Create test config
	writeFileSync(
		TEST_CONFIG,
		JSON.stringify(
			{
				sources: ["./docs"],
				database: ".amalfa/resonance.db",
				embeddings: {
					model: "BAAI/bge-small-en-v1.5",
					dimensions: 384,
				},
				watch: {
					enabled: true,
					debounce: DAEMON_DEBOUNCE_MS,
				},
				excludePatterns: ["node_modules", ".git", ".amalfa"],
			},
			null,
			2,
		),
	);

	// Initialize database with empty state
	const db = new ResonanceDB(TEST_DB);
	db.close();

	console.log(`✅ Test environment created: ${TEST_DIR}`);
});

afterAll(() => {
	// Kill daemon if still running
	if (daemonProcess) {
		daemonProcess.kill();
	}

	// Cleanup
	if (existsSync(TEST_DIR)) {
		rmSync(TEST_DIR, { recursive: true, force: true });
	}
});

test.skip("daemon watches correct directories from config", async () => {
	// Start daemon
	daemonProcess = spawn("bun", ["run", "src/daemon/index.ts"], {
		cwd: TEST_DIR,
		stdio: ["ignore", "pipe", "pipe"],
	});

	// Wait for daemon to start
	await sleep(2000);

	// Check daemon log for watched paths
	const logPath = join(TEST_DIR, ".amalfa/logs/daemon.log");
	expect(existsSync(logPath)).toBe(true);

	const logContent = await Bun.file(logPath).text();
	expect(logContent).toContain("Watching directory");
	expect(logContent).toContain(join(TEST_DIR, "docs"));

	daemonProcess.kill();
	daemonProcess = null;
}, 10000);

test.skip("daemon detects new file and updates database", async () => {
	// Start with empty database
	const db = new ResonanceDB(TEST_DB);
	const initialStats = db.getStats();
	db.close();

	// Start daemon
	daemonProcess = spawn("bun", ["run", "src/daemon/index.ts"], {
		cwd: TEST_DIR,
		stdio: ["ignore", "pipe", "pipe"],
	});

	await sleep(2000);

	// Create a new markdown file
	const testFile = join(TEST_DIR, "docs/test-document.md");
	writeFileSync(testFile, "# Test Document\n\nThis is a test.");

	// Wait for debounce + ingestion
	await sleep(DAEMON_DEBOUNCE_MS + 3000);

	// Check database updated
	const db2 = new ResonanceDB(TEST_DB);
	const newStats = db2.getStats();
	db2.close();

	expect(newStats.nodes).toBeGreaterThan(initialStats.nodes);

	daemonProcess.kill();
	daemonProcess = null;
}, 15000);

test.skip("daemon detects file modification and updates", async () => {
	// Create initial file
	const testFile = join(TEST_DIR, "docs/modify-test.md");
	writeFileSync(testFile, "# Original Content\n\nVersion 1");

	// Initialize database with this file
	const { spawn: spawnSync } = require("node:child_process");
	const initProcess = spawnSync("bun", ["run", "src/cli.ts", "init"], {
		cwd: TEST_DIR,
	});

	await new Promise((resolve) => {
		initProcess.on("close", resolve);
	});

	// Get node ID
	const db = new ResonanceDB(TEST_DB);
	const initialNode = db
		.getRawDb()
		.query("SELECT * FROM nodes WHERE id = 'modify-test'")
		.get() as { hash?: string } | undefined;
	const initialHash = initialNode?.hash;
	db.close();

	// Start daemon
	daemonProcess = spawn("bun", ["run", "src/daemon/index.ts"], {
		cwd: TEST_DIR,
		stdio: ["ignore", "pipe", "pipe"],
	});

	await sleep(2000);

	// Modify file
	writeFileSync(testFile, "# Modified Content\n\nVersion 2 - Updated!");

	// Wait for daemon to detect and process
	await sleep(DAEMON_DEBOUNCE_MS + 3000);

	// Check hash changed
	const db2 = new ResonanceDB(TEST_DB);
	const updatedNode = db2
		.getRawDb()
		.query("SELECT * FROM nodes WHERE id = 'modify-test'")
		.get() as { hash?: string } | undefined;
	db2.close();

	expect(updatedNode).toBeDefined();
	expect(updatedNode?.hash).not.toBe(initialHash);

	daemonProcess.kill();
	daemonProcess = null;
}, 20000);

test.skip("daemon respects config sources array", async () => {
	// Update config to watch multiple directories
	const multiSourceConfig = join(TEST_DIR, "amalfa.config.json");
	mkdirSync(join(TEST_DIR, "playbooks"), { recursive: true });
	mkdirSync(join(TEST_DIR, "debriefs"), { recursive: true });

	writeFileSync(
		multiSourceConfig,
		JSON.stringify(
			{
				sources: ["./docs", "./playbooks", "./debriefs"],
				database: ".amalfa/resonance.db",
				embeddings: { model: "BAAI/bge-small-en-v1.5", dimensions: 384 },
				watch: { enabled: true, debounce: DAEMON_DEBOUNCE_MS },
				excludePatterns: ["node_modules", ".git", ".amalfa"],
			},
			null,
			2,
		),
	);

	// Start daemon
	daemonProcess = spawn("bun", ["run", "src/daemon/index.ts"], {
		cwd: TEST_DIR,
		stdio: ["ignore", "pipe", "pipe"],
	});

	await sleep(2000);

	// Check log mentions all three directories
	const logPath = join(TEST_DIR, ".amalfa/logs/daemon.log");
	const logContent = await Bun.file(logPath).text();

	expect(logContent).toContain(join(TEST_DIR, "docs"));
	expect(logContent).toContain(join(TEST_DIR, "playbooks"));
	expect(logContent).toContain(join(TEST_DIR, "debriefs"));

	daemonProcess.kill();
	daemonProcess = null;
}, 10000);

test.skip("daemon loads config at startup, not runtime", async () => {
	// This test documents current behavior (config loaded once at startup)
	// Future enhancement: Hot reload of config

	// Start daemon with initial config
	daemonProcess = spawn("bun", ["run", "src/daemon/index.ts"], {
		cwd: TEST_DIR,
		stdio: ["ignore", "pipe", "pipe"],
	});

	await sleep(2000);

	// Read initial log
	const logPath = join(TEST_DIR, ".amalfa/logs/daemon.log");
	const _initialLog = await Bun.file(logPath).text();

	// Modify config to add new source
	mkdirSync(join(TEST_DIR, "new-source"), { recursive: true });
	const config = JSON.parse(await Bun.file(TEST_CONFIG).text());
	config.sources.push("./new-source");
	writeFileSync(TEST_CONFIG, JSON.stringify(config, null, 2));

	await sleep(1000);

	// Daemon should NOT automatically pick up new source
	// (This is the current behavior - documenting it)
	const newLog = await Bun.file(logPath).text();
	expect(newLog).not.toContain(join(TEST_DIR, "new-source"));

	// To pick up new config, daemon must be restarted
	daemonProcess.kill();
	daemonProcess = null;
}, 10000);
