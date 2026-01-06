import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ResonanceDB } from "@src/resonance/db";

interface Twin {
	sourceId: string;
	targetId: string;
	source: string;
	target: string;
	sim: number;
}

async function main() {
	console.log("🩹  Graph Healer: Initializing...");

	// 1. Find Latest Report
	const reportDir = join(process.cwd(), "reports");
	const files = readdirSync(reportDir)
		.filter((f) => f.startsWith("hybrid_audit_"))
		.sort()
		.reverse();

	if (files.length === 0) {
		console.error("❌ No audit reports found.");
		process.exit(1);
	}

	if (!files[0]) {
		console.error("❌ No report file found.");
		process.exit(1);
	}
	const latestReport = join(reportDir, files[0]);
	console.log(`📄 Loading Report: ${files[0]}`);

	const report = JSON.parse(readFileSync(latestReport, "utf-8"));
	const twins = report.wormholes.filter((w: Twin) => w.sim > 0.98); // High Confidence Only

	if (twins.length === 0) {
		console.log("✅ No twins found to link.");
		process.exit(0);
	}

	console.log(`🔗 Linking ${twins.length} Twins (Sim > 0.98)...`);

	// 2. Connect to DB
	const db = ResonanceDB.init();

	// 3. Insert SAME_AS Edges
	db.getRawDb().transaction(() => {
		for (const twin of twins) {
			// Check if they are self-loops (just in case)
			if (twin.sourceId === twin.targetId) continue;

			console.log(`   + Linking: ${twin.source} <==> ${twin.target}`);

			// Bidirectional Link
			db.insertEdge(twin.sourceId, twin.targetId, "SAME_AS");
			db.insertEdge(twin.targetId, twin.sourceId, "SAME_AS");
		}
	})();

	console.log(`✅ Successfully created ${twins.length * 2} edges.`);
	db.close();
}

main();
