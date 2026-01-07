import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance(undefined, { readonly: true });
const query = db.query("SELECT id, content FROM nodes WHERE id = $id");
const result = query.get({ $id: "OH-125" }) as {
	id: string;
	content: string;
} | null;

if (result) {
	console.log(`ID: ${result.id}`);
	console.log(`Content: ${result.content}`);
	if (result.content.includes("[object Object]")) {
		console.error("FAIL: Content still contains [object Object]");
		process.exit(1);
	} else {
		console.log("PASS: Content is clean.");
	}
} else {
	console.error("Node OH-125 not found.");
}
