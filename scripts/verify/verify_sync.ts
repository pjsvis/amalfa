import { ResonanceDB } from "@src/resonance/db";

const db = ResonanceDB.init();
console.log("🔍 Verifying Ingestion...");

// 1. Check GENESIS
const genesis = db
	.getRawDb()
	.query("SELECT * FROM nodes WHERE id = '000-GENESIS'")
	.get();
console.log("   GENESIS:", genesis ? "✅ Found" : "❌ Missing");

// 2. Check EXPERIENCE
const experience = db
	.getRawDb()
	.query("SELECT * FROM nodes WHERE id = 'EXPERIENCE'")
	.get();
console.log("   EXPERIENCE:", experience ? "✅ Found" : "❌ Missing");

// 3. Check Edge
const edge = db
	.getRawDb()
	.query(
		"SELECT * FROM edges WHERE source = '000-GENESIS' AND target = 'EXPERIENCE'",
	)
	.get();
console.log("   GENESIS->EXPERIENCE:", edge ? "✅ Found" : "❌ Missing");

// 4. Check Content Nodes
const nodes = db
	.getRawDb()
	.query(
		"SELECT id, type, title FROM nodes WHERE type IN ('debrief', 'playbook')",
	)
	.all() as { id: string; type: string; title: string }[];
console.log(`   Content Nodes Found: ${nodes.length}`);
nodes.forEach((n) => {
	console.log(`      - [${n.type}] ${n.title} (${n.id})`);
});

// 5. Check Content Edges
const contentEdges = db
	.getRawDb()
	.query("SELECT * FROM edges WHERE source = 'EXPERIENCE'")
	.all() as { source: string; target: string; type: string }[];
console.log(`   Content Edges Found: ${contentEdges.length}`);
contentEdges.forEach((e) => {
	console.log(`      - -> ${e.target} (${e.type})`);
});

db.close();
