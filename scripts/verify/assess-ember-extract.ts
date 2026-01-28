import { EmberExtractTool } from "@src/tools/EmberExtractTool";
import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "@src/cli/utils";
import { join } from "path";

async function run() {
    console.log("🔍 Assessing EmberExtractTool on src/core...");
    
    const result = await EmberExtractTool.handler({ 
        path: "src/core", 
        dry_run: false
    });

    console.log("\n✅ Tool Execution Complete");
    console.log(result.content[0].text);

    console.log("\n📊 Verifying Database Content...");
    
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const raw = db.getRawDb();

    const stats = raw.query<any, any>(`
        SELECT 
            type, 
            COUNT(*) as count 
        FROM nodes 
        WHERE layer = 'symbol' 
          AND meta LIKE '%src/core%'
        GROUP BY type
        ORDER BY count DESC
    `).all();

    console.log("\n📈 Extracted Symbols Distribution:");
    stats.forEach(s => console.log(`  - ${s.type}: ${s.count}`));

    const rels = raw.query<any, any>(`
        SELECT 
            s.title as source, 
            type, 
            t.title as target
        FROM edges 
        JOIN nodes s ON edges.source = s.id
        JOIN nodes t ON edges.target = t.id
        WHERE context_source = 'lang-extract'
          AND s.meta LIKE '%src/core%'
        LIMIT 10
    `).all();

    console.log("\n🔗 Sample Relationships:");
    rels.forEach(r => console.log(`  ${r.source} --[${r.type}]--> ${r.target}`));

    const expected = ["GraphEngine", "VectorEngine", "ResonanceDB"];
    const found = raw.query<any, any>(`
        SELECT title FROM nodes 
        WHERE layer = 'symbol' 
          AND title IN (${expected.map(e => `'${e}'`).join(",")})
    `).all().map(r => r.title);

    console.log("\n🎯 Key Entity Check:");
    expected.forEach(e => {
        const ok = found.includes(e) ? "✅" : "❌";
        console.log(`  ${ok} ${e}`);
    });
}

run();
