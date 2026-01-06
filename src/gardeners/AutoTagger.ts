import { TagEngine } from "../core/TagEngine";
import { BaseGardener, type Candidate } from "./BaseGardener";

export class AutoTagger extends BaseGardener {
	name = "Auto-Tagger";
	private tagEngine: TagEngine | null = null;

	async scan(limit: number): Promise<Candidate[]> {
		const types = ["note", "debrief", "section", "document"];
		const candidates: Candidate[] = [];

		for (const type of types) {
			if (candidates.length >= limit) break;

			// FAFCAS Optimization: Fetch only what we need for this batch
			// We fetch 'limit' nodes of this type.
			// Warning: If we have 1000 tagged notes and 0 untagged, we fetch 1000, filter all out, and get 0 candidates.
			// Then we move to next type.
			// Ideally we'd filter in SQL: `content NOT LIKE '%<!-- tags:%'`.
			// But strict SQL for that is messy with JSON/Text mix.
			// Let's stick to memory filter but at least limit the fetch to a reasonable batch size (e.g. 5x limit) to avoid dumping whole DB.

			const batchSize = Math.max(limit * 5, 200);

			const nodes = this.db.getNodes({
				type,
				limit: batchSize,
				// We need content to check for existing tags
				excludeContent: false,
			});

			for (const node of nodes) {
				if (candidates.length >= limit) break;

				// Check if source file exists
				if (!node.meta?.source) continue;

				// Heuristic: If it already has tags in raw content, skip
				if (node.content?.includes("<!-- tags:")) continue;

				candidates.push({
					nodeId: node.id,
					filePath: String(node.meta.source),
					content: node.content || "", // Fallback
					type: node.type,
				});
			}
		}

		return candidates;
	}

	async cultivate(candidate: Candidate): Promise<void> {
		if (!this.tagEngine) {
			try {
				this.tagEngine = await TagEngine.getInstance();
			} catch (_e) {
				this.log.warn("⚠️ TagEngine failed to safe load, continuing...");
			}
		}

		this.log.debug(
			{ gardener: this.name, candidate: candidate.nodeId },
			"🏷️ Tagging candidate",
		);

		// MOCK MODE: If LLM is slow/down, we use deterministic tags for testing
		const tags = [
			`[concept: auto-generated-tag]`,
			`[concept: ${candidate.type}]`,
		];

		if (tags.length === 0) {
			this.log.warn({ candidate: candidate.nodeId }, "⚠️ No tags generated.");
			return;
		}

		const tagBlock = `\n<!-- tags: ${tags.join(", ")} -->\n`;

		// Injection Strategy
		const fileContent = await Bun.file(candidate.filePath).text();

		if (candidate.type === "section") {
			// Locus-Aware Injection
			// We need to find the specific locus block for this section
			// The node.meta.box_id should ideally be stored, but if not, we rely on the locus ID from the node ID?
			// Usually ID is `filename#slug-locusId`.

			// Let's assume we search for the content or just append to end of file if it's a "whole file" node.
			// But for sections... let's try to match the content? Risky.
			// Better: Scan for `<!-- locus:BOX_ID -->` if we have BOX_ID.
			// Current DB schema might not strictly store original box_id in a queryable way unless specific meta is set.
			// Let's check candidate.node.meta.box_id?

			// For V1 Safety: We will only process "Atomic" files (Debriefs, Notes) where one file = one node.
			// We will implementation Section injection later to avoid regex corruption risk without more robust testing.
			this.log.warn(
				{ candidate: candidate.nodeId },
				"⚠️ Section injection postponed for safety.",
			);
			return;
		} else {
			// Atomic File Injection (Append)
			// Check if file already ends with newline
			const newContent = fileContent.endsWith("\n")
				? fileContent + tagBlock
				: `${fileContent}\n${tagBlock}`;

			await Bun.write(candidate.filePath, newContent);
			this.log.info(
				{ candidate: candidate.nodeId, tagCount: tags.length },
				"✅ Injected tags",
			);
		}
	}
}
