import { marked } from "marked";

export default () => ({
	docs: [],
	toc: [],

	// State
	viewMode: "browse", // 'browse' (L+M) | 'reference' (M+R)
	navTab: "index", // 'index' | 'outline'
	leftOpen: false, // Mobile sidebar state
	rightOpen: false, // Mobile sidebar state
	showTocNumbers: false, // Hide section numbers by default
	showSource: false, // Toggle Raw JSON View

	// Content
	contentMain: "",
	contentRef: "",
	activeDoc: null,

	references: {}, // Lookup table for Wiki Refs

	experience: [],
	playbooks: [],
	debriefs: [],
	activeAnchor: window.location.hash || "",

	async init() {
		// Track hash changes for active anchor
		window.addEventListener("hashchange", () => {
			this.activeAnchor = window.location.hash || "";
		});

		try {
			// Parallel fetch for speed
			const [indexRes, refsRes, expRes] = await Promise.all([
				fetch("/index.json"),
				fetch("/data/references.json"),
				fetch("/data/experience.json"),
			]);

			this.docs = await indexRes.json();

			if (refsRes.ok) {
				this.references = await refsRes.json();
			} else {
				console.warn("References not found, wiki-linking disabled.");
			}

			if (expRes.ok) {
				this.experience = await expRes.json();
				this.processExperience();
			}

			// Check URL params for initial file
			const params = new URLSearchParams(window.location.search);
			const initialFile = params.get("file");

			if (initialFile) {
				this.loadMain(initialFile);
			} else if (this.docs.length > 0) {
				// Default to first doc
				this.loadMain(this.docs[0].file);
			}
		} catch (e) {
			console.error("Failed to load initial data", e);
		}
	},

	processExperience() {
		// Filter Playbooks
		const playbooks = this.experience.filter(
			(item) => item.type === "playbook",
		);
		// Sort playbooks alphabetically
		playbooks.sort((a, b) => {
			const titleA = (a.title || a.path).toLowerCase();
			const titleB = (b.title || b.path).toLowerCase();
			return titleA.localeCompare(titleB);
		});

		// Filter Debriefs (Sort by date desc if possible, or just use order)
		const debriefs = this.experience.filter((item) => item.type === "debrief");
		// Sort debriefs by date descending (Newest First)
		debriefs.sort((a, b) => {
			const dateA = new Date(a.date || 0);
			const dateB = new Date(b.date || 0);
			return dateB - dateA;
		});

		// Handle AGENTS.md (Protocol) - Prepend to Playbooks
		const agents = this.experience.find((item) => item.type === "protocol");
		if (agents) {
			playbooks.unshift(agents);
		}

		this.playbooks = playbooks;
		this.debriefs = debriefs;
	},

	// --- Actions ---

	async loadMain(filename) {
		try {
			const raw = await (await fetch(`/docs/${filename}`)).text();
			this.contentMain = this.parseMarkdown(raw);
			this.activeDoc = filename;

			// Generate ToC after DOM update
			// Generate ToC after DOM update
			this.$nextTick(() => {
				this.generateToC("#main-content");
				this.processVizDiagrams();

				// Scroll main container to top
				const main = document.querySelector(".app-main");
				if (main) main.scrollTop = 0;

				// Auto-switch to outline view on mobile or if preferred
				// Small delay to allow for visual transition
				// setTimeout(() => {
				//     this.navTab = 'outline';
				// }, 300);
			});

			// Reset View
			// this.viewMode = 'browse'; // Keep current view mode or default to browse
			if (this.viewMode !== "reference") {
				this.viewMode = "browse";
			}
		} catch (e) {
			console.error(`Failed to load ${filename}`, e);
			this.contentMain = `<p class="text-red-500">Error loading document: ${filename}</p>`;
		}
	},

	async loadRef(filename) {
		try {
			const raw = await (await fetch(`/docs/${filename}`)).text();
			this.contentRef = this.parseMarkdown(raw);
			this.viewMode = "reference";
			this.processVizDiagrams();
		} catch (e) {
			console.error(`Failed to load ref ${filename}`, e);
		}
	},

	goBack() {
		this.viewMode = "browse";
		this.contentRef = "";
	},

	// Load a Wiki Reference into the RHS
	loadWikiRef(refId) {
		const ref = this.references[refId];
		if (!ref) return;

		// Render the Reference Card
		const html = `
            <div class="wiki-card">
                <div class="wiki-header">
                    <span class="wiki-type">${ref.type}</span>
                    <h1 class="wiki-title">${ref.title}</h1>
                    <div class="wiki-meta">ID: ${ref.id}</div>
                </div>
                <div class="wiki-content prose prose-sm">
                    ${marked.parse(ref.content)}
                </div>
                ${
									ref.tags.length
										? `
                <div class="wiki-tags">
                    ${ref.tags.map((t) => `<span class="wiki-tag">${t}</span>`).join("")}
                </div>`
										: ""
								}
            </div>
        `;

		this.contentRef = html;
		this.viewMode = "reference";
		this.processVizDiagrams();
	},

	// --- Helpers ---

	parseMarkdown(raw) {
		// Configure marked to add IDs to headers for ToC linking
		const renderer = new marked.Renderer();
		renderer.heading = function ({ tokens, depth }) {
			const text = this.parser.parseInline(tokens);
			const cleanText = text.replace(/<[^>]*>/g, ""); // Strip HTML tags
			let slug = cleanText
				.toLowerCase()
				.replace(/[^\w]+/g, "-")
				.replace(/^-+|-+$/g, "");
			if (!slug) slug = `section-${Math.random().toString(36).substr(2, 9)}`;
			return `<h${depth} id="${slug}">${text}</h${depth}>`;
		};

		// Custom Code Renderer for DOT
		renderer.code = ({ text, lang }) => {
			if (lang === "dot" || lang === "graphviz") {
				try {
					// Use Viz.js (assumed to be loaded globally via script tag in index.html)
					if (typeof Viz !== "undefined") {
						const _viz = new Viz();
						// We need to return a placeholder that we swap out, or render synchronously?
						// Viz.js 2.x is async. For simplicity in this synchronous renderer,
						// we might need a synchronous version or a different approach.
						// However, the old viz.js (lite) was sync.
						// Let's check if we can use the global `Viz` function directly if it's the older version.

						// If we are using the version from the CDN in index.html (viz.js), it might be the older sync one or newer async.
						// Let's assume standard usage:
						return `<div class="viz-container" data-dot="${encodeURIComponent(text)}">Loading Diagram...</div>`;
					}
				} catch (e) {
					console.error("DOT Render Error", e);
					return `<pre class="text-red-500">Error rendering DOT diagram</pre>`;
				}
			}
			// Default behavior with Highlight.js
			if (typeof hljs !== "undefined") {
				try {
					const language = lang && hljs.getLanguage(lang) ? lang : "plaintext";
					const highlighted = hljs.highlight(text, { language }).value;
					return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
				} catch (e) {
					console.warn("Highlight.js error", e);
				}
			}
			return `<pre><code class="language-${lang}">${text}</code></pre>`;
		};

		// 1. Parse Markdown to HTML
		let html = marked.parse(raw, { renderer });

		// 2. Auto-Link Wiki References (Regex Post-Processing)
		// Pattern: Matches OH-XXX, COG-XXX, TERM-XXX, etc.
		if (this.references) {
			html = html.replace(/\b([A-Z]{2,}-\d+|[a-z]+-[a-z]+-\d+)\b/g, (match) => {
				if (this.references[match]) {
					return `<a href="#" class="wiki-ref" data-ref="${match}">${match}</a>`;
				}
				return match;
			});

			// NEW: Handle [[Wiki Internal Links]]
			html = html.replace(/\[\[(.*?)\]\]/g, (_match, content) => {
				const text = content.trim();
				// Case 1: [[ID]] matches reference
				if (this.references[text]) {
					return `<a href="#" class="wiki-ref" data-ref="${text}">${text}</a>`;
				}
				// Case 2: [[Filename.md]] matches doc
				// Not implemented yet (needs Doc lookup), but we can try to guess or use internal-link logic
				// For now, map [[Text]] to a search or placeholder if not a reference.
				return `<span class="wiki-unresolved" title="Unresolved Link">[${text}]</span>`;
			});
		}

		// 3. Post-process Viz.js diagrams
		// We need to do this after the HTML is inserted into the DOM usually, but since we are returning HTML string,
		// we can't easily wait for async Viz.js here.
		// Instead, we'll rely on a nextTick handler in the component to find these containers and render them.
		// See processVizDiagrams() method below.

		// 3. Group into Cards (Post-Processing)
		html = this.groupIntoCards(html);

		return html;
	},

	groupIntoCards(htmlString) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(htmlString, "text/html");
		const body = doc.body;
		const children = Array.from(body.children);

		if (children.length === 0) return htmlString;

		const container = document.createElement("div");
		let currentSection = null;

		// Helper to finalize a section
		const closeSection = () => {
			if (currentSection) {
				container.appendChild(currentSection);
				currentSection = null;
			}
		};

		// Helper to start a new section
		const openSection = (className) => {
			closeSection();
			currentSection = document.createElement("section");
			currentSection.className = className;
		};

		// Start with an intro section for content before the first H2
		openSection("doc-intro");

		children.forEach((node) => {
			if (node.tagName === "H2") {
				// Start a new card for this H2 block
				openSection("doc-card");
			}

			if (currentSection) {
				currentSection.appendChild(node);
			}
		});

		closeSection();

		// Cleanup empty intro if it exists
		const firstChild = container.firstElementChild;
		if (
			firstChild?.classList.contains("doc-intro") &&
			firstChild.children.length === 0
		) {
			firstChild.remove();
		}

		return container.innerHTML;
	},

	processVizDiagrams() {
		this.$nextTick(() => {
			const containers = document.querySelectorAll(".viz-container");
			containers.forEach((container) => {
				const dot = decodeURIComponent(container.getAttribute("data-dot"));
				if (typeof Viz !== "undefined") {
					const viz = new Viz();
					viz
						.renderSVGElement(dot)
						.then((element) => {
							container.innerHTML = "";
							container.appendChild(element);
							container.classList.remove("viz-container");
							container.classList.add("viz-rendered");
						})
						.catch((error) => {
							console.error(error);
							container.innerHTML = `<pre class="text-red-500">Error: ${error.message}</pre>`;
						});
				}
			});
		});
	},

	generateToC(containerSelector) {
		const container = document.querySelector(containerSelector);
		if (!container) return;

		const headers = container.querySelectorAll("h2, h3, h4");
		const groups = [];
		let currentGroup = null;

		Array.from(headers).forEach((h, index) => {
			let id = h.id;
			if (!id) {
				id = `header-${index}`;
				h.id = id;
			}

			// Extract number and text
			const fullText = h.innerText;
			const match = fullText.match(/^(\d+(\.\d+)*\.?)\s+(.*)/);
			const number = match ? match[1] : "";
			const text = match ? match[3] : fullText;

			if (!text.trim()) return;

			const item = {
				text: text,
				number: number,
				id: id,
				level: parseInt(h.tagName.substring(1), 10),
			};

			if (item.level === 2) {
				// Start new group
				currentGroup = { header: item, children: [] };
				groups.push(currentGroup);
			} else {
				// Add to current group or create intro group
				if (!currentGroup) {
					currentGroup = { header: null, children: [] };
					groups.push(currentGroup);
				}
				currentGroup.children.push(item);
			}
		});

		this.toc = groups;
		console.log("Generated TOC Groups:", this.toc);
	},

	// Handle internal link clicks in the main content
	handleContentClick(e) {
		const link = e.target.closest("a");
		if (!link) return;

		const href = link.getAttribute("href");

		// Wiki Reference?
		if (link.classList.contains("wiki-ref")) {
			e.preventDefault();
			const refId = link.getAttribute("data-ref");
			this.loadWikiRef(refId);
			return;
		}

		if (!href) return;

		// Internal Markdown Link? (Simple check: ends with .md and not external)
		if (href.endsWith(".md") && !href.startsWith("http")) {
			e.preventDefault();
			// If in browse mode, open in ref panel
			this.loadRef(href);
		}
		// Anchor Link?
		else if (href.startsWith("#")) {
			// Let default behavior happen (scroll)
		}
		// External?
		else if (href.startsWith("http")) {
			e.preventDefault();
			window.open(href, "_blank");
		}
	},
});
