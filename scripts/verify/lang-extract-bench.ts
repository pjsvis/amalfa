import { LangExtractClient } from "@src/services/LangExtractClient";
import { join } from "path";

async function run() {
    console.log("🚀 Testing LangExtract Client...");
    const client = new LangExtractClient();
    
    const available = await client.isAvailable();
    console.log(`Available: ${available}`);
    if (!available) {
        console.error("❌ Sidecar environment not ready. Check 'uv' and 'src/sidecars/lang-extract'");
        return;
    }

    console.log("\n🧪 Testing TypeScript Extraction...");
    const tsCode = `
    export class GraphEngine {
        constructor(private db: Database) {}
        
        public addNode(id: string, data: any) {
            this.db.insert(id, data);
        }
    }
    `;
    const startTs = Date.now();
    const tsResult = await client.extract(tsCode);
    const timeTs = Date.now() - startTs;
    
    if (tsResult) {
        console.log(`✅ TS Extracted in ${timeTs}ms:`);
        console.log(JSON.stringify(tsResult, null, 2));
    } else {
        console.log("❌ TS Extraction Failed");
    }

    console.log("\n🧪 Testing Markdown Extraction...");
    const mdText = `
    # Architecture
    The system uses a **Vector Database** for semantic search and a **Graph Database** for structural relationships.
    The **Ingestion Pipeline** connects these two components.
    `;
    const startMd = Date.now();
    const mdResult = await client.extract(mdText);
    const timeMd = Date.now() - startMd;

    if (mdResult) {
        console.log(`✅ MD Extracted in ${timeMd}ms:`);
        console.log(JSON.stringify(mdResult, null, 2));
    } else {
        console.log("❌ MD Extraction Failed");
    }

    await client.close();
}

run();
