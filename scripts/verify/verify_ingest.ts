import { ResonanceDB } from "@src/resonance/db";

const db = ResonanceDB.init();

const rows = db
	.getRawDb()
	.query("SELECT id, title FROM nodes ORDER BY rowid DESC LIMIT 5")
	.all();
console.log("Recent Nodes:", rows);

const edges = db.getRawDb().query("SELECT * FROM edges").all();
console.log(`Edges Count: ${edges.length}`);

db.close();
