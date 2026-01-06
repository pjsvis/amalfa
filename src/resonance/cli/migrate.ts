import { join } from "node:path";
import settings from "@/polyvis.settings.json";
import { ResonanceDB } from "../db";

// Migration / Seeding Script for Resonance DB
const dbPath = join(process.cwd(), settings.paths.database.resonance);
console.log(`Migrating/Seeding Database: ${dbPath}`);

// 1. Initialize DB (Triggers internal Schema Migrations)
const db = new ResonanceDB(dbPath);

console.log("✅ Schema Initialization Complete (via ResonanceDB).");

// 2. Data Patching (Legacy Support)
// Moving logic that fixes old domain/layer conventions
console.log("Patching Data Defaults...");
try {
	db.getRawDb().exec(
		"UPDATE nodes SET domain = 'persona', layer = 'ontology' WHERE domain IS 'knowledge' AND (id LIKE 'term-%' OR id LIKE 'OH-%' OR id LIKE 'CIP-%' OR id LIKE 'COG-%')",
	);
} catch (_e) {
	console.warn("Patching skipped (Tables might be empty).");
}

// 3. Genesis Node Injection
console.log("Injecting Genesis Node...");
const genesis = {
	id: "000-GENESIS",
	title: "PolyVis Prime",
	type: "root",
	content: "The singular origin point of the PolyVis context.",
	domain: "system",
	layer: "ontology",
	meta: {
		order_index: -1,
	},
};

try {
	// biome-ignore lint/suspicious/noExplicitAny: genesis is a partial node matching the schema
	db.insertNode(genesis as any);
} catch (e: unknown) {
	const err = e as { message: string };
	console.warn("Genesis injection failed:", err.message);
}

// 4. Connect Genesis to Heads
const heads = ["term-001", "CIP-1", "OH-061"];
heads.forEach((head) => {
	db.insertEdge(genesis.id, head, "genesis");
});

console.log("✅ Seeding Complete.");
db.close();
