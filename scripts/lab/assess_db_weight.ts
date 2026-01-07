import { stat } from "node:fs/promises";
import settings from "@/polyvis.settings.json";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const dbPath = settings.paths.database.resonance;
const db = DatabaseFactory.connectToResonance({ readonly: true });
const stats = await stat(dbPath);

console.log(`\n📊 DB Storage Analysis`);
console.log(`   File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

const nodeCount = (
	db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
).c;
const contentStats = db
	.query(
		"SELECT SUM(length(content)) as total, AVG(length(content)) as avg FROM nodes",
	)
	.get() as { total: number; avg: number };

console.log(`   nodes count: ${nodeCount}`);
console.log(`   Total Content Chars: ${contentStats.total}`);
console.log(`   Avg Content Size: ${Math.round(contentStats.avg)} chars/node`);

// Vectors
const vectorCount = (
	db
		.query("SELECT COUNT(*) as c FROM nodes WHERE embedding IS NOT NULL")
		.get() as { c: number }
).c;
const vectorSizeApprox = vectorCount * 1536 * 4; // 1536 dim * 4 bytes

console.log(`   Vectors Count: ${vectorCount}`);
console.log(
	`   Approx Vector Data: ${(vectorSizeApprox / 1024 / 1024).toFixed(2)} MB`,
);

const textData = contentStats.total || 0;
const textMB = textData / 1024 / 1024;
console.log(`   Approx Text Data: ${textMB.toFixed(2)} MB`);

console.log(`\n🔎 Conclusion:`);
if (textMB > 10) {
	console.log("   Text is becoming heavy.");
} else {
	console.log("   Text is currently lightweight.");
}

db.close();
