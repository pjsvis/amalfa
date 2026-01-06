import { VectorEngine } from "@/src/core/VectorEngine";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";
import { ResonanceDB } from "@/src/resonance/db";

// Helper for memory logging
function getMemory() {
	const mem = process.memoryUsage();
	return {
		rss: Math.round(mem.rss / 1024 / 1024),
		heap: Math.round(mem.heapUsed / 1024 / 1024),
		external: Math.round(mem.external / 1024 / 1024),
	};
}

const baseline = getMemory();
console.log("📊 Memory Profiling Started");
console.log(`Initial State: RSS=${baseline.rss}MB, Heap=${baseline.heap}MB`);

// 1. Load Database Data (Raw Objects)
console.log("\n--- Step 1: Loading Data from DB ---");
const db = DatabaseFactory.connectToResonance({ readonly: true });
const nodes = db.query("SELECT * FROM nodes").all() as unknown[];
const edges = db.query("SELECT * FROM edges").all() as unknown[];
const s1 = getMemory();
console.log(`Loaded ${nodes.length} nodes, ${edges.length} edges.`);
console.log(
	`Delta: +${s1.rss - baseline.rss}MB RSS, +${s1.heap - baseline.heap}MB Heap`,
);

// 2. Hydrate Graphology (RAM Graph)
console.log("\n--- Step 2: Hydrating Graphology ---");
const s2 = s1;
// ⚠️ Manual Profile Only
/*
const graph = new Graph();
nodes.forEach(n => graph.addNode(n.id, { ...n }));
edges.forEach(e => {
    try {
        graph.addEdge(e.source, e.target, { type: e.type });
    } catch (err) {
        // Ignore duplicate edges
    }
});
s2 = getMemory();
console.log(`Graphology Graph Size: ${graph.order} nodes, ${graph.size} edges.`);
console.log(`Delta (cumulative): +${s2.rss - baseline.rss}MB RSS, +${s2.heap - baseline.heap}MB Heap`);
console.log(`Step Cost: ~${s2.heap - s1.heap}MB Heap`);
*/
console.log(
	"SKIPPED. To profile: `bun add graphology` and uncomment code in scripts/profile_memory.ts",
);

// 3. Initialize Vector Engine (WASM / Model Load)
console.log("\n--- Step 3: VectorEngine Initialization (Deep Load) ---");
const rdb = ResonanceDB.init();
const ve = new VectorEngine(rdb.getRawDb());
// Force model load by running a dummy search
const t3_start = performance.now();
await ve.search("warmup", 1);
const t3_end = performance.now();
const s3 = getMemory();
console.log(`Model Loaded & Warmed Up.`);
console.log(`⏱️ Model Load Time: ${(t3_end - t3_start).toFixed(2)}ms`);
console.log(
	`Delta (cumulative): +${s3.rss - baseline.rss}MB RSS, +${s3.heap - baseline.heap}MB Heap`,
);
console.log(
	`Step Cost: ~${s3.rss - s2.rss}MB RSS (Likely WASM/Model overhead)`,
);

// 4. Perform Vector Search (Hot Path)
console.log("\n--- Step 4: Vector Search Execution (Average of 10 runs) ---");
// Force some activity
const t4_start = performance.now();
for (let i = 0; i < 10; i++) {
	await ve.search("test query", 5);
}
const t4_end = performance.now();
const avg = (t4_end - t4_start) / 10;
const s4 = getMemory();
console.log(`Search performed 10 times.`);
console.log(`⏱️ Avg Search Latency: ${avg.toFixed(2)}ms`);
console.log(`Final State: RSS=${s4.rss}MB, Heap=${s4.heap}MB`);
console.log(`Total Growth: +${s4.rss - baseline.rss}MB RSS`);

// summary
console.table({
	Baseline: baseline,
	"After DB Load": s1,
	"After Graph": s2,
	"After Model": s3,
	"After Search": s4,
});
