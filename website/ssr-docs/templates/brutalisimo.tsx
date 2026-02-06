/**
 * Brutalisimo Test Page
 *
 * Tailwind for layout, inline styles for colors.
 */

import { Layout } from "./base.tsx";
import { SmartBlock } from "../components/SmartBlock.tsx";

export interface BrutalisimoPageData {
	entities: Array<{
		id: string;
		term: string;
		summary?: string;
	}>;
}

export function BrutalisimoPage(data: BrutalisimoPageData): string {
	const { entities } = data;

	const blocks = entities
		.map((entity) => {
			const content = `
				<h3>${entity.term}</h3>
				${entity.summary ? `<p>${entity.summary}</p>` : "<p>No summary available</p>"}
			`;
			const blockId = `b-${entity.id}`;
			return SmartBlock({ id: blockId, content, isLongForm: false });
		})
		.join("\n");

	return Layout({
		title: "Brutalisimo Test",
		pageId: "brutalisimo",
		children: `
			<div class="grid" style="grid-template-columns: 25ch 1fr; height: 100%;">
				<aside class="overflow-y-auto p-1ch border-r border-gray-600 h-full">
					<h2 style="color: #0f0; margin-bottom: 1ch;">Controls</h2>
					<p style="font-size: 11px; color: #999;">
						This sidebar demonstrates independent scrolling.
					</p>
					<div style="margin-top: 1ch;">
						<div style="padding: 0.5ch; background: #333; margin-bottom: 0.5ch;">Filter: All</div>
						<div style="padding: 0.5ch; background: #333; margin-bottom: 0.5ch;">Sort: Alpha</div>
						<div style="padding: 0.5ch; background: #333; margin-bottom: 0.5ch;">View: Grid</div>
					</div>
				</aside>

				<section class="overflow-y-auto p-1ch flex flex-wrap gap-1ch content-start">
					<h2 style="width: 100%; color: #0f0; margin-bottom: 1ch;">SmartBlock Grid (Brutalisimo)</h2>
					${blocks}
				</section>
			</div>
		`,
		sseUrl: undefined,
	});
}

export default BrutalisimoPage;
