/**
 * Heuristic A: The "Headless" Fix
 * Detection: Document starts with text, no H1.
 * Action: Insert `# {Filename_Title_Case}` at line 0.
 */
export function fixHeadless(content: string, filename: string): string {
	const lines = content.split("\n");

	// Find first non-empty line, skipping frontmatter
	let firstContentIndex = 0;
	if (lines[0]?.trim() === "---") {
		let i = 1;
		while (i < lines.length && (lines[i]?.trim() ?? "") !== "---") {
			i++;
		}
		if (i < lines.length) {
			firstContentIndex = i + 1; // Start checking after the second '---'
		}
	}

	// Skip empty lines after frontmatter
	while (
		firstContentIndex < lines.length &&
		lines[firstContentIndex]?.trim() === ""
	) {
		firstContentIndex++;
	}

	// If no content at all, consider strictly headless or empty.
	// If content exists, check if it's an H1.
	const firstLine = lines[firstContentIndex];
	const hasH1AtTop = firstLine?.trim().startsWith("# ");

	if (!hasH1AtTop) {
		// Generate title from filename
		const title = filename
			.replace(/\.md$/, "")
			.split(/[-_]/)
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

		// Insert title *after* frontmatter (if any) or at very top
		if (firstContentIndex === 0 && (!lines[0] || lines[0].trim() !== "---")) {
			return `# ${title}\n\n${content}`;
		} else {
			// Must insert after the frontmatter block
			const before = lines.slice(0, firstContentIndex).join("\n");
			const after = lines.slice(firstContentIndex).join("\n");

			const separator = before.length > 0 ? "\n\n" : "";
			return `${before}${separator}# ${title}\n\n${after}`;
		}
	}
	return content;
}

/**
 * Heuristic B: The "Shouting" Fix
 * Detection: Document uses multiple H1s.
 * Action: Keep the first H1, demote subsequent H1s to H2s.
 */
export function fixShouting(content: string): string {
	const lines = content.split("\n");
	let h1Count = 0;

	return lines
		.map((line) => {
			if (line.trim().startsWith("# ")) {
				h1Count++;
				if (h1Count > 1) {
					return `#${line}`; // Demote to ##
				}
			}
			return line;
		})
		.join("\n");
}

/**
 * Heuristic C: The "Deep Nesting" Flattening
 * Detection: Document uses H4, H5, H6.
 * Action: These are treated as Content. Convert to bold text.
 */
export function flattenDeepNesting(content: string): string {
	const lines = content.split("\n");

	return lines
		.map((line) => {
			// Match H4 (#### ), H5 (##### ), H6 (###### )
			const match = line.match(/^(#{4,6})\s+(.+)$/);
			if (match?.[2]) {
				// Convert to bold: "**Title**"
				return `**${match[2].trim()}**`;
			}
			return line;
		})
		.join("\n");
}

export function normalize(content: string, filename: string): string {
	let normalized = content;
	normalized = fixHeadless(normalized, filename);
	normalized = fixShouting(normalized);
	normalized = flattenDeepNesting(normalized);
	return normalized;
}

export const BentoNormalizer = {
	fixHeadless,
	fixShouting,
	flattenDeepNesting,
	normalize,
};
