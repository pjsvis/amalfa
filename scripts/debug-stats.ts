import { Database } from "bun:sqlite";
import { getDbPath } from "../src/cli/utils";

async function main() {
    const dbPath = await getDbPath();
    console.log(`Database: ${dbPath}\n`);
    const db = new Database(dbPath, { readonly: true });

    console.log("--- Nodes by Type ---");
    const types = db.query("SELECT type, COUNT(*) as count FROM nodes GROUP BY type").all();
    console.table(types);

    console.log("\n--- Nodes by Layer ---");
    const layers = db.query("SELECT layer, COUNT(*) as count FROM nodes GROUP BY layer").all();
    console.table(layers);

    db.close();
}

main();
