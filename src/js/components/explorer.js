export default () => ({
	db: null,
	viz: null,
	terms: [],
	selectedTerm: "",
	searchTerm: "",
	status: "Connecting to Neural Substrate...",
	loading: true,
	loaded: false,
	debug: false,

	init() {
		setTimeout(() => {
			this.loaded = true;
		}, 50);
		this.$nextTick(() => {
			if (window.lucide) window.lucide.createIcons();
		});
		this.viz = new Viz();
		this.loadTerms();
		this.initSqlJs();
	},

	async loadTerms() {
		try {
			const response = await fetch("../terms.json");
			if (!response.ok)
				throw new Error(`HTTP error! Status: ${response.status}`);
			this.terms = await response.json();
			if (this.terms.length > 0) {
				this.selectedTerm = "Pre-Mortem Heuristic";
			}
		} catch (error) {
			console.error("Could not load suggested terms:", error);
			this.status = "Error loading terms.";
		}
	},

	initSqlJs() {
		initSqlJs({
			locateFile: (file) =>
				`https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
		}).then((SQL) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", "/resonance.db", true);
			xhr.responseType = "arraybuffer";

			xhr.onload = (_e) => {
				const uInt8Array = new Uint8Array(xhr.response);
				this.db = new SQL.Database(uInt8Array);
				this.status = "Resonance DB Loaded. Ready.";
				this.loading = false;

				// Load default view if terms loaded
				if (this.selectedTerm) {
					this.visualize(this.selectedTerm);
				}
			};
			xhr.send();
		});
	},

	visualize(term) {
		if (!this.db || !term) return;

		// Sync models
		this.selectedTerm = term;
		this.searchTerm = term;

		// A. Find the Core Node
		// Schema Map: nodes.title -> label
		let stmt = this.db.prepare(
			"SELECT id, title as label, type FROM nodes WHERE id = ? OR title = ? LIMIT 1",
		);
		stmt.bind([term, term]);

		let rootId = null;
		const nodes = new Set();
		const edges = [];
		let row = null;

		if (stmt.step()) row = stmt.getAsObject();
		stmt.free();

		if (!row) {
			stmt = this.db.prepare(
				"SELECT id, title as label, type FROM nodes WHERE id LIKE ? OR title LIKE ? LIMIT 1",
			);
			stmt.bind([`%${term}%`, `%${term}%`]);
			if (stmt.step()) row = stmt.getAsObject();
			stmt.free();
		}

		if (row) {
			rootId = row.id;
			nodes.add(JSON.stringify(row));
		} else {
			this.status = "Term not found.";
			this.$refs.graphOutput.innerHTML = "";
			return;
		}

		// B. Find Neighbors
		// Schema Map: edges.type -> relation, nodes.title -> label
		const outStmt = this.db.prepare(
			"SELECT n.id, n.title as label, n.type, e.type as relation FROM edges e JOIN nodes n ON e.target = n.id WHERE e.source = ?",
		);
		outStmt.bind([rootId]);
		while (outStmt.step()) {
			const r = outStmt.getAsObject();
			nodes.add(JSON.stringify({ id: r.id, label: r.label, type: r.type }));
			edges.push({ from: rootId, to: r.id, label: r.relation });
		}
		outStmt.free();

		const inStmt = this.db.prepare(
			"SELECT n.id, n.title as label, n.type, e.type as relation FROM edges e JOIN nodes n ON e.source = n.id WHERE e.target = ?",
		);
		inStmt.bind([rootId]);
		while (inStmt.step()) {
			const r = inStmt.getAsObject();
			nodes.add(JSON.stringify({ id: r.id, label: r.label, type: r.type }));
			edges.push({ from: r.id, to: rootId, label: r.relation });
		}
		inStmt.free();

		// C. Generate DOT
		let dot = `digraph NeuroMap {
                    rankdir=LR;
                    node [shape=box, fontname="Courier", margin="0.2,0.1", style=filled, fillcolor="white"];
                    edge [fontname="Courier", fontsize=8, color="#555"];
                `;

		nodes.forEach((n) => {
			const node = JSON.parse(n);
			let color = "white";
			let shape = "box";
			let fontColor = "black";

			if (node.id === rootId) {
				color = "black";
				fontColor = "white";
			} else if (node.type === "Term") {
				color = "#f4f4f4";
			} else if (node.type === "Directive") {
				color = "#e0e0e0";
				shape = "component";
			}

			dot += `"${node.id}" [label="${node.label}", fillcolor="${color}", fontcolor="${fontColor}", shape="${shape}"];\n`;
		});

		edges.forEach((e) => {
			dot += `"${e.from}" -> "${e.to}" [label="${e.label}"];\n`;
		});

		dot += "}";

		// D. Render
		this.renderGraph(dot);
		this.status = `Visualizing: ${nodes.size} Nodes, ${edges.length} Connections.`;
	},

	renderGraph(dotString) {
		const container = this.$refs.graphOutput;
		this.viz
			.renderSVGElement(dotString)
			.then((element) => {
				container.innerHTML = "";
				element.setAttribute("width", "100%");
				element.setAttribute("height", "100%");
				container.appendChild(element);
			})
			.catch((error) => {
				console.error(error);
				this.status = "Error rendering graph.";
			});
	},
});
