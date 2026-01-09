import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, rmdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { EmberAnalyzer } from "@src/ember/analyzer";
import { ResonanceDB } from "@src/resonance/db";

const TEST_DB = ".amalfa/test_analyzer.db";
// Use absolute paths for test files to avoid CWD issues
const TEST_DIR = join(process.cwd(), ".amalfa", "test_docs");
const TEST_NODE_A = join(TEST_DIR, "node-a.md");
const TEST_NODE_B = join(TEST_DIR, "node-b.md");
const TEST_NODE_C = join(TEST_DIR, "node-c.md");
const TEST_NODE_STUB = join(TEST_DIR, "stub-node.md");

describe("EmberAnalyzer", () => {
	let db: ResonanceDB;
	let analyzer: EmberAnalyzer;

	beforeEach(async () => {
		// Create test dir
		await mkdir(TEST_DIR, { recursive: true });

		// Create content files
		await Bun.write(TEST_NODE_A, "long content ".repeat(20));
		await Bun.write(TEST_NODE_B, "long content ".repeat(20));
		await Bun.write(TEST_NODE_C, "long content ".repeat(20));
		await Bun.write(TEST_NODE_STUB, "short");

		db = new ResonanceDB(TEST_DB);
		analyzer = new EmberAnalyzer(db);

		db.insertNode({
			id: "node-a",
			type: "doc",
			content: "ignored", // Content read from FS
			meta: { tags: ["security"], source: TEST_NODE_A },
			hash: "hash-a",
		});
		db.insertNode({
			id: "node-b",
			type: "doc",
			content: "ignored",
			meta: { tags: ["security"], source: TEST_NODE_B },
			hash: "hash-b",
		});
		db.insertNode({
			id: "node-c",
			type: "doc",
			content: "ignored",
			meta: { tags: [], source: TEST_NODE_C },
			hash: "hash-c",
		});
		// Bidirectional edges to ensure neighborhood capture
		db.insertEdge("node-c", "node-a", "RELATED");
		db.insertEdge("node-a", "node-c", "RELATED");
		db.insertEdge("node-c", "node-b", "RELATED");
		db.insertEdge("node-b", "node-c", "RELATED");

		// Stub node
		db.insertNode({
			id: "stub-node",
			type: "doc",
			content: "ignored",
			meta: { tags: [], source: TEST_NODE_STUB },
			hash: "hash-stub",
		});
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
			await unlink(TEST_NODE_A);
		} catch {}
		try {
			await unlink(TEST_NODE_B);
		} catch {}
		try {
			await unlink(TEST_NODE_C);
		} catch {}
		try {
			await unlink(TEST_NODE_STUB);
		} catch {}
		try {
			await rmdir(TEST_DIR);
		} catch {}
	});

	test("should suggest tag from dominant neighborhood", async () => {
		// Manually trigger graph load
		await analyzer.prepare();

		const content = await Bun.file(TEST_NODE_C).text();
		const sidecar = await analyzer.analyze(TEST_NODE_C, content);
		expect(sidecar).not.toBeNull();
		expect(sidecar?.changes.tags?.add).toContain("security");
	});

	test("should suggest stub tag for short content", async () => {
		const content = await Bun.file(TEST_NODE_STUB).text();
		const sidecar = await analyzer.analyze(TEST_NODE_STUB, content);
		expect(sidecar).not.toBeNull();
		expect(sidecar?.changes.tags?.add).toContain("stub");
	});

	test("should not suggest existing tags", async () => {
		// Update stub to already have stub tag using upsert (insertNode)
		db.insertNode({
			id: "stub-node",
			type: "doc",
			content: "ignored",
			meta: { tags: ["stub"], source: TEST_NODE_STUB },
			hash: "hash-stub-updated",
		});

		const content = await Bun.file(TEST_NODE_STUB).text();
		const sidecar = await analyzer.analyze(TEST_NODE_STUB, content);
		// Should be null or have no tag changes
		if (sidecar) {
			expect(sidecar.changes.tags?.add || []).not.toContain("stub");
		}
	});
});
