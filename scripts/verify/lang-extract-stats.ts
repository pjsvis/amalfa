import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "@src/cli/utils";
import { join } from "path";

async function run() {
    const dbPath = await getDbPath();
    console.log(`📂 Database: ${dbPath}`);
    
    const db = new ResonanceDB(dbPath);
    const raw = db.getRawDb();

    console.log("\n📊 LangExtract Statistics\n" + "=".repeat(30));

    const symbolCount = raw.query<any, any>(`
        SELECT COUNT(*) as count FROM nodes 
        WHERE layer = 'symbol'
    `).get();
    
    console.log(`Total Extracted Symbols: ${symbolCount.count}`);

    if (symbolCount.count === 0) {
        console.log("⚠️  No symbols found. Have you run 'amalfa squash'?");
        return;
    }

    const byType = raw.query<any, any>(`
        SELECT type, COUNT(*) as count 
        FROM nodes 
        WHERE layer = 'symbol' 
        GROUP BY type
        ORDER BY count DESC
    `).all();

    console.log("\n🔹 Symbols by Type:");
    byType.forEach(row => {
        console.log(`  - ${row.type.padEnd(15)}: ${row.count}`);
    });

    const definitions = raw.query<any, any>(`
        SELECT COUNT(*) as count, AVG(LENGTH(summary)) as avg_len
        FROM nodes 
        WHERE layer = 'symbol' AND summary IS NOT NULL
    `).get();

    console.log("\n🔹 Definitions:");
    console.log(`  - Symbols with Definitions: ${definitions.count}`);
    console.log(`  - Avg Definition Length:    ${Math.round(definitions.avg_len)} chars`);

    const samples = raw.query<any, any>(`
        SELECT title, type, summary 
        FROM nodes 
        WHERE layer = 'symbol' AND summary IS NOT NULL
        ORDER BY RANDOM() 
        LIMIT 3
    `).all();

    console.log("\n  📝 Random Samples:");
    samples.forEach(s => {
        console.log(`    * [${s.type}] ${s.title}: "${s.summary.slice(0, 60)}..."`);
    });

    const edgeCount = raw.query<any, any>(`
        SELECT COUNT(*) as count FROM edges 
        WHERE context_source = 'lang-extract'
    `).get();

    console.log(`\n🔹 Relationships (Edges): ${edgeCount.count}`);

    const edgeTypes = raw.query<any, any>(`
        SELECT type, COUNT(*) as count 
        FROM edges 
        WHERE context_source = 'lang-extract'
        GROUP BY type
        ORDER BY count DESC
    `).all();

    edgeTypes.forEach(row => {
        console.log(`  - ${row.type.padEnd(15)}: ${row.count}`);
    });

    const sourceFiles = raw.query<any, any>(`
        SELECT COUNT(DISTINCT source) as count
        FROM edges
        WHERE context_source = 'lang-extract' AND type = 'DEFINES'
    `).get();
    
    console.log(`\n🔹 Source Files Covered: ${sourceFiles.count}`);
}

run();
