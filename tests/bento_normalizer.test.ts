import { describe, expect, test } from "bun:test";
import { BentoNormalizer } from "@src/core/BentoNormalizer";

describe("BentoNormalizer", () => {
	test("Heuristic A: Fix Headless", () => {
		const input = "Just some text.\nAnother line.";
		const filename = "test-file.md";
		const expected = "# Test File\n\nJust some text.\nAnother line.";
		expect(BentoNormalizer.fixHeadless(input, filename)).toBe(expected);
	});

	test("Heuristic A: Ignore if H1 exists", () => {
		const input = "# Existing Title\nSome text.";
		const filename = "test-file.md";
		expect(BentoNormalizer.fixHeadless(input, filename)).toBe(input);
	});

	test("Heuristic B: Fix Shouting", () => {
		const input = "# Title 1\nContent.\n# Title 2\nMore content.";
		const expected = "# Title 1\nContent.\n## Title 2\nMore content.";
		expect(BentoNormalizer.fixShouting(input)).toBe(expected);
	});

	test("Heuristic C: Flatten Deep Nesting", () => {
		const input = "### Level 3\n#### Level 4\n##### Level 5";
		const expected = "### Level 3\n**Level 4**\n**Level 5**";
		expect(BentoNormalizer.flattenDeepNesting(input)).toBe(expected);
	});

	test("Full Normalization", () => {
		const input = "headless start.\n# Second H1\n#### Deep Header";
		const filename = "mixed-bag.md";
		// 1. fixHeadless -> adds "# Mixed Bag" at top
		// 2. fixShouting -> "# Second H1" becomes "## Second H1"
		// 3. flattenDeepNesting -> "#### Deep Header" becomes "**Deep Header**"
		const expected =
			"# Mixed Bag\n\nheadless start.\n## Second H1\n**Deep Header**";
		expect(BentoNormalizer.normalize(input, filename)).toBe(expected);
	});
});
