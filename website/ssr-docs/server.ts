#!/usr/bin/env bun

import { join, resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { serve } from "bun";
import { PROJECT_ROOT, resolvePath } from "./lib/paths.ts";

if (!PROJECT_ROOT) {
  console.error("Could not find project root (no marker file found)");
  process.exit(1);
}

const ROOT_PATH = PROJECT_ROOT;

// === Config ===
const AMALFA_DIRS = {
  base: ROOT_PATH,
  logs: join(ROOT_PATH, ".amalfa/logs"),
  runtime: join(ROOT_PATH, ".amalfa/runtime"),
  cache: join(ROOT_PATH, ".amalfa/cache"),
  scratchpad: join(ROOT_PATH, ".amalfa/scratchpad"),
  tasks: {
    pending: join(ROOT_PATH, ".amalfa/tasks/pending"),
    processing: join(ROOT_PATH, ".amalfa/tasks/processing"),
    completed: join(ROOT_PATH, ".amalfa/tasks/completed"),
  },
};

function ensureDirs() {
  for (const val of Object.values(AMALFA_DIRS)) {
    if (typeof val === "string" && !existsSync(val)) mkdirSync(val, { recursive: true });
  }
}
ensureDirs();

interface Config {
  sources: string[];
  database: string;
  embeddings: { model: string; dimensions: number };
  watch: { enabled: boolean };
  ember: { enabled: boolean };
  sonar: { enabled: boolean; port: number };
  scratchpad: { enabled: boolean };
}

async function loadConfig(): Promise<Config> {
  return {
    sources: ["."],
    database: ".amalfa/resonance.db",
    embeddings: { model: "BAAI/bge-small-en-v1.5", dimensions: 384 },
    watch: { enabled: true },
    ember: { enabled: true },
    sonar: { enabled: true, port: 3012 },
    scratchpad: { enabled: true },
  };
}

const CONFIG = await loadConfig();

// === Lifecycle ===
class Lifecycle {
  constructor(
    private name: string,
    private pidFile: string,
  ) {}
  async start() {
    if (existsSync(this.pidFile)) {
      const pid = parseInt(await Bun.file(this.pidFile).text());
      try { process.kill(pid, 0); console.log(`${this.name} already running (PID: ${pid})`); return; } catch {}
    }
    await Bun.write(this.pidFile, String(process.pid));
  }
  async status() {
    if (!existsSync(this.pidFile)) return false;
    const pid = parseInt(await Bun.file(this.pidFile).text());
    try { process.kill(pid, 0); return true; } catch { return false; }
  }
  async stop() {
    if (existsSync(this.pidFile)) {
      const pid = parseInt(await Bun.file(this.pidFile).text());
      try { process.kill(pid); } catch {}
      await Bun.file(this.pidFile).delete();
    }
  }
}

const lifecycle = new Lifecycle("SSR-Docs", join(AMALFA_DIRS.runtime, "ssr-docs.pid"));

// === Imports ===
import { parseMarkdownWithTOC, loadDocument, type TocItem } from "./lib/markdown.ts";
import { getDocumentRegistry, type DocMetadata } from "./lib/doc-registry.ts";
import { renderDashboardPage, renderLexiconPage, renderDocPage, getDashboardData, getLexiconData } from "./templates/index.ts";
import { Layout } from "./templates/base.tsx";
import { BrutalisimoPage } from "./templates/brutalisimo.tsx";

const PORT = Number(process.env.PORT || 3001);
const DB_PATH = join(ROOT_PATH, CONFIG.database);

// === Helpers ===

/**
 * Parse HTML into sections by h2/h3 boundaries.
 * Bun's markdown doesn't add IDs, so we generate them from heading text.
 */
function parseSections(html: string): Array<{ id: string; heading: string; content: string; level: number }> {
  const sections: Array<{ id: string; heading: string; content: string; level: number }> = [];
  
  // Match h2 and h3 tags (Bun doesn't add IDs)
  const headingRegex = /<h([23])>(.*?)<\/h\1>/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let currentSection: { id: string; heading: string; level: number; startIndex: number } | null = null;
  
  while ((match = headingRegex.exec(html)) !== null) {
    const level = Number.parseInt(match[1] || "2");
    const heading = match[2]?.replace(/<[^>]*>/g, "").trim() || "Untitled";
    const id = `section-${heading.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Save previous section content
    if (currentSection) {
      const content = html.substring(currentSection.startIndex, match.index).trim();
      sections.push({
        ...currentSection,
        content,
      });
    }
    
    // Start new section
    currentSection = {
      id,
      heading,
      level,
      startIndex: match.index + match[0].length,
    };
  }
  
  // Add final section
  if (currentSection) {
    const content = html.substring(currentSection.startIndex).trim();
    sections.push({
      ...currentSection,
      content,
    });
  }
  
  return sections;
}

// === Server ===
async function runServer() {
  await lifecycle.start();
  
  const server = serve({
    port: PORT,
    fetch: async (req: Request) => {
      const url = new URL(req.url);
      const path = url.pathname;
      const headers: Record<string, string> = { "Content-Type": "text/html; charset=utf-8" };
      
      if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      }
      headers["Access-Control-Allow-Origin"] = "*";
      
      // Static CSS
      if (path === "/css/terminal.css") {
        const file = Bun.file(resolvePath("public/css/terminal.css"));
        return new Response(file, { headers: { "Content-Type": "text/css" } });
      }
      if (path === "/css/tailwind.css") {
        const file = Bun.file(resolvePath("public/css/tailwind.css"));
        return new Response(file, { headers: { "Content-Type": "text/css" } });
      }
      if (path === "/favicon.ico") {
        return new Response(null, { status: 204 });
      }
      
      // Graph Page
      if (path === "/graph") {
        try {
          const html = Layout({
            title: "graph",
            pageId: "graph",
            children: `
              <article id="content" style="height: calc(100vh - 9ch); overflow-y: auto; padding: 2ch;">
                <h1>Knowledge Graph</h1>
                <p style="color: var(--dim);">Graph visualization coming soon.</p>
                <div style="margin-top: 4ch; padding: 2ch; border: 1px dashed var(--dim);">
                  <p style="font-family: monospace; color: var(--accent);">[WAITING_FOR_DATA]</p>
                </div>
              </article>
            `,
          });
          return new Response(html, { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }

      // About Page (from public/about/index.html)
      if (path === "/about") {
        try {
          const file = Bun.file(resolvePath("public/about/index.html"));
          const html = await file.text();
          return new Response(html, { headers: { "Content-Type": "text/html" } });
        } catch (e) {
          return new Response(`About page not found: ${e}`, { status: 404, headers });
        }
      }

      // Dashboard
      if (path === "/" || path === "/dashboard") {
        try {
          const data = await getDashboardData(CONFIG);
          return new Response(renderDashboardPage(data), { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }
      
      // Lexicon
      if (path === "/lexicon") {
        try {
          const data = await getLexiconData();
          return new Response(renderLexiconPage(data), { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }
      
      // Brutalisimo Test Page
      if (path === "/brutalisimo") {
        try {
          const data = await getLexiconData();
          const entities = data.entries.map((e) => ({
            id: e.id || e.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            term: e.title,
            summary: e.description,
          }));
          return new Response(BrutalisimoPage({ entities }), { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }

      // Brutalisimo Doc Browser
      if (path === "/brutalisimo-doc") {
        try {
          const filename = url.searchParams.get("file") || "playbooks/css-layout-skill-playbook.md";
          const registry = getDocumentRegistry();
          const { loadDocument } = await import("./lib/markdown.ts");
          const parsedDoc = loadDocument(ROOT_PATH, filename);

          const brutalData = {
            doc: {
              title: parsedDoc.metadata.title || filename,
              html: parsedDoc.html,
              metadata: parsedDoc.metadata,
            },
            categories: {
              index: registry.byCategory.index.map(d => ({ file: d.file, title: d.title || d.file })),
              playbooks: registry.byCategory.playbooks.map(d => ({ file: d.file, title: d.title || d.file })),
              debriefs: registry.byCategory.debriefs.map(d => ({ file: d.file, title: d.title || d.file })),
              briefs: registry.byCategory.briefs.map(d => ({ file: d.file, title: d.title || d.file })),
            },
          };

          const { BrutalisimoDocPage } = await import("./templates/brutalisimo-doc.tsx");
          return new Response(BrutalisimoDocPage(brutalData), { headers });
        } catch (e) {
          return new Response(`Error: ${e}`, { status: 500, headers });
        }
      }
      
      // API: Config
      if (path === "/api/config") {
        return new Response(JSON.stringify({ sources: CONFIG.sources, database: CONFIG.database, embeddings: CONFIG.embeddings, features: { watch: CONFIG.watch.enabled, ember: CONFIG.ember.enabled, sonar: CONFIG.sonar.enabled, scratchpad: CONFIG.scratchpad.enabled } }), { headers: { ...headers, "Content-Type": "application/json" } });
      }
      
      // API: Stats
      if (path === "/api/stats") {
        try {
          const { Database } = await import("bun:sqlite");
          const db = new Database(DB_PATH, { readonly: true });
          const nodes = (db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number })?.c || 0;
          const edges = (db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number })?.c || 0;
          db.close();
          return new Response(JSON.stringify({ nodes, edges, vectorDimension: CONFIG.embeddings.dimensions }), { headers: { ...headers, "Content-Type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
        }
      }
      
      // API: Stream (placeholder)
      if (path === "/api/stream") {
        return new Response("event: ping\ndata: {\"type\":\"ping\"}\n\n", { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
      }
      
      // Doc Index
      if (path === "/doc" || path === "/doc/") {
        const registry = getDocumentRegistry();
        const firstDoc = registry.byCategory.index[0] || registry.byCategory.playbooks[0] || registry.byCategory.debriefs[0] || registry.byCategory.briefs[0];
        if (firstDoc) {
          return Response.redirect(`${path}/${firstDoc.file}`, 302);
        }
        return renderNoDocsPage();
      }

      // Doc Viewer
      const docMatch = path.match(/^\/doc\/(.+)$/);
      if (docMatch && docMatch[1]) {
        try {
          const filename = docMatch[1];
          const registry = getDocumentRegistry();
          const doc = loadDocument(ROOT_PATH, filename);
          const html = renderDocPage({
            doc: {
              title: doc.metadata.title || doc.metadata.file || "Untitled",
              content: doc.html,
              toc: doc.toc,
              metadata: doc.metadata,
            },
            categories: registry.byCategory,
          });
          return new Response(html, { headers });
        } catch (e) {
          return new Response(`Document not found: ${e}`, { status: 404, headers });
        }
      }

      return new Response("Not Found", { status: 404, headers });
    },
  });

  console.log(`SSR Docs running on http://localhost:${PORT}`);
  console.log(`  /          - Dashboard`);
  console.log(`  /lexicon   - Lexicon`);
  console.log(`  /doc       - Documentation`);
  await new Promise(() => {});
}

function generateNav(categories: { index: DocMetadata[]; playbooks: DocMetadata[]; debriefs: DocMetadata[]; briefs: DocMetadata[] }): string {
  return `<article><header><strong>Navigation</strong></header><div class="doc-categories">
    ${Object.entries(categories).map(([cat, files]) => `
      <details ${cat === "index" ? "open" : ""}>
        <summary>${cat.charAt(0).toUpperCase() + cat.slice(1)}</summary>
        <ul>${files.map((f) => `<li><a href="/doc/${f.file}" class="nav-link">${f.title || f.file}</a></li>`).join("")}</ul>
      </details>`).join("")}
  </div></article>`;
}

function renderNoDocsPage(): Response {
  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>amalfa | docs</title>
  <link rel="stylesheet" href="/css/terminal.css">
</head>
<body>
  <header>
    <div class="brand">AMALFA</div>
    <nav>
      <a href="/">DASHBOARD</a>
      <a href="/lexicon">LEXICON</a>
      <a href="/doc" class="active">DOCS</a>
    </nav>
  </header>
  <main>
    <aside class="lhs-panel">
      <p>No documents found.</p>
    </aside>
    <div class="rhs-panel">
      <h1>Documentation</h1>
      <p>Add markdown files to the docs/ directory.</p>
    </div>
  </main>
</body>
</html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

runServer().catch(e => { console.error(e); process.exit(1); });
