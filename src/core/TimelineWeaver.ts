import type { ResonanceDB } from "@src/resonance/db";

export const TimelineWeaver = {
	weave(db: ResonanceDB) {
		console.log("⏳ TimelineWeaver: Initializing...");

		// 1. Fetch Debriefs
		const nodes = db.getNodesByType("debrief");
		if (nodes.length < 2) {
			console.log(
				`⏳ TimelineWeaver: Not enough debriefs to link (${nodes.length}).`,
			);
			return;
		}

		// 2. Extract Dates & Sort
		const datedNodes = nodes
			.map((node) => {
				let dateStr =
					typeof node.meta?.date === "string" ? node.meta.date : undefined;

				// Fallback: Filename (e.g. 2025-12-14-foo.md)
				const source =
					typeof node.meta?.source === "string" ? node.meta.source : undefined;

				if (!dateStr && source) {
					const basename = source.split("/").pop() || "";
					const match = basename.match(/^(\d{4}-\d{2}-\d{2})/);
					if (match) dateStr = match[1];
				}

				return {
					...node,
					dateObj: dateStr ? new Date(dateStr) : null,
				};
			})
			.filter((n) => n.dateObj && !Number.isNaN(n.dateObj.getTime()));

		// Sort Descending (Newest First) -> [Dec 14, Dec 13, Dec 12]
		// biome-ignore lint/style/noNonNullAssertion: dateObj guaranteed non-null by filter above
		datedNodes.sort((a, b) => b.dateObj!.getTime() - a.dateObj!.getTime());

		// 3. Weave Edges
		let edgesAdded = 0;
		for (let i = 0; i < datedNodes.length - 1; i++) {
			const current = datedNodes[i];
			const previous = datedNodes[i + 1];

			// Edge: Current SUCCEEDS Previous
			// e.g. Dec 14 (Source) -> SUCCEEDS -> Dec 13 (Target)
			if (current && previous) {
				db.insertEdge(current.id, previous.id, "SUCCEEDS");
				edgesAdded++;
			}
		}

		console.log(
			`⏳ TimelineWeaver: Linked ${edgesAdded} debriefs in chronological chain.`,
		);
	},
};
