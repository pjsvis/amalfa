/**
 * SmartBlock Component (Brutalisimo Pattern)
 *
 * Uses plain inline styles - no cascade, no scoped styles.
 */

export interface SmartBlockProps {
	id: string;
	content: string;
	isLongForm?: boolean;
}

export function SmartBlock({ id, content, isLongForm = false }: SmartBlockProps): string {
	const maxWidth = isLongForm ? "60ch" : "45ch";
	const scrollStyles = isLongForm ? "height: calc(100vh - 9ch); overflow-y: auto;" : "";
	const marginBottom = isLongForm ? "" : "margin-bottom: 1ch;";

	return `
		<article
			id="${id}"
			style="max-width: ${maxWidth}; padding: 1ch; border: 1px solid #666; background: #252525; ${marginBottom} ${scrollStyles}"
		>
			<div style="font-size: 9px; color: #888; margin-bottom: 0.5ch;">
				agent-browse --target #${id}
			</div>
			<div class="markdown-body">
				${content}
			</div>
		</article>
	`;
}

export default SmartBlock;
