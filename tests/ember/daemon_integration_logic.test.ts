import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rmdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { DEFAULT_CONFIG } from "@src/config/defaults";
import { EmberService } from "@src/ember";
import type { EmberConfig } from "@src/ember/types";
import { ResonanceDB } from "@src/resonance/db";

const TEST_DB = ".amalfa/test_integration.db";
const TEST_DIR = join(process.cwd(), ".amalfa", "test_integration_docs");
const TEST_FILE = join(TEST_DIR, "integration-node.md");

describe("Ember Daemon Integration Logic", () => {
	let db: ResonanceDB;
	let service: EmberService;

	beforeEach(async () => {
		await mkdir(TEST_DIR, { recursive: true });
		db = new ResonanceDB(TEST_DB);

		// Setup simple config
		const config: EmberConfig = {
			...DEFAULT_CONFIG.ember,
			enabled: true,
			sources: [TEST_DIR],
			minConfidence: 0.5,
		};

		service = new EmberService(db, config);
	});

	afterEach(async () => {
		db.close();
		try {
			await unlink(TEST_DB);
		} catch {}
		try {
			await unlink(`${TEST_DB}-shm`);
		} catch {}
		try {
			await unlink(`${TEST_DB}-wal`);
		} catch {}
		try {
			await unlink(TEST_FILE);
		} catch {}
		try {
			await unlink(`${TEST_FILE}.ember.json`);
		} catch {}
		try {
			await rmdir(TEST_DIR);
		} catch {}
	});

	test("should generate sidecar for valid content", async () => {
		// 1. Create content
		const content = "Short stub content.";
		await Bun.write(TEST_FILE, content);

		// 2. Insert into DB (simulating Ingestor)
		db.insertNode({
			id: "integration-node",
			type: "doc",
			content: "ignored",
			meta: { tags: [], source: TEST_FILE },
			hash: "hash",
		});

		// 3. Analyze (simulating Daemon hook)
		const sidecar = await service.analyze(TEST_FILE, content);

		expect(sidecar).not.toBeNull();
		expect(sidecar?.changes.tags?.add).toContain("stub");

		// 4. Generate Sidecar
		if (sidecar) {
			await service.generate(sidecar);
		}

		// 5. Verify file exists
		const sidecarPath = `${TEST_FILE}.ember.json`;
		expect(await Bun.file(sidecarPath).exists()).toBe(true);

		const generated = await Bun.file(sidecarPath).json();
		expect(generated.changes.tags.add).toContain("stub");
	});
});
