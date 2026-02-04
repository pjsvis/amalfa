import { serve } from "bun";
import {
  parseMarkdownWithTOC,
  loadDocument,
  getAllDocuments,
  categorizeDocuments,
  type DocMetadata,
  type TocItem,
} from "./lib/markdown.ts";

// Generate TOC HTML from TOC items
function tocToHtml(toc: TocItem[], indent: number = 0): string {
  if (!toc.length) return '<p class="muted">No contents</p>';
  let html = "<ul>\n";
  for (const item of toc) {
    if (item.level > 3) continue;
    html += `<li><a href="#${item.id}" data-toc-link>${item.number} ${item.text}</a>`;
    if (item.children && item.children.length > 0) {
      html += tocToHtml(item.children, indent + 1);
    }
    html += "</li>\n";
  }
  html += "</ul>\n";
  return html;
}

const DOCS_PATH = "/Users/petersmith/Dev/GitHub/amalfa/docs";

// Generate navigation sidebar HTML
function generateNav(categories: {
  index: DocMetadata[];
  playbooks: DocMetadata[];
  debriefs: DocMetadata[];
  briefs: DocMetadata[];
}): string {
  return `
    <article>
      <header><strong>Navigation</strong></header>
      <div class="doc-categories">
        ${Object.entries(categories)
          .map(
            ([cat, files]) => `
            <details ${cat === "index" ? "open" : ""}>
              <summary>${cat.charAt(0).toUpperCase() + cat.slice(1)}</summary>
              <ul>
                ${files
                  .map(
                    (f) => `
                    <li><a href="/ssr-docs/doc/${f.file}" 
                           class="nav-link" 
                           data-file="${f.file}"
                           data-title="${f.title || f.file}">${f.title || f.file}</a></li>
                  `,
                  )
                  .join("")}
              </ul>
            </details>
          `,
          )
          .join("")}
      </div>
    </article>`;
}

