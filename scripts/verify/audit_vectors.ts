import settings from "@/polyvis.settings.json";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance({ readonly: true });

console.log("🔍 Auditing Vector Coverage...");

// 1. Get stats grouped by type/domain
const rows = db
	.query(`
    SELECT 
        type, 
        domain, 
        COUNT(*) as total, 
        SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized 
    FROM nodes 
    GROUP BY type, domain
`)
	.all() as {
	type: string;
	domain: string;
	total: number;
	vectorized: number;
}[];

console.log("\n📊 Coverage Report:");
console.table(
	rows.map((r) => ({
		...r,
		missing: r.total - r.vectorized,
		coverage: `${Math.round((r.vectorized / r.total) * 100)}%`,
	})),
);

// 2. Check strictly against settings sources
const sources = settings.paths.sources.experience;
console.log("\n📂 Checking Settings Sources:");

sources.forEach((src: { path: string; name: string }) => {
	// Map folder name to probable node type or path check
	// Assuming 'type' matches singlet name (Debrief -> debrief) roughly, or checking path in metadata?
	// Let's check generally by type for now.
	console.log(`- Source: ${src.path} (${src.name})`);
});

// Identify unvectorized types
const unvectorized = rows.filter((r) => r.vectorized < r.total);
if (unvectorized.length > 0) {
	console.log("\n⚠️  Found Unvectorized Content:");
	unvectorized.forEach((r) => {
		console.log(
			`   - [${r.domain}/${r.type}]: ${r.total - r.vectorized} missing vectors`,
		);
	});
} else {
	console.log("\n✅ All Content Vectorized!");
}
