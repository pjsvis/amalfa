/**
 * Brutalisimo Doc Browser
 *
 * Three-column layout using Tailwind for layout, inline styles for colors.
 */

import { Layout } from "./base.tsx";
import { SmartBlock } from "../components/SmartBlock.tsx";

export interface BrutalisimoDocData {
	doc: {
		title: string;
		html: string;
		metadata: {
			file: string;
			date?: string;
			tags?: string[];
		};
	};
	categories: {
		index: Array<{ file: string; title: string }>;
		playbooks: Array<{ file: string; title: string }>;
		debriefs: Array<{ file: string; title: string }>;
		briefs: Array<{ file: string; title: string }>;
	};
}

export function BrutalisimoDocPage(data: BrutalisimoDocData): string {
	const { doc, categories } = data;

	const docList = Object.entries(categories)
		.map(([cat, docs]) => {
			if (!docs.length) return "";
			return `
				<details open>
					<summary style="color: #0f0; font-weight: bold; font-size: 11px; cursor: pointer; margin-bottom: 0.5ch;">
						${cat.toUpperCase()}
					</summary>
					<ul style="list-style: none; padding-left: 1ch; margin: 0.5ch 0;">
						${docs
							.map((d) => {
								const filename = d.file.split("/").pop()?.replace(/\.md$/i, "") || d.title;
								return `<li style="margin: 0.25ch 0;">
									<a href="/brutalisimo-doc?file=${encodeURIComponent(d.file)}"
									   style="font-size: 10px; color: #999; text-decoration: none;">
										${filename}
									</a>
								</li>`;
							})
							.join("")}
					</ul>
				</details>
			`.trim();
		})
		.filter(Boolean)
		.join("");

	const tocMatch = doc.html.matchAll(/<h([23])>(.*?)<\/h\1>/g);
	const toc = Array.from(tocMatch)
		.map((m) => {
			const level = Number.parseInt(m[1] || "2");
			const heading = m[2]?.replace(/<[^>]*>/g, "").trim() || "Untitled";
			const id = `section-${heading.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
			const indent = level === 3 ? "margin-left: 1ch;" : "";
			return `
				<li style="margin: 0.25ch 0; ${indent}">
					<a href="#${id}"
					   style="font-size: 10px; color: #999; text-decoration: none;">
						${heading}
					</a>
				</li>
			`;
		})
		.join("");

	const docId = `doc-${doc.metadata.file.replace(/[^a-z0-9]/g, '-')}`;
	const block = SmartBlock({
		id: docId,
		content: doc.html,
		isLongForm: true,
	});

	return Layout({
		title: doc.title,
		pageId: "brutalisimo-doc",
		children: `
			<div id="grid-doc" class="grid" style="grid-template-columns: 25ch 20ch 1fr; height: 100%;">
				<aside id="aside-left" class="overflow-y-auto p-1ch h-full border-r border-gray-600">
					<h2 style="color: #0f0; font-size: 11px; margin-bottom: 1ch; text-transform: uppercase;">Documents</h2>
					${docList}
				</aside>

				<aside id="aside-right" class="overflow-y-auto p-1ch h-full border-r border-gray-600">
					<h2 style="color: #0f0; font-size: 11px; margin-bottom: 1ch; text-transform: uppercase;">Contents</h2>
					<ul class="list-none p-0 m-0">${toc}</ul>
				</aside>

				<section id="section-content" class="h-full flex flex-col">
					<header id="header-doc" class="flex-shrink-0 p-1ch border-b border-gray-600">
						<h1 style="color: #0f0; font-size: 16px;">${doc.title}</h1>
						${doc.metadata.date ? `<time style="font-size: 10px; color: #999;">${doc.metadata.date}</time>` : ""}
					</header>
					${block}
				</section>
			</div>
		`,
		sseUrl: undefined,
	});
}

export default BrutalisimoDocPage;
