import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "@src/cli/utils";

async function verify() {
    console.log("🔍 Verifying 'ember_extract' results in DB...");
    
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const raw = db.getRawDb();

    const stats = raw.query<any, any>(`
        SELECT type, COUNT(*) as count 
        FROM nodes 
        WHERE layer = 'symbol' 
          AND meta LIKE '%src/core%'
        GROUP BY type
        ORDER BY count DESC
    `).all();

    console.log("\n📊 Symbol Distribution (src/core):");
    stats.forEach(s => console.log(`  - ${s.type}: ${s.count}`));

    const geStats = raw.query<any, any>(`
        SELECT COUNT(*) as count 
        FROM edges 
        WHERE source LIKE '%src/core/GraphEngine%'
    `).get();
    
    console.log(`\n🕸️  GraphEngine Outgoing Edges: ${geStats.count}`);

    const relations = raw.query<any, any>(`
        SELECT 
            s.title as source, 
            e.type as relation,
            t.title as target
        FROM edges e
        JOIN nodes s ON e.source = s.id
        JOIN nodes t ON e.target = t.id
        WHERE e.context_source = 'lang-extract'
          AND s.title IN ('EdgeWeaver', 'Fracture Logic: The Cleaver', 'GraphEngine')
        LIMIT 10
    `).all();

    console.log("\n🔗 Verified Relations in DB:");
    relations.forEach(r => console.log(`  ${r.source} --[${r.relation}]--> ${r.target}`));
}

verify();
