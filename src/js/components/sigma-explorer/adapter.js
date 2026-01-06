/**
 * Sigma Data Adapter
 *
 * Responsible for sanitizing and transforming "Resonance DB" nodes/edges
 * into "Sigma.js" compatible graph elements.
 *
 * Principle: The View shall not know the Database schema.
 */

// Safe Allowlist of attributes to pass through to the visual layer
const NODE_ATTR_ALLOWLIST = new Set([
	"id",
	"domain",
	"layer",
	"subGraph",
	"external_refs",
]);

/**
 * Adapts a raw DB row to a Sigma Graph Node.
 * @param {Object} row - The raw node row from SQLite (nodes table)
 * @returns {Object} - A sanitized Sigma Node object
 */
export function adaptNode(row) {
	if (!row || !row.id) return null;

	// 1. Map Core Visual Properties
	const sigmaNode = {
		// ID is immutable
		id: row.id,

		// LABEL: The critical mapping. DB 'title' -> View 'label'
		// Fallback chain: title -> label (legacy) -> id
		label: row.title && row.title.length > 0 ? row.title : row.label || row.id,

		// TYPE: DB 'type' -> View 'nodeType' (Sigma uses 'type' for rendering program)
		// We store domain type in 'nodeType' to avoid conflict if we use custom renderers.
		nodeType: row.type || "unknown",

		// 2. Visual Calculations (Size, Color)
		// These are defaults; Graph.js might override them based on dynamic state (e.g. coloring mode)
		size: calculateBaseSize(row.type),
		color: calculateBaseColor(row.subGraph || "misc"),

		// 3. Layout Coordinates (Pre-calculated or Hashed)
		// Ideally these come from layout, but we provide stable seeds
		x: stableHash(`${row.id}x`),
		y: stableHash(`${row.id}y`),

		// 4. Safe Metadata (Explicit Allowlist)
		// We do NOT spread (...row) to avoid leaking massive 'content' or 'embedding' vectors
	};

	// Copy allowlisted attributes
	NODE_ATTR_ALLOWLIST.forEach((attr) => {
		if (row[attr] !== undefined) {
			sigmaNode[attr] = row[attr];
		}
	});

	// Special Handling: Definition/Content (Truncate for View)
	// We strictly limit the text sent to the GPU/Renderer context
	const rawContent = row.content || row.definition || "";
	sigmaNode.definition =
		rawContent.length > 500 ? `${rawContent.substring(0, 500)}...` : rawContent;

	// Special Handling: External Refs (Parse JSON)
	if (typeof row.external_refs === "string") {
		try {
			sigmaNode.external_refs = JSON.parse(row.external_refs);
		} catch {
			sigmaNode.external_refs = [];
		}
	}

	return sigmaNode;
}

/**
 * Adapts a raw DB row to a Sigma Graph Edge.
 */
export function adaptEdge(row) {
	if (!row || !row.source || !row.target) return null;

	return {
		source: row.source,
		target: row.target,
		type: "arrow", // Sigma render type
		label: row.type || row.relation || "", // Mapping
		size: 2,
		color: "#cbd5e1", // Default slate-300, overridden by CSS var usually
	};
}

// --- Helpers ---

function calculateBaseSize(type) {
	switch (type) {
		case "term":
		case "Core Concept":
			return 20;
		case "playbook":
			return 12;
		case "protocol":
			return 12;
		case "directive":
			return 10;
		case "debrief":
			return 8;
		case "section":
			return 4;
		default:
			return 6;
	}
}

function calculateBaseColor(subGraph) {
	const colors = {
		persona: "#000000",
		playbooks: "#f97316", // Orange
		debriefs: "#3b82f6", // Blue
		briefs: "#22c55e", // Green
		knowledge: "#ec4899", // Pink
	};
	return colors[subGraph] || "#475569"; // Slate fallback
}

function stableHash(str) {
	let hash = 0;
	for (let i = 0; i < str.length; i++)
		hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
	return (Math.abs(hash) % 1000) / 10;
}
