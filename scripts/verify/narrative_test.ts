import { join } from "node:path";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("📜 Starting Narrative Reconstruction (The Turing Test)...");

const db = DatabaseFactory.connectToResonance({ readonly: true });

// 1. Fetch Debriefs and Edges
const nodes = db.query("SELECT * FROM nodes WHERE type = 'debrief'").all() as {
	id: string;
	label: string;
	title: string;
	content: string;
	meta: string;
}[];
const edges = db
	.query("SELECT source, target FROM edges WHERE type = 'SUCCEEDS'")
	.all() as { source: string; target: string }[];

const nodeMap = new Map<
	string,
	{ id: string; label: string; title: string; content: string; meta: string }
>(nodes.map((n) => [n.id, n]));
const nextMap = new Map<string, string>();
const prevMap = new Map<string, string>();

edges.forEach((e) => {
	nextMap.set(e.source, e.target);
	prevMap.set(e.target, e.source);
});

// 2. Find Genesis (Start of the Thread)
const genesisNodes = nodes.filter(
	(n) => !prevMap.has(n.id) && nextMap.has(n.id),
);

if (genesisNodes.length === 0) {
	if (nodes.length > 0 && edges.length === 0) {
		console.error(
			"❌ Failed: Debriefs exist but no SUCCEEDS edges found. Timeline Weaver failed?",
		);
	} else {
		console.error(
			"❌ Failed: No clear Genesis node found (Cycle or Fragments detected).",
		);
	}
	process.exit(1);
}

if (genesisNodes.length > 1) {
	console.warn(
		`⚠️  Warning: Multiple Genesis nodes found (${genesisNodes.length}). The narrative is forked.`,
	);
}

const genesis = genesisNodes[0];
if (!genesis) throw new Error("Genesis node undefined despite length check");
console.log(`✅ Genesis Found: ${genesis.id} (${genesis.label})`);

// 3. Traverse the Thread
let currentId = genesis.id;
const timeline: {
	id: string;
	label: string;
	title: string;
	content: string;
	meta: string;
}[] = [];

while (currentId) {
	const node = nodeMap.get(currentId);
	if (node) {
		timeline.push(node);
		currentId = nextMap.get(currentId) || "";
	} else {
		break;
	}
}

console.log(`✅ Reconstructed ${timeline.length} steps in the timeline.`);

// 4. Synthesize Story
let markdown = `# Project History: The Evolution of Thought\n\n`;
markdown += `*Reconstructed from the Knowledge Graph's "Red Thread" on ${new Date().toISOString().split("T")[0]}*\n\n`;
markdown += `> **The Turing Test**: This document was generated automatically by traversing the \`SUCCEEDS\` edges of the graph. If it reads like a coherent history, the graph successfully "understands" the project timeline.\n\n`;
markdown += `## The Timeline\n\n`;

timeline.forEach((node, index) => {
	const meta = JSON.parse(node.meta || "{}");
	const date = meta.created
		? new Date(meta.created).toISOString().split("T")[0]
		: "Unknown Date";

	const label = node.label || node.title || node.id;
	markdown += `### ${index + 1}. ${label.replace("Debrief: ", "")} (${date})\n`;

	// Extract a brief summary from content (first meaningful paragraph)
	const content = node.content || "";
	const summary =
		content
			.split("\n")
			.find((line: string) => line.length > 50 && !line.startsWith("#")) ||
		"No summary available.";

	markdown += `${summary.trim()}\n\n`;

	// Add context from connected Playbooks (Mock query for now, or real if we want to get fancy)
	// We could simple link the node ID
	markdown += `*Scanned Node: [${node.id}](file://${meta.source || ""})*\n\n`;
});

// 5. Output
const outputPath = join(process.cwd(), "PROJECT_HISTORY.md");
await Bun.write(outputPath, markdown);

console.log(`✅ Narrative Written to: ${outputPath}`);
console.log("Health Check: The story has been told.");
