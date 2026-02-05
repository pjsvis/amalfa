/**
 * Lexicon Page Template
 *
 * SSR-rendered entity browser with DataStar search.
 * Flow-Horizontal layout with Compact-List controls.
 */

import { Layout } from "./base.tsx";

export interface LexiconEntry {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string[];
  source?: string;
}

export interface LexiconData {
  entries: LexiconEntry[];
  totalCount: number;
  categories: string[];
}

export function LexiconPage(data: LexiconData): string {
  const { entries, totalCount, categories } = data;

  const search = `
    <input type="search"
           id="lexicon-search"
           class="search-input"
           placeholder="FILTER..."
           aria-label="Search entities"
           data-on-input="searchLexicon()">
  `;

  const categoryBtns = categories.map((cat) =>
    `<button class="filter-btn" data-category="${cat}" aria-pressed="true">${cat}</button>`
  ).join("");

  const controls = `
    <div class="compact-controls">
      <div class="control-group">
        <span class="control-label">SEARCH</span>
        ${search}
      </div>
      <div class="control-group">
        <span class="control-label">CATEGORIES</span>
        <div class="control-row">${categoryBtns}</div>
      </div>
      <div class="control-group">
        <span class="control-label">TOTAL</span>
        <span class="stat-value">${totalCount}</span>
      </div>
    </div>
  `;

  const entryList = entries.map((entry) => {
    const hasDescription = !!entry.description;
    return `
      <article class="entity-tile ${hasDescription ? "" : "hollow"}"
               role="article"
               aria-label="Entity: ${entry.title}"
               data-label="${entry.title.toLowerCase()}">
        <div class="entity-term">${entry.title}</div>
        ${entry.description ? `
          <div class="entity-summary">${entry.description}</div>
        ` : `
          <div class="entity-empty">no_def</div>
        `}
      </article>
    `.trim();
  }).join("");

  return Layout({
    title: "lexicon",
    pageId: "lexicon",
    children: `
      <div class="sidebar">
        <div class="controls-panel">
          ${controls}
        </div>
        <div class="lexicon-grid"
             role="feed"
             aria-label="Entity grid"
             id="lexicon-grid">
          ${entryList}
        </div>
      </div>
    `,
    sseUrl: undefined,
  });
}

export default LexiconPage;
