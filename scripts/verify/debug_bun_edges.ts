import { DatabaseFactory } from "@src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance();
const query = db.query(
	"SELECT * FROM edges WHERE source = 'bun-playbook' OR target = 'bun-playbook'",
);
const edges = query.all();
console.log(JSON.stringify(edges, null, 2));
db.close();
