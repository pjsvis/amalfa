
import { join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import { Database } from "bun:sqlite";
import { JsonlUtils } from "../../src/utils/JsonlUtils";


const MANIFEST_FILE = join(process.cwd(), ".amalfa/cache/manifest.jsonl");
const CACHE_DIR = join(process.cwd(), ".amalfa/cache/lang-extract");
const INPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl"); 
const OUTPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon-enriched.jsonl");
const TEMP_DB = join(process.cwd(), ".amalfa/runtime/manifest-lookup.db");

// Cache for Sidecars (LRU-ish or just simple object, assuming 100MB RAM is fine for 500 files)
// If scale increases, this too should be evicted.
const sidecarCache = new Map<string, any>();

async function getSidecar(hash: string) {
    if (sidecarCache.has(hash)) return sidecarCache.get(hash);
    
    const path = join(CACHE_DIR, `${hash}.json`);
    if (await Bun.file(path).exists()) {
        try {
            const data = await Bun.file(path).json();
            // Simple guard: clear cache if too big
            if (sidecarCache.size > 200) sidecarCache.clear();
            sidecarCache.set(hash, data);
            return data;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Find description in sidecar entites
function findDescription(sidecar: any, label: string): string | null {
    if (!sidecar || !sidecar.entities) return null;
    const normalizedLabel = label.toLowerCase();
    for (const ent of sidecar.entities) {
        if (ent.name && ent.name.toLowerCase() === normalizedLabel) {
            return ent.description || null;
        }
    }
    return null;
}

async function enrich() {
    console.log("🌊 Starting Scalable Enrichment...");
    
    // 1. Prepare Ephemeral SQLite Index (Stream-based Ingestion)
    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);
    const db = new Database(TEMP_DB);
    
    // Enable WAL for speed
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");
    
    db.run("CREATE TABLE manifest (path TEXT PRIMARY KEY, hash TEXT)");
    db.run("CREATE INDEX idx_manifest_hash ON manifest(hash)");

    console.log("📜 Indexing Manifest to SQLite...");
    
    const insert = db.prepare("INSERT OR IGNORE INTO manifest (path, hash) VALUES ($path, $hash)");
    const insertTx = db.transaction((chunk: any[]) => {
        for (const entry of chunk) insert.run({ $path: entry.path, $hash: entry.hash });
    });

    let indexed = 0;
    let chunk: any[] = [];
    
    // Stream Manifest -> SQLite
    if (existsSync(MANIFEST_FILE)) {
        await JsonlUtils.process<any>(MANIFEST_FILE, async (entry) => {
            if (entry.path && entry.hash) {
                chunk.push(entry);
                if (chunk.length >= 1000) {
                    insertTx(chunk);
                    indexed += chunk.length;
                    chunk = [];
                }
            }
        });
        if (chunk.length > 0) {
             insertTx(chunk);
             indexed += chunk.length;
        }
    }
    console.log(`✅ Indexed ${indexed} paths.`);
    
    // Prepare Lookups
    const lookupByPath = db.prepare("SELECT hash FROM manifest WHERE path = ?");
    // const lookupByHash = db.prepare("SELECT hash FROM manifest WHERE hash = ?"); // redundant but symmetric

    // 2. Stream & Enrich Nodes
    console.log("✨ Enriching Nodes...");
    await Bun.write(OUTPUT_FILE, "");

    let enrichedCount = 0;
    let totalCount = 0;

    await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
        totalCount++;
        let description = node.summary;

        if (!description && node.meta && node.meta.sources) {
            for (const source of node.meta.sources) {
                // Resolve Source -> Hash using Indexed DB
                let hash = source;
                const match = lookupByPath.get(source) as { hash: string } | undefined;
                if (match) {
                    hash = match.hash;
                }
                
                // Validate Hash
                if (hash.length < 60 && !hash.endsWith(".json")) continue; 

                const sidecar = await getSidecar(hash);
                if (sidecar) {
                    const desc = findDescription(sidecar, node.label);
                    if (desc) {
                        description = desc;
                        break;
                    }
                }
            }
        }

        const enrichedNode = { ...node, summary: description };
        if (description) enrichedCount++;
        await JsonlUtils.appendAsync(OUTPUT_FILE, enrichedNode);
    });

    // Cleanup
    db.close();
    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);

    console.log("✅ Enrichment Complete.");
    console.log(`📚 Total Nodes: ${totalCount}`);
    console.log(`✨ Enriched: ${enrichedCount} (${((enrichedCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

enrich();
