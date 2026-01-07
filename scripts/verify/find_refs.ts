import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance(undefined, { readonly: true });
const query = db.prepare("SELECT id, label, definition FROM nodes");
const nodes = query.all() as {
	id: string;
	label: string;
	definition: string;
}[];

const pattern = /\b([A-Z]{2,}-\d+|term-\d+)\b/g;

console.log("Nodes with potential internal references:");
nodes.forEach((node) => {
	if (!node.definition) return;
	const matches = node.definition.match(pattern);
	if (matches) {
		// Filter out self-references
		const refs = matches.filter((m) => m !== node.id);
		if (refs.length > 0) {
			console.log(`- [${node.id}] ${node.label}`);
			console.log(`  Definition: "${node.definition}"`);
			console.log(`  Refs: ${refs.join(", ")}`);
			console.log("");
		}
	}
});

db.close();
