import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "@src/cli/utils";

async function verify() {
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const raw = db.getRawDb();

    console.log("🔍 DB Content Verification");
    
    const coreNodes = raw.query<any, any>(`
        SELECT id, type, label 
        FROM nodes 
        WHERE id LIKE 'src/core/%'
    `).all();

    console.log(`\n📂 Nodes in 'src/core': ${coreNodes.length}`);
    coreNodes.slice(0, 5).forEach(n => console.log(`  - [${n.id}] (${n.type})`));

    const target = "src/core/graphengine";
    const ge = raw.query<any, any>(`SELECT * FROM nodes WHERE id = ?`).get(target);
    
    console.log(`\n🎯 Target 'src/core/GraphEngine.ts':`);
    if (ge) {
        console.log("  ✅ Found!");
        console.log(`  - ID: ${ge.id}`);
        console.log(`  - Type: ${ge.type}`);
    } else {
        console.log("  ❌ NOT FOUND");
        const fuzzy = raw.query<any, any>(`SELECT id FROM nodes WHERE id LIKE '%graphengine%'`).all();
        if (fuzzy.length > 0) {
            console.log("  Did you mean:");
            fuzzy.forEach(f => console.log(`    * ${f.id}`));
        }
    }
}

verify();
