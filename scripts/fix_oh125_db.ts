import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance();

// 1. Check current state
const query = db.query("SELECT id, content FROM nodes WHERE id = $id");
const before = query.get({ $id: "OH-125" }) as { id: string; content: string };
console.log("Before:", before);

// 2. Fix it manually using the known good content
const goodContent =
	"To prevent cognitive collapse ('recursive-bullshit'), an agent must operate in a a single, clearly defined cognitive mode at any given time. It is forbidden from mixing 'fast' execution with 'slow' refinement.";

db.run("UPDATE nodes SET content = ? WHERE id = ?", [goodContent, "OH-125"]);

// 3. Verify
const after = query.get({ $id: "OH-125" }) as { id: string; content: string };
console.log("After:", after);

if (after.content === goodContent) {
	console.log("SUCCESS: Fixed OH-125 in DB.");
} else {
	console.error("FAILURE: Could not fix OH-125.");
	process.exit(1);
}
