import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { ResonanceDB } from "@src/resonance/db";
import { getDbPath } from "@src/cli/utils";
import { glob } from "glob";

async function manualSquash() {
    console.log("🛠️  Manually squashing generated sidecars in src/core...");
    
    const dbPath = await getDbPath();
    const db = new ResonanceDB(dbPath);
    const squasher = new SidecarSquasher(db);
    
    const sidecars = await glob("src/core/*.ember.json");
    console.log(`Found ${sidecars.length} sidecars.`);
    
    let nodes = 0;
    let edges = 0;
    
    for (const path of sidecars) {
        console.log(`Squashing ${path}...`);
        const stats = await squasher.squashFile(path);
        if (stats) {
            nodes += stats.nodes;
            edges += stats.edges;
        }
    }
    
    console.log("\n✅ Manual Squash Complete");
    console.log(`  - Nodes Added: ${nodes}`);
    console.log(`  - Edges Added: ${edges}`);
    
    db.close();
}

manualSquash();
