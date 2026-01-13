import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { Scratchpad } from "@src/utils/Scratchpad";

const TEST_DIR = ".amalfa/cache/scratchpad";

/**
 * Extract scratchpad ID from a cache reference string.
 *
 * Why this exists: TypeScript types regex capture groups as `string | undefined`
 * because it cannot statically verify the regex will match. Rather than scatter
 * non-null assertions (`!`) throughout tests—which biome flags—we centralize
 * the runtime check here. If the regex fails, we get a clear error instead of
 * a cryptic undefined access. See: playbooks/typescript-patterns-playbook.md
 */
function extractId(reference: string): string {
	const match = reference.match(/Scratchpad\.read\("([^"]+)"\)/);
	if (!match?.[1])
		throw new Error("Could not extract scratchpad ID from reference");
	return match[1];
}

describe("Scratchpad Protocol", () => {
	let scratchpad: Scratchpad;

	beforeEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true });
		}
		mkdirSync(TEST_DIR, { recursive: true });
		scratchpad = new Scratchpad({ thresholdBytes: 100 });
	});

	afterEach(() => {
		if (existsSync(TEST_DIR)) {
			rmSync(TEST_DIR, { recursive: true });
		}
	});

	test("maybeCache returns original content below threshold", () => {
		const smallContent = "Hello world";
		const result = scratchpad.maybeCache("test_tool", smallContent);
		expect(result).toBe(smallContent);
	});

	test("maybeCache caches content above threshold and returns reference", () => {
		const largeContent = "x".repeat(200);
		const result = scratchpad.maybeCache("search_documents", largeContent);

		expect(result).toContain("📁 Output cached:");
		expect(result).toContain(".amalfa/cache/scratchpad/");
		expect(result).toContain("Scratchpad.read(");
	});

	test("cached content can be retrieved by ID", () => {
		const largeContent = JSON.stringify({ data: "x".repeat(200) });
		const reference = scratchpad.maybeCache("test_tool", largeContent);

		const id = extractId(reference);
		const entry = scratchpad.read(id);

		expect(entry).not.toBeNull();
		expect(entry?.content).toBe(largeContent);
		expect(entry?.tool).toBe("test_tool");
		expect(entry?.contentType).toBe("json");
	});

	test("readContent returns just the content string", () => {
		const largeContent = "Large text content ".repeat(20);
		const reference = scratchpad.maybeCache("test_tool", largeContent);

		const id = extractId(reference);
		const content = scratchpad.readContent(id);
		expect(content).toBe(largeContent);
	});

	test("deduplicates identical content", () => {
		const largeContent = "y".repeat(200);

		scratchpad.maybeCache("tool1", largeContent);
		scratchpad.maybeCache("tool2", largeContent);

		const entries = scratchpad.list();
		expect(entries.length).toBe(1);
	});

	test("list returns metadata without content", () => {
		const largeContent = "z".repeat(200);
		scratchpad.maybeCache("test_tool", largeContent);

		const entries = scratchpad.list();
		expect(entries.length).toBe(1);
		expect(entries[0]?.tool).toBe("test_tool");
		expect("content" in (entries[0] ?? {})).toBe(false);
	});

	test("delete removes entry", () => {
		const largeContent = "a".repeat(200);
		const reference = scratchpad.maybeCache("test_tool", largeContent);

		const id = extractId(reference);

		expect(scratchpad.read(id)).toBeTruthy();

		const deleted = scratchpad.delete(id);
		expect(deleted).toBe(true);
		expect(scratchpad.read(id)).toBeNull();
	});

	test("clear removes all entries", () => {
		scratchpad.maybeCache("tool1", "b".repeat(200));
		scratchpad.maybeCache("tool2", "c".repeat(200));

		expect(scratchpad.list().length).toBe(2);

		const count = scratchpad.clear();
		expect(count).toBe(2);
		expect(scratchpad.list().length).toBe(0);
	});

	test("stats returns correct aggregates", () => {
		scratchpad.maybeCache("tool1", "d".repeat(200));
		scratchpad.maybeCache("tool2", "e".repeat(300));

		const stats = scratchpad.stats();
		expect(stats.entries).toBe(2);
		expect(stats.totalSizeBytes).toBeGreaterThan(400);
		expect(stats.oldestTimestamp).toBeTruthy();
		expect(stats.newestTimestamp).toBeTruthy();
	});

	test("detects JSON content type", () => {
		const jsonContent = JSON.stringify({ items: Array(50).fill("test") });
		const reference = scratchpad.maybeCache("test_tool", jsonContent);

		const id = extractId(reference);
		const entry = scratchpad.read(id);

		expect(entry?.contentType).toBe("json");
	});

	test("detects markdown content type", () => {
		const mdContent = `# Heading\n\n${"Content ".repeat(50)}`;
		const reference = scratchpad.maybeCache("test_tool", mdContent);

		const id = extractId(reference);
		const entry = scratchpad.read(id);

		expect(entry?.contentType).toBe("markdown");
	});

	test("generates preview for JSON arrays", () => {
		const jsonArray = JSON.stringify(Array(100).fill({ id: 1 }));
		const reference = scratchpad.maybeCache("test_tool", jsonArray);

		expect(reference).toContain("[Array with 100 items]");
	});
});
