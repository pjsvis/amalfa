import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance({ readonly: true });
console.log("🔍 Inspecting Missing Attributes...");

const missing = db
	.query(
		"SELECT id, type, title, domain FROM nodes WHERE type = 'document' AND embedding IS NULL",
	)
	.all() as { id: string; type: string; title: string; domain: string }[];

if (missing.length > 0) {
	console.log("⚠️  Nodes without Embeddings:");
	console.table(missing);
} else {
	console.log("✅ No missing embeddings for 'document' type.");
}