// Full page template
function renderPage(data: {
  title: string;
  content: string;
  toc: string;
  activeFile?: string;
  categories: {
    index: DocMetadata[];
    playbooks: DocMetadata[];
    debriefs: DocMetadata[];
    briefs: DocMetadata[];
  };
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title} - Amalfa Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <style>
    :root { --pico-font-size: 16px; }
    .docs-layout { display: grid; grid-template-columns: 250px 1fr 200px; gap: 2rem; min-height: calc(100vh - 100px); }
    .docs-sidebar { background: var(--pico-background-color); padding: 1rem; border-right: 1px solid var(--pico-muted-border-color); }
    .docs-content { padding: 1rem 2rem; max-width: 900px; }
    .docs-toc { padding: 1rem; border-left: 1px solid var(--pico-muted-border-color); }
    .docs-toc summary { font-weight: 600; margin-bottom: 0.5rem; }
    .docs-toc ul { padding-left: 1rem; font-size: 0.9rem; }
    .docs-toc li { margin-bottom: 0.25rem; }
    .docs-toc a { text-decoration: none; color: var(--pico-muted-color); }
    .docs-toc a:hover, .docs-toc a.active { color: var(--pico-primary-color); }
    .doc-categories details { margin-bottom: 0.5rem; }
    .doc-categories ul { margin-top: 0.25rem; padding-left: 1.5rem; }
    .nav-link { text-decoration: none; }
    .nav-link.active { font-weight: bold; color: var(--pico-primary-color); }
    .wiki-ref { color: var(--pico-primary-color); text-decoration: none; border-bottom: 1px dotted; }
    .wiki-ref:hover { border-bottom-style: solid; }
    .wiki-unresolved { color: var(--pico-muted-color); font-style: italic; }
    .doc-intro { margin-bottom: 2rem; }
    .doc-card { margin-bottom: 2rem; padding: 1rem; background: var(--pico-background-alt); border-radius: var(--pico-border-radius); }
    pre { background: var(--pico-background-alt); padding: 1rem; overflow-x: auto; border-radius: var(--pico-border-radius); }
    @media (max-width: 1024px) { .docs-layout { grid-template-columns: 1fr; } .docs-sidebar, .docs-toc { display: none; } }
  </style>
</head>
<body>
  <header class="container-fluid">
    <nav>
      <ul><li><strong><a href="/ssr-docs">SSR Docs</a></strong></li></ul>
      <ul><li><a href="/docs">Client Docs</a></li></ul>
    </nav>
  </header>
  <main class="container">
    <div class="docs-layout">
      <aside class="docs-sidebar" id="nav-sidebar">
        ${generateNav(data.categories)}
      </aside>
      <article class="docs-content" id="doc-content">
        ${data.content}
      </article>
      <aside class="docs-toc" id="doc-toc">
        ${data.toc ? `<details open><summary>Contents</summary>${data.toc}</details>` : '<details open><summary>Contents</summary><p class="muted">No contents</p></details>'}
      </aside>
    </div>
  </main>

  <script>
    // Client-side navigation: intercept clicks, fetch JSON, update content
    (function() {
      const navSidebar = document.getElementById('nav-sidebar');
      const docContent = document.getElementById('doc-content');
      const docToc = document.getElementById('doc-toc');
      const pageTitle = document.querySelector('title');

      // Highlight active nav item
      function highlightActive(file) {
        document.querySelectorAll('.nav-link').forEach(link => {
          link.classList.toggle('active', link.dataset.file === file);
        });
      }

      // Update page with new content
      function updatePage(doc) {
        docContent.innerHTML = doc.html;
        docToc.innerHTML = doc.toc ? '<details open><summary>Contents</summary>' + doc.toc + '</details>' 
                                  : '<details open><summary>Contents</summary><p class="muted">No contents</p></details>';
        pageTitle.textContent = (doc.metadata.title || doc.file) + ' - Amalfa Docs';
        highlightActive(doc.file);
        
        // Re-highlight TOC link on scroll
        document.querySelectorAll('#doc-toc a[data-toc-link]').forEach(link => {
          link.classList.remove('active');
        });
      }

      // Fetch document JSON
      async function loadDoc(file) {
        try {
          const res = await fetch('/ssr-docs/api/doc/' + encodeURIComponent(file));
          if (!res.ok) throw new Error('Not found');
          const doc = await res.json();
          updatePage(doc);
        } catch (e) {
          docContent.innerHTML = '<h1>Error</h1><p>' + e.message + '</p>';
        }
      }

      // Intercept nav clicks
      navSidebar.addEventListener('click', (e) => {
        const link = e.target.closest('.nav-link');
        if (link) {
          e.preventDefault();
          const file = link.dataset.file;
          if (file) {
            // Update URL without reload
            history.pushState({}, '', '/ssr-docs/doc/' + file);
            loadDoc(file);
          }
        }
      });

      // Handle browser back/forward
      window.addEventListener('popstate', async () => {
        const path = window.location.pathname;
        if (path.startsWith('/ssr-docs/doc/')) {
          const file = path.replace('/ssr-docs/doc/', '');
          const res = await fetch('/ssr-docs/api/doc/' + encodeURIComponent(file));
          if (res.ok) {
            const doc = await res.json();
            updatePage(doc);
          }
        }
      });

      // Initial highlight
      if (${JSON.stringify(data.activeFile || "")}) {
        highlightActive(${JSON.stringify(data.activeFile || "")});
      }
    })();
  </script>
</body>
</html>`;
}

function notFound(): Response {
  const docs = getAllDocuments(DOCS_PATH);
  const categories = categorizeDocuments(docs);
  const html = renderPage({
    title: "Not Found",
    content: `<h1>404 - Not Found</h1><p>The requested document was not found.</p>`,
    toc: "",
    categories,
  });
  return new Response(html, {
    status: 404,
    headers: { "Content-Type": "text/html" },
  });
}

const server = serve({
  port: process.env.PORT || 3001,
  fetch: async (req: Request) => {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers: Record<string, string> = {
      "Content-Type": "text/html",
    };
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    headers["Access-Control-Allow-Origin"] = "*";

    // /ssr-docs - index page
    if (path === "/ssr-docs" && req.method === "GET") {
      try {
        const docs = getAllDocuments(DOCS_PATH);
        const categories = categorizeDocuments(docs);
        const html = renderPage({
          title: "Docs - SSR",
          content: `<h1>Documentation Browser (SSR)</h1>
            <p>Server-side rendered markdown documentation browser.</p>
            <p>Click any document in the navigation sidebar to view it. Navigation persists during browsing.</p>
            <div class="doc-categories">
              ${Object.entries(categories)
                .map(
                  ([cat, files]) => `
                <details open>
                  <summary>${cat}</summary>
                  <ul>
                    ${files
                      .map(
                        (f) => `
                      <li><a href="/ssr-docs/doc/${f.file}" class="nav-link" data-file="${f.file}" data-title="${f.title || f.file}">${f.title || f.file}</a></li>
                    `,
                      )
                      .join("")}
                  </ul>
                </details>
              `,
                )
                .join("")}
            </div>`,
          toc: "",
          categories,
        });
        return new Response(html, { headers });
      } catch (e) {
        return new Response(`Error: ${e}`, { status: 500, headers });
      }
    }

    // /ssr-docs/doc/* - individual documents (full page SSR)
    if (path.startsWith("/ssr-docs/doc/") && req.method === "GET") {
      const slug = path.replace("/ssr-docs/doc/", "");
      try {
        const parsed = loadDocument(DOCS_PATH, slug, {});
        if (!parsed) {
          return notFound();
        }
        const docs = getAllDocuments(DOCS_PATH);
        const categories = categorizeDocuments(docs);
        const html = renderPage({
          title: parsed.metadata.title || slug,
          content: parsed.html,
          toc: tocToHtml(parsed.toc),
          activeFile: slug,
          categories,
        });
        return new Response(html, { headers });
      } catch (e) {
        return new Response(`Error: ${e}`, { status: 500, headers });
      }
    }

    // /ssr-docs/api/docs - list all documents (JSON)
    if (path === "/ssr-docs/api/docs" && req.method === "GET") {
      try {
        const docs = getAllDocuments(DOCS_PATH);
        return new Response(JSON.stringify({ documents: docs }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // /ssr-docs/api/doc/:slug - get single document (JSON for client-side nav)
    if (path.startsWith("/ssr-docs/api/doc/") && req.method === "GET") {
      const slug = path.replace("/ssr-docs/api/doc/", "");
      try {
        const parsed = loadDocument(DOCS_PATH, slug, {});
        if (!parsed) {
          return new Response(JSON.stringify({ error: "Document not found" }), {
            status: 404,
            headers: { ...headers, "Content-Type": "application/json" },
          });
        }
        // Return JSON with HTML and TOC
        return new Response(
          JSON.stringify({
            file: slug,
            html: parsed.html,
            toc: tocToHtml(parsed.toc),
            metadata: parsed.metadata,
          }),
          {
            headers: { ...headers, "Content-Type": "application/json" },
          },
        );
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    // /ssr-docs/api/parse - parse markdown
    if (path === "/ssr-docs/api/parse" && req.method === "POST") {
      try {
        const body = await req.text();
        const { markdown } = JSON.parse(body);
        const parsed = parseMarkdownWithTOC(markdown);
        return new Response(JSON.stringify(parsed), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), {
          status: 500,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }

    return new Response("Not Found", { status: 404, headers });
  },
});

console.log(
  `SSR Docs Server running on http://localhost:${server.port}/ssr-docs`,
);
