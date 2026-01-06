import { spawn } from "bun";

export interface SemanticMatch {
	file: string;
	content: string;
	line: number;
}

export class SemanticMatcher {
	private debug: boolean;

	constructor(debug = false) {
		this.debug = debug;
	}

	async findCandidates(
		query: string,
		path: string,
		limit = 3,
	): Promise<SemanticMatch[]> {
		if (!query || query.length < 5) return [];

		// Use -c to get content
		const cmd = ["mgrep", "search", "-c", "-m", limit.toString(), query, path];

		try {
			const proc = spawn(cmd, {
				stdout: "pipe",
				stderr: "pipe",
			});

			const output = await new Response(proc.stdout).text();
			// Remove ANSI codes
			// biome-ignore lint/suspicious/noControlCharactersInRegex: Required for stripping ANSI escape sequences from mgrep output
			const cleanOutput = output.replace(/\u001b\[\d+m/g, "");

			return this.parseOutputBlock(cleanOutput);
		} catch (e) {
			if (this.debug) console.error("Semantic Match Error:", e);
			return [];
		}
	}

	private parseOutputBlock(output: string): SemanticMatch[] {
		const lines = output.split("\n");
		const matches: SemanticMatch[] = [];

		let currentMatch: SemanticMatch | null = null;
		let currentContent: string[] = [];

		// Header Regex: ./path/to/file:1-10 (99% match)
		// Captures: 1=File, 2=StartLine, 3=EndLine, 4=Percentage
		const headerRegex = /^(.+?):(\d+)(?:-(\d+))? \((\d+(?:\.\d+)?)% match\)$/;

		for (const line of lines) {
			const header = line.match(headerRegex);

			if (header?.[1] && header[2]) {
				// Push previous match if exists
				if (currentMatch) {
					currentMatch.content = currentContent.join(" ").trim();
					matches.push(currentMatch);
				}
				// Start new match
				currentMatch = {
					file: header[1],
					line: parseInt(header[2], 10),
					content: "",
				};
				currentContent = [];
			} else if (currentMatch) {
				// Determine if this is a separator or content
				// mgrep output might have empty lines.
				if (line.trim() !== "--") {
					// specific separator check if any
					currentContent.push(line.trim());
				}
			}
		}

		// Push final match
		if (currentMatch) {
			currentMatch.content = currentContent.join(" ").trim();
			matches.push(currentMatch);
		}

		return matches;
	}
}
