export const initialState = () => ({
	renderer: null,
	hoveredNode: null,
	selectedNode: null,
	searchQuery: "",
	searchResults: [],
	isSearchFocused: false,
	showStats: false,
	stats: { nodes: 0, edges: 0, density: 0, avgDegree: 0, orphans: 0 },
	tooltip: { visible: false, text: "", x: 0, y: 0 },
	ghostEdges: [], // Track added semantic links
	similarNodes: [], // Track similar node data for UI list
	searchComplete: false, // Track if a search has been run for the current node
	hasSimilarNodes: false, // Track if search yielded results
	vectorCache: new Map(), // Cache for parsed vectors
});

export const methods = {
	initRenderer(container) {
		container.innerHTML = "";

		this.renderer = new Sigma(this.graph, container, {
			renderEdgeLabels: true,
			nodeReducer: (node, data) => {
				if (this.selectedNode && node === this.selectedNode.id) {
					return {
						...data,
						highlighted: true,
						size: Math.max(data.size, 25),
						zIndex: 10,
						label: data.label,
					};
				}
				return data;
			},
			labelRenderedSizeThreshold: 5,
			zIndex: true,
		});

		// Initialize Cursor & Events
		container.style.cursor = "grab";
		this.setupEventListeners(container);

		this.status = "Interactive Mode Active. Buttons to Zoom, Drag to Move.";
	},

	setupEventListeners(container) {
		// Dragging
		this.renderer.on("downStage", () => {
			container.style.cursor = "grabbing";
		});
		document.addEventListener("mouseup", () => {
			if (this.renderer?.getMouseCaptor()) {
				this.renderer.getMouseCaptor().isMouseEnabled = true;
			}
			if (!this.hoveredNode) container.style.cursor = "grab";
		});

		// Disable mouse wheel
		try {
			if (this.renderer.getMouseCaptor())
				this.renderer.getMouseCaptor().isMouseWheelEnabled = false;
		} catch (_e) {}
		container.addEventListener("wheel", (e) => e.stopPropagation(), true);

		// Node Events
		this.renderer.on("clickNode", ({ node }) => {
			this.selectNode(node);
		});
		this.renderer.on("enterNode", ({ node }) => {
			container.style.cursor = "pointer";
			this.hoveredNode = node;
		});
		this.renderer.on("leaveNode", () => {
			container.style.cursor = "";
			this.hoveredNode = null;
		});
	},

	selectNode(nodeId) {
		if (!nodeId) {
			this.selectedNode = null;
			if (this.clearGhostEdges) this.clearGhostEdges(); // Clear ghosts on deselect
			if (this.renderer) this.renderer.refresh();
			return;
		}

		// Clear previous ghosts ONLY if context changes (New Node)
		if (this.clearGhostEdges) {
			if (!this.selectedNode || this.selectedNode.id !== nodeId) {
				this.clearGhostEdges();
			}
		}

		const attr = this.graph.getNodeAttributes(nodeId);
		this.selectedNode = {
			id: nodeId,
			...attr,
		};

		// Log click
		console.log("Selected Node:", this.selectedNode);

		// Open Right Sidebar
		this.rightOpen = true;

		if (this.renderer) this.renderer.refresh();
	},

	handleSearch() {
		if (!this.searchQuery) {
			this.searchResults = [];
			return;
		}
		const query = this.searchQuery.toLowerCase();

		if (!this.graph) return;

		const results = [];
		this.graph.forEachNode((node, attrs) => {
			if (attrs.hidden) return; // Skip hidden nodes
			if (
				attrs.label.toLowerCase().includes(query) ||
				node.toLowerCase().includes(query)
			) {
				results.push({ id: node, label: attrs.label });
			}
		});

		this.searchResults = results.slice(0, 10);
	},

	selectSearchResult(nodeId) {
		this.selectNode(nodeId);
		this.searchQuery = "";
		this.searchResults = [];

		// Fly to node
		if (this.renderer) {
			const camera = this.renderer.getCamera();
			const nodePos = this.renderer.getNodeDisplayData(nodeId);
			if (nodePos) {
				camera.animate({
					x: nodePos.x,
					y: nodePos.y,
					ratio: 0.5,
					duration: 500,
				});
			}
		}
	},

	zoomIn() {
		if (!this.renderer) return;
		const camera = this.renderer.getCamera();
		camera.animate({ ratio: camera.ratio / 1.5 });
	},

	zoomOut() {
		if (!this.renderer) return;
		const camera = this.renderer.getCamera();
		camera.animate({ ratio: camera.ratio * 1.5 });
	},

	zoomReset() {
		if (!this.renderer) return;
		this.renderer.getCamera().animatedReset();
	},

	toggleStats() {
		this.showStats = !this.showStats;
		if (this.showStats) {
			this.updateStats();
		}
	},

	updateStats() {
		if (!this.stats || !this.graph) return;

		// If stats functionality isn't active/visible, we might not want to burn cycles,
		// but providing live updates is generally better for UX.

		if (graphologyLibrary.metrics) {
			this.stats.nodes = this.graph.order;
			this.stats.edges = this.graph.size;
			this.stats.density = graphologyLibrary.metrics.graph
				.density(this.graph)
				.toFixed(4);
			let totalDegree = 0;
			this.graph.forEachNode((node) => {
				totalDegree += this.graph.degree(node);
			});
			this.stats.avgDegree = (totalDegree / this.graph.order).toFixed(2);
			this.stats.orphans = this.orphanCount || 0;
		}
	},

	showTooltip(event, text) {
		this.tooltip.visible = true;
		this.tooltip.text = text;
		this.tooltip.x = event.clientX + 10;
		this.tooltip.y = event.clientY + 10;
	},

	hideTooltip() {
		this.tooltip.visible = false;
	},

	linkify(text) {
		if (!text) return "";
		return text.replace(
			/\[([^\]]+)\]\(([^)]+)\)/g,
			'<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>',
		);
	},

	// Phase 2: Ghost Graph (Vector Search)
	async findSimilar(nodeId) {
		if (!this.db) {
			console.error("No Database instance available.");
			return;
		}

		console.log(`🔎 Finding neighbors for ${nodeId}...`);

		// 1. Clear previous ghosts
		if (this.clearGhostEdges) this.clearGhostEdges();

		// Reset Search State
		this.searchComplete = false;
		this.hasSimilarNodes = false;

		try {
			// 2. Get Source Vector
			const result = this.db.exec("SELECT embedding FROM nodes WHERE id = ?", [
				nodeId,
			]);
			if (!result.length || !result[0].values.length) return;

			const embedding = result[0].values[0][0];
			if (!embedding) {
				console.warn("No embedding found for this node.");
				this.searchComplete = true;
				this.hasSimilarNodes = false;
				return;
			}

			// 3. Vector Search (UDF)
			// Note: sql.js exec returns [{columns, values}]
			const query = `
                SELECT id, vec_dot(embedding, ?) as score 
                FROM nodes 
                WHERE id != ? 
                ORDER BY score DESC 
                LIMIT 5
            `;

			const searchRes = this.db.exec(query, [embedding, nodeId]);
			if (!searchRes.length) {
				this.searchComplete = true;
				this.hasSimilarNodes = false;
				return;
			}

			const neighbors = searchRes[0].values; // [[id, score], ...]

			// 4. Draw Ghost Edges
			neighbors.forEach(([targetId, score]) => {
				if (this.graph.hasNode(targetId)) {
					// Check if edge already exists
					if (
						!this.graph.hasEdge(nodeId, targetId) &&
						!this.graph.hasEdge(targetId, nodeId)
					) {
						const edgeId = this.graph.addEdge(nodeId, targetId, {
							type: "arrow",
							label: `Similarity: ${(score).toFixed(2)}`,
							size: 3,
							color:
								getComputedStyle(document.documentElement)
									.getPropertyValue("--color-ghost-edge")
									.trim() || "#FFD700",
							ghost: true,
						});
						this.ghostEdges.push(edgeId);
					}
				}
			});

			// 5. Update UI List
			this.similarNodes = neighbors.map(([id, score]) => ({
				id,
				score: score.toFixed(2),
				label: this.graph.hasNode(id)
					? this.graph.getNodeAttribute(id, "label")
					: id,
			}));

			this.searchComplete = true;
			this.hasSimilarNodes = this.similarNodes.length > 0;

			console.log(`✨ Added ${this.ghostEdges.length} ghost edges.`);
			if (this.renderer) this.renderer.refresh();
		} catch (e) {
			console.error("Vector Search Failed", e);
			this.searchComplete = true;
			this.hasSimilarNodes = false;
		}
	},

	clearGhostEdges() {
		if (!this.graph) return;
		this.ghostEdges.forEach((edgeId) => {
			if (this.graph.hasEdge(edgeId)) {
				this.graph.dropEdge(edgeId);
			}
		});
		this.ghostEdges = [];
		this.ghostEdges = [];
		this.similarNodes = [];
		this.searchComplete = false;
		this.hasSimilarNodes = false;
		if (this.renderer) this.renderer.refresh();
	},
};
