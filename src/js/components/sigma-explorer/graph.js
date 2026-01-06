import { adaptEdge, adaptNode } from "./adapter.js";

export const initialState = () => ({
	graph: null,
	layout: "forceatlas2",
	layoutInstance: null,
	showOrphans: false,
	orphanCount: 0,
});

export const methods = {
	constructGraph() {
		if (!this.graph) this.graph = new graphology.Graph({ type: "directed" });
		else this.graph.clear(); // STRICT RESET

		const nodeCount = this.masterData.nodes.length;
		console.log(
			`Constructing Graph for Domain: ${this.activeDomain} (Source: ${nodeCount} items)`,
		);

		// Add ALL Nodes (Filter dynamically later)
		this.masterData.nodes.forEach((row) => {
			if (row.type === "root" || row.type === "domain") return;

			// Add NodeSub-Graph Filter (Composability)
			// A node is included if its assigned subGraph is in the active list.
			if (!this.activeSubGraphs.includes(row.subGraph)) return;

			// Add Node (via Safe Adapter)
			if (!this.graph.hasNode(row.id)) {
				const sigmaNode = adaptNode(row);

				// Override Color if needed based on dynamic layout state (rare, usually adapter is enough)
				// We keep the adapter pure, so if we need CSS var injection we do it here or in adapter.
				// For now, adapter defaults are fine.

				// Re-apply originalColor logic if it was dynamic in the old code?
				// The old code had: originalColor: row.subGraph === "persona" ? "black" : "#475569"
				// The adapter sets 'color'. Let's ensure we have originalColor/Size if needed for resets.
				sigmaNode.originalColor = sigmaNode.color;
				sigmaNode.originalSize = sigmaNode.size;

				this.graph.addNode(sigmaNode.id, sigmaNode);
			}
		});

		// Add Edges
		this.masterData.edges.forEach((row) => {
			if (this.graph.hasNode(row.source) && this.graph.hasNode(row.target)) {
				if (!this.graph.hasEdge(row.source, row.target)) {
					const sigmaEdge = adaptEdge(row);
					// Inject dynamic CSS var color if needed (adapter used hardcoded slate)
					sigmaEdge.color =
						getComputedStyle(document.documentElement)
							.getPropertyValue("--graph-edge")
							.trim() || "#cbd5e1";

					this.graph.addEdge(sigmaEdge.source, sigmaEdge.target, sigmaEdge);
				}
			}
		});

		const currentNodes = this.graph.order;
		const currentEdges = this.graph.size;
		this.status = `Graph Config: ${this.activeSubGraphs.join("+")} | ${currentNodes} Nodes, ${currentEdges} Edges.`;

		// Compute Stats & Visibility
		this.computeOrphanStats();

		// Update Stats Panel if active
		if (this.updateStats) this.updateStats();

		// Run Layout
		this.runLayout("forceatlas2");

		// Apply Default Visualization
		if (this.toggleColorViz) this.toggleColorViz("louvain", true);
		if (this.toggleSizeViz) this.toggleSizeViz("pagerank");

		// Apply Orphan Visibility Last (Overrides colors/visibility)
		this.updateOrphanVisibility();
	},

	toggleSubGraph(subGraph) {
		if (this.activeSubGraphs.includes(subGraph)) {
			// Remove it
			this.activeSubGraphs = this.activeSubGraphs.filter((g) => g !== subGraph);
		} else {
			// Add it
			this.activeSubGraphs.push(subGraph);
		}

		console.log("Active Sub-Graphs:", this.activeSubGraphs);

		// Must Reconstruct Graph
		this.constructGraph();

		// Refresh Louvain if active
		if (this.activeColorViz === "louvain") {
			this.louvainCommunities = null; // Force recalc
			if (this.toggleColorViz) this.toggleColorViz("louvain", true);
		} else {
			if (this.renderer) this.renderer.refresh();
		}

		// Center the new graph
		if (this.zoomReset) this.zoomReset();
	},

	toggleOrphans() {
		this.showOrphans = !this.showOrphans;
		this.updateOrphanVisibility();
	},

	updateOrphanVisibility() {
		if (!this.graph) return;

		this.graph.forEachNode((node) => {
			const degree = this.graph.degree(node);
			if (degree === 0) {
				if (this.showOrphans) {
					this.graph.setNodeAttribute(node, "hidden", false);
					this.graph.setNodeAttribute(node, "color", "#ef4444"); // Red for emphasis
					// this.graph.setNodeAttribute(node, "size", 8);
				} else {
					this.graph.setNodeAttribute(node, "hidden", true);
				}
			}
		});

		if (this.renderer) this.renderer.refresh();
	},

	computeOrphanStats() {
		if (!this.graph) return;
		let count = 0;
		this.graph.forEachNode((node) => {
			if (this.graph.degree(node) === 0) count++;
		});
		this.orphanCount = count;
	},

	runLayout(algorithm) {
		if (!this.graph) return;
		this.layout = algorithm;

		if (this.layoutInstance) {
			this.layoutInstance.stop();
			this.layoutInstance = null;
		}

		if (algorithm === "forceatlas2") {
			if (!graphologyLibrary.layoutForceAtlas2)
				return alert("ForceAtlas2 not loaded.");
			graphologyLibrary.layoutForceAtlas2.assign(this.graph, {
				iterations: 50,
				settings: { gravity: 1 },
			});
		} else if (algorithm === "circular") {
			if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
			graphologyLibrary.layout.circle.assign(this.graph);
		} else if (algorithm === "random") {
			if (!graphologyLibrary.layout) return alert("Layout library not loaded.");
			graphologyLibrary.layout.random.assign(this.graph);
		} else if (algorithm === "noverlap") {
			if (!graphologyLibrary.layoutNoverlap)
				return alert("Noverlap library not loaded.");
			graphologyLibrary.layoutNoverlap.assign(this.graph);
		}
	},
};
