import type { Database } from "bun:sqlite";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const dbPath = process.argv[2];
let db: Database;

if (dbPath) {
	console.log(`Checking DB at: ${dbPath}`);
	db = DatabaseFactory.connect(dbPath, { readonly: true });
} else {
	console.log("Checking Main Resonance DB...");
	db = DatabaseFactory.connectToResonance(undefined, { readonly: true });
}

const nodeCount = db.query("SELECT count(*) as count FROM nodes").get() as {
	count: number;
};
const edgeCount = db.query("SELECT count(*) as count FROM edges").get() as {
	count: number;
};

console.log(`Nodes: ${nodeCount.count}`);
console.log(`Edges: ${edgeCount.count}`);

// Specific Check for Experience Domain items?
// Assuming 'Experience' maps to specific node types or paths?
// Let's list some node types
const types = db
	.query("SELECT type, count(*) as count FROM nodes GROUP BY type")
	.all();
console.log("Node Types:", types);

db.close();
