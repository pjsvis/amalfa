import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log(`🧹 Cleaning Legacy Domains...`);

const db = DatabaseFactory.connectToResonance();

try {
	const result = db.run("DELETE FROM nodes WHERE domain = 'knowledge'");
	console.log(`Deleted ${result.changes} nodes from domain 'knowledge'.`);

	const _result2 = db.run(
		"DELETE FROM edges WHERE source IN (SELECT id FROM nodes WHERE domain = 'knowledge')",
	);
	console.log(`Deleted orphan edges.`);
} catch (e) {
	console.error("Error cleaning database:", e);
} finally {
	db.close();
}
