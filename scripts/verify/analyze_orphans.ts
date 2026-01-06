import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance({ readonly: true });
console.log("🔍 Analyzing Graph Orphans...");

// 1. Identify Orphans (Nodes with 0 edges)
// A node is an orphan if its ID appears in neither 'source' nor 'target' columns of 'edges'.
const sql = `
    SELECT n.id, n.type, n.title
    FROM nodes n
    LEFT JOIN edges e1 ON n.id = e1.source
    LEFT JOIN edges e2 ON n.id = e2.target
    WHERE e1.source IS NULL AND e2.target IS NULL
      AND n.type != 'root' -- Exclude root
      AND n.type != 'domain' -- Exclude domain markers
`;

const orphans = db.query(sql).all() as {
	id: string;
	type: string;
	title: string; // Title might be null, but let's assume string for now or string | null if strict
}[];

console.log(`\nFound ${orphans.length} Orphans.`);

// 2. Group by Type
const stats: Record<string, number> = {};
const samples: Record<string, string[]> = {};

orphans.forEach((node) => {
	stats[node.type] = (stats[node.type] || 0) + 1;
	const list = samples[node.type] || [];
	if (list.length < 3) list.push(node.title || node.id);
	samples[node.type] = list;
});

// 3. Report
console.log("\nOrphans by Type:");
console.table(
	Object.entries(stats)
		.sort((a, b) => b[1] - a[1])
		.map(([type, count]) => ({
			Type: type,
			Count: count,
			"Sample Nodes": (samples[type] || []).join(", "),
		})),
);

// 4. Calculate Percentage (Context)
const totalNodes = (
	db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
).c;
const orphanRate = ((orphans.length / totalNodes) * 100).toFixed(1);
console.log(`\nOrphan Rate: ${orphanRate}% of ${totalNodes} total nodes.`);
