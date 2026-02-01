
import { join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import { Database } from "bun:sqlite";
import { JsonlUtils } from "../../src/utils/JsonlUtils";

// Paths
const GOLDEN_FILE = join(process.cwd(), ".amalfa/golden-lexicon-enriched.jsonl");
const MANIFEST_DB = join(process.cwd(), ".amalfa/runtime/manifest-lookup.db"); // Reuse the index if possible? Or rebuild.
const CACHE_DIR = join(process.cwd(), ".amalfa/cache/lang-extract");
const OUTPUT_FILE = join(process.cwd(), ".amalfa/proposed-edges.jsonl");

// Valid Nodes Set
const validNodeIds = new Set<string>();
const labelToId = new Map<string, string>(); // Optional reverse lookup if IDs diverge

// ID Generator (Must match ResonanceDB logic)
function generateId(input: string): string {
    const withoutRelativePrefix = input.replace(/^.*\/|\\/, ""); // Simplified path handling
    const lowercased = input.toLowerCase();
    // Use the logic from generate-golden-nodes.ts
    const alphanumericWithSlashes = lowercased.replace(/[^a-z0-9/]/g, "-");
    const collapsed = alphanumericWithSlashes.replace(/-+/g, "-").replace(/^-|-$/g, "");
    return collapsed;
}

// Sidecar Loader
const sidecarCache = new Map<string, any>();
async function getSidecar(hash: string) {
     if (sidecarCache.has(hash)) return sidecarCache.get(hash);
     const path = join(CACHE_DIR, `${hash}.json`);
     if (await Bun.file(path).exists()) {
        try {
            const data = await Bun.file(path).json();
            if (sidecarCache.size > 200) sidecarCache.clear();
            sidecarCache.set(hash, data);
            return data;
        } catch { return null; }
     }
     return null;
}


const MANIFEST_FILE = join(process.cwd(), ".amalfa/cache/manifest.jsonl");

async function survey() {
    console.log("📐 Surveying Edges (Phase 2)...");
    
    // 1. Load Golden Lexicon
    console.log("Loading Nodes...");
    await JsonlUtils.process<any>(GOLDEN_FILE, async (node) => {
        if (node.id) validNodeIds.add(node.id);
    });
    console.log(`✅ Loaded ${validNodeIds.size} Unique Golden IDs.`);

    // 2. Stream Manifest Directly (O(1) Memory)
    if (!existsSync(MANIFEST_FILE)) {
        console.error("❌ Manifest not found.");
        return;
    }
    
    await Bun.write(OUTPUT_FILE, "");
    
    let edgeCount = 0;
    let acceptedEdges = 0;
    let processedSidecars = 0;

    console.log("🔍 Streaming Manifest & Harvesting Sidecars...");
    
    await JsonlUtils.process<any>(MANIFEST_FILE, async (entry) => {
        if (!entry.hash) return;
        
        const sidecar = await getSidecar(entry.hash);
        processedSidecars++;
        
        if (!sidecar || !sidecar.relationships) return;
        
        for (const rel of sidecar.relationships) {
            edgeCount++;
            
            // Normalize Source/Target to IDs
            const srcId = generateId(rel.source);
            const tgtId = generateId(rel.target);
            
            // Validate against Golden Set
            if (validNodeIds.has(srcId) && validNodeIds.has(tgtId)) {
                if (srcId === tgtId) continue;
                
                const edge = {
                    source: srcId,
                    target: tgtId,
                    type: rel.type || "RELATED",
                    weight: 1.0, 
                    meta: {
                        origin: entry.hash,
                        desc: rel.description
                    }
                };
                
                await JsonlUtils.appendAsync(OUTPUT_FILE, edge);
                acceptedEdges++;
            }
        }
        
        if (processedSidecars % 100 === 0) process.stdout.write(".");
    });
    
    console.log("\n✅ Edge Survey Complete.");
    console.log(`📂 Processed Sidecars: ${processedSidecars}`);
    console.log(`🔗 Total Candidates: ${edgeCount}`);
    console.log(`💎 Accepted Edges: ${acceptedEdges} (connecting Golden Nodes)`);
    console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

survey();
