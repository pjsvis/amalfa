/**
 * SSR Markdown Parser
 * Server-side markdown rendering using Bun's native markdown API
 * with TOC generation and wiki-link support
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import matter from "gray-matter";
import { resolve, join } from "path";

export interface TocItem {
  id: string;
  text: string;
  number: string;
  level: number;
  header?: TocItem;
  children: TocItem[];
}

export interface DocMetadata {
  title: string;
  file: string;
  date?: string;
  type?: string;
  tags?: string[];
  [key: string]: unknown;
}

export interface ParsedDoc {
  content: string;
  toc: TocItem[];
  metadata: DocMetadata;
  html: string;
}

export interface Reference {
  id: string;
  title: string;
  type: string;
  content: string;
  tags: string[];
}

/**
 * Generate slug from heading text
 */
function generateSlug(text: string): string {
  const cleanText = text.replace(/<[^>]*>/g, "");
  const slug = cleanText
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `section-${Date.now()}`;
}

/**
 * Parse markdown and generate TOC using Bun's native API
 */
export function parseMarkdownWithTOC(markdown: string): {
  html: string;
  toc: TocItem[];
} {
  // Extract headings for TOC
  const toc: TocItem[] = [];
  let currentGroup: TocItem | null = null;
  let h2Count = 0;
  let h3Count = 0;

  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings: Array<{ level: number; text: string; slug: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1]?.length || 1;
    const text = match[2]?.trim() || "";
    const slug = generateSlug(text);
    headings.push({ level, text, slug });
  }

  for (const heading of headings) {
    const item: TocItem = {
      id: heading.slug,
      text: heading.text,
      number: "",
      level: heading.level,
      children: [],
    };

    if (heading.level === 2) {
      h2Count++;
      h3Count = 0;
      item.number = `${h2Count}.`;
      currentGroup = { ...item, children: [] };
      toc.push(currentGroup);
    } else {
      h3Count++;
      if (currentGroup) {
        item.number = `${h2Count}.${h3Count}`;
        currentGroup.children.push(item);
      } else {
        const rootGroup: TocItem = {
          id: "root",
          text: "Top Level",
          number: "",
          level: 1,
          children: [{ ...item, number: `0.${h3Count}` }],
        };
        toc.unshift(rootGroup);
      }
    }
  }

  // Use Bun's native markdown renderer
  const html = (Bun as any).markdown?.html(markdown) || markdown;

  return { html, toc };
}

/**
 * Process wiki-links and references
 */
export function processWikiLinks(
  html: string,
  references: Record<string, Reference>,
): string {
  let processed = html;

  // Process [[wiki-links]]
  processed = processed.replace(/\[\[(.*?)\]\]/g, (_match, content) => {
    const text = content.trim();
    if (references[text]) {
      return `<a href="/ssr-docs/ref/${encodeURIComponent(text)}" class="wiki-ref" data-ref="${text}">${text}</a>`;
    }
    return `<span class="wiki-unresolved" title="Unresolved Link">[${text}]</span>`;
  });

  // Process reference patterns (e.g., BRIEF-001, playbook-name)
  processed = processed.replace(
    /\b([A-Z]{2,}-\d+|[a-z]+-[a-z]+-\d+)\b/g,
    (match) => {
      if (references[match]) {
        return `<a href="/ssr-docs/ref/${encodeURIComponent(match)}" class="wiki-ref" data-ref="${match}">${match}</a>`;
      }
      return match;
    },
  );

  return processed;
}

/**
 * Load and parse a markdown document
 */
export function loadDocument(
  docsPath: string,
  filename: string,
  references: Record<string, Reference> = {},
): ParsedDoc {
  const filePath = resolve(docsPath, filename);

  if (!existsSync(filePath)) {
    throw new Error(`Document not found: ${filename}`);
  }

  const fileContent = readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const { html, toc } = parseMarkdownWithTOC(content);
  const processedHtml = processWikiLinks(html, references);

  return {
    content: processedHtml,
    toc,
    metadata: {
      ...data,
      file: filename,
    } as DocMetadata,
    html: processedHtml,
  };
}

/**
 * Get all documents from a directory
 */
export function getAllDocuments(docsPath: string): DocMetadata[] {
  if (!existsSync(docsPath)) {
    return [];
  }

  const docs: DocMetadata[] = [];

  function scanDirectory(dir: string, basePath: string = "") {
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = join(dir, item.name);

      if (
        item.isDirectory() &&
        !item.name.startsWith(".") &&
        item.name !== "node_modules"
      ) {
        scanDirectory(fullPath, join(basePath, item.name));
      } else if (
        item.isFile() &&
        (item.name.endsWith(".md") || item.name.endsWith(".MD"))
      ) {
        const filePath = join(basePath, item.name);
        try {
          const content = readFileSync(fullPath, "utf-8");
          const { data } = matter(content);
          docs.push({
            ...data,
            file: filePath,
          } as DocMetadata);
        } catch (e) {
          console.warn(`Failed to parse ${filePath}:`, e);
        }
      }
    }
  }

  scanDirectory(docsPath);
  return docs;
}

/**
 * Categorize documents by type
 */
export function categorizeDocuments(docs: DocMetadata[]): {
  index: DocMetadata[];
  playbooks: DocMetadata[];
  debriefs: DocMetadata[];
  briefs: DocMetadata[];
} {
  const index: DocMetadata[] = [];
  const playbooks: DocMetadata[] = [];
  const debriefs: DocMetadata[] = [];
  const briefs: DocMetadata[] = [];

  for (const doc of docs) {
    const file = doc.file.toLowerCase();

    if (file.includes("playbook")) {
      playbooks.push(doc);
    } else if (file.includes("debrief")) {
      debriefs.push(doc);
    } else if (file.includes("brief")) {
      briefs.push(doc);
    } else {
      index.push(doc);
    }
  }

  playbooks.sort((a, b) => {
    const titleA = (a.title || a.file).toLowerCase();
    const titleB = (b.title || b.file).toLowerCase();
    return titleA.localeCompare(titleB);
  });

  debriefs.sort((a, b) => {
    const dateA = new Date(a.date || 0).getTime();
    const dateB = new Date(b.date || 0).getTime();
    return dateB - dateA;
  });

  return { index, playbooks, debriefs, briefs };
}

/**
 * Load references from JSON file
 */
export function loadReferences(refsPath: string): Record<string, Reference> {
  if (!existsSync(refsPath)) {
    return {};
  }

  try {
    const content = readFileSync(refsPath, "utf-8");
    return JSON.parse(content) as Record<string, Reference>;
  } catch (e) {
    console.warn(`Failed to load references from ${refsPath}:`, e);
    return {};
  }
}
