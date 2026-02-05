/**
 * Doc Page Template
 *
 * SSR-rendered documentation viewer with two sidebars:
 * - Left: Document list (by category)
 * - Middle: TOC (table of contents)
 * - Right: Document content
 */

import { Layout } from "./base.tsx";
import type { TocItem, DocMetadata } from "../lib/markdown.ts";

export interface DocData {
  title: string;
  content: string;
  toc: TocItem[];
  metadata: DocMetadata;
}

export interface DocPageData {
  doc: DocData;
  categories: {
    index: DocMetadata[];
    playbooks: DocMetadata[];
    debriefs: DocMetadata[];
    briefs: DocMetadata[];
  };
}

function renderToc(toc: TocItem[], indent: number = 0): string {
  return toc
    .map((item) => {
      if (item.id === "root" || !item.text) return "";
      return `
        <li class="toc-item toc-level-${item.level}">
          <a href="#${item.id}" class="toc-link">${item.number} ${item.text}</a>
          ${item.children?.length ? `<ul class="toc-children">${renderToc(item.children, indent + 1)}</ul>` : ""}
        </li>
      `.trim();
    })
    .filter(Boolean)
    .join("\n");
}

export function DocPage(data: DocPageData): string {
  const { doc, categories } = data;

  const tocHtml = renderToc(doc.toc);

  const docList = Object.entries(categories)
    .map(([cat, docs]) => {
      if (!docs.length) return "";
      return `
        <details ${cat === "index" ? "open" : ""}>
          <summary>${cat.charAt(0).toUpperCase() + cat.slice(1)}</summary>
          <ul>
            ${docs
              .map((d) => {
                const filename = d.file.split("/").pop()?.replace(/\.md$/i, "") || d.title || d.file;
                return `<li><a href="/doc/${d.file}" class="nav-link ${d.file === doc.metadata.file ? "active" : ""}">${filename}</a></li>`;
              })
              .join("")}
          </ul>
        </details>
      `.trim();
    })
    .filter(Boolean)
    .join("");

  return Layout({
    title: doc.title || "doc",
    pageId: "doc",
    children: `
      <div class="two-sidebars">
        <!-- Sidebar 1: Document List -->
        <aside class="panel doc-nav" role="navigation" aria-label="Document navigation">
          <div class="panel-header">
            <span class="panel-title">DOCUMENTS</span>
          </div>
          <div class="panel-content">
            ${docList}
          </div>
        </aside>

        <!-- Sidebar 2: TOC -->
        <aside class="panel" role="complementary" aria-label="Table of Contents">
          <div class="panel-header">
            <span class="panel-title">CONTENTS</span>
          </div>
          <div class="panel-content">
            <ul class="toc-list">
              ${tocHtml}
            </ul>
          </div>
        </aside>

        <!-- Main Content -->
        <article class="doc-content" role="article">
          <header class="doc-header">
            <h1 class="doc-title">${doc.title || doc.metadata.file}</h1>
            ${doc.metadata.date ? `<time class="doc-date">${doc.metadata.date}</time>` : ""}
            ${doc.metadata.tags ? `<div class="doc-tags">${doc.metadata.tags.map((t: string) => `<span class="tag">${t}</span>`).join(" ")}</div>` : ""}
          </header>
          <div class="doc-body">
            ${doc.content}
          </div>
        </article>
      </div>
    `,
    sseUrl: undefined,
  });
}

export default DocPage;
