export const initialState = () => ({
	masterData: { nodes: [], edges: [] },
	health: {
		nodes: 0,
		edges: 0,
		density: 0,
		avgDegree: 0,
		components: 0,
		giantCompPercent: 0,
	},
	db: null, // SQLite Instance
});

export const methods = {
	async fetchHealth() {
		try {
			const res = await fetch("/api/health");
			if (res.ok) {
				this.health = await res.json();
			}
		} catch (e) {
			console.error("Health Fetch Error", e);
		}
	},
	loadGraph(db) {
		this.status = "Extracting Data...";
		this.db = db; // Store for UDF queries
		this.masterData = { nodes: [], edges: [] };

		// Query Nodes
		try {
			const nodesStmt = db.prepare("SELECT * FROM nodes");
			const excludedIds = new Set([
				"term-035",
				"CIP-3",
				"term-040",
				"term-036",
				"term-038",
				"term-027",
				"term-025",
				"term-026",
				"term-024",
			]);

			while (nodesStmt.step()) {
				const row = nodesStmt.getAsObject();
				if (excludedIds.has(row.id)) continue;
				this.masterData.nodes.push(row);
			}
		} catch (e) {
			console.error("Node Error", e);
		}

		// Query Edges
		try {
			const edgesStmt = db.prepare("SELECT * FROM edges");
			while (edgesStmt.step()) {
				const row = edgesStmt.getAsObject();
				this.masterData.edges.push(row);
			}
		} catch (e) {
			console.error("Edge Error", e);
		}

		// 3. Post-Process: Enrich with Sub-Graph Tags
		const discoveredSubGraphs = new Set();
		this.masterData.nodes.forEach((node) => {
			let subGraph = "misc"; // Default fallback

			// A. Explicit Domain Check
			if (node.domain === "persona") {
				subGraph = "persona";
			}
			// B. Folder Extraction from Source
			else if (node.meta) {
				try {
					const meta = JSON.parse(node.meta);
					if (meta.source) {
						// Extract first folder after root or known folder names
						// e.g. "polyvis/playbooks/foo.md" -> "playbooks"
						// e.g. "debriefs/2025/foo.md" -> "debriefs"
						const _parts = meta.source.split("/");

						// Heuristic: Check for known folders
						const knownFolders = [
							"playbooks",
							"debriefs",
							"briefs",
							"shards",
							"knowledge",
						];
						for (const folder of knownFolders) {
							if (meta.source.includes(folder)) {
								subGraph = folder;
								break;
							}
						}
					}
				} catch (_e) {
					// Invalid meta JSON, ignore
				}
			}

			node.subGraph = subGraph;
			discoveredSubGraphs.add(subGraph);
		});

		// Update State with Discovered Graphs
		this.availableSubGraphs = Array.from(discoveredSubGraphs).sort();
		// DEFAULT: Show ALL Sub-Graphs initially
		this.activeSubGraphs = [...this.availableSubGraphs];
		console.log("Discovered Sub-Graphs:", this.availableSubGraphs);

		// Chain operations
		if (this.constructGraph) this.constructGraph();

		if (this.initRenderer && this.$refs.sigmaContainer) {
			this.initRenderer(this.$refs.sigmaContainer);
		}
	},
};
