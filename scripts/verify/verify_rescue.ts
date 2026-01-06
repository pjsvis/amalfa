import { SemanticWeaver } from "@src/core/SemanticWeaver";
import { ResonanceDB } from "@src/resonance/db";

const db = ResonanceDB.init();

console.log("🔍 Verifying Semantic Rescue...");

// 1. Snapshot Edge Count (RELATED_TO)
// Access underlying bun:sqlite instance (hack for verify script)
const initial = db
	.getRawDb()
	.query("SELECT COUNT(*) as c FROM edges WHERE type = 'RELATED_TO'")
	.get() as { c: number };
console.log(`initial RELATED_TO count: ${initial.c}`);

// 2. Run Weaver
SemanticWeaver.weave(db);

// 3. Check Diff
const final = db
	.getRawDb()
	.query("SELECT COUNT(*) as c FROM edges WHERE type = 'RELATED_TO'")
	.get() as { c: number };
const delta = final.c - initial.c;

console.log(`✅ Verification: Created ${delta} new 'RELATED_TO' edges.`);
