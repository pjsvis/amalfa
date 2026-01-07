import { randomUUID } from "crypto";

export class MarkdownMasker {
	private stash: Map<string, string> = new Map();

	// Regex patterns for "No-Fly Zones"
	private static PATTERNS = [
		/```[\s\S]*?```/g, // Fenced Code Blocks (Multi-line)
		/`[^`]*`/g, // Inline Code
		/^\|.*\|$/gm, // Tables (GFM) - Basic detection
	];

	/**
	 * Replaces No-Fly Zones with inert tokens.
	 */
	public mask(text: string): string {
		let masked = text;

		MarkdownMasker.PATTERNS.forEach((pattern) => {
			masked = masked.replace(pattern, (match) => {
				const token = `__NFZ_${randomUUID().replace(/-/g, "")}__`;
				this.stash.set(token, match);
				return token;
			});
		});

		return masked;
	}

	/**
	 * Restores the original content.
	 */
	public unmask(text: string): string {
		let unmasked = text;
		// Iterate until no tokens remain (handling potential nesting if expanded later)
		this.stash.forEach((content, token) => {
			// Use global replacement in case the token appears multiple times (unlikely but safe)
			unmasked = unmasked.split(token).join(content);
		});
		return unmasked;
	}

	/**
	 * clear the stash after processing a file to free memory
	 */
	public reset() {
		this.stash.clear();
	}
}
