
import { join } from "node:path";
import { AMALFA_DIRS } from "../../src/config/defaults";
import { JsonlUtils } from "../../src/utils/JsonlUtils";
import type { Node } from "../../src/resonance/db";

// Metrics
let totalCandidates = 0;
let promotedNodes = 0;

const INPUT_FILE = join(process.cwd(), ".amalfa/lexicon-candidates.jsonl");
const OUTPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl");

// ID Generation (Mirrors ResonanceDB.generateId to avoid DB instantiation)
function generateId(input: string): string {
    const withoutRelativePrefix = input.replace(/^\.*\//, "");
    // Remove extensions if any (though terms usually don't have them)
    const withoutExtension = withoutRelativePrefix.replace(/\.(md|ts|js|json)$/, "");
    const lowercased = withoutExtension.toLowerCase();
    const alphanumericWithSlashes = lowercased.replace(/[^a-z0-9/]/g, "-");
    const slashesToDashes = alphanumericWithSlashes.replace(/\/+/g, "-");
    const collapsedDashes = slashesToDashes.replace(/-+/g, "-");
    const trimmed = collapsedDashes.replace(/^-|-$/g, "");
    return trimmed;
}

// Title Case Helper for Labels
function toTitleCase(str: string): string {
    return str.split(' ')
        .map(w => w && w[0] ? w[0].toUpperCase() + w.substring(1).toLowerCase() : '')
        .join(' ');
}

async function generate() {
    console.log("🌟 Generating Golden Lexicon Nodes...");
    console.log(`📂 Input: ${INPUT_FILE}`);
    console.log(`💾 Output: ${OUTPUT_FILE}`);

    // Clean output
    await Bun.write(OUTPUT_FILE, "");

    const candidates = await JsonlUtils.readAll<any>(INPUT_FILE);
    
    // Sort by frequency DESC
    candidates.sort((a, b) => b.frequency - a.frequency);

    for (const cand of candidates) {
        totalCandidates++;

        // Filter: Frequency Check
        // For now, admit ALL candidates >= 1 to satisfy "review contents"
        if (cand.frequency < 1) continue;

        const id = generateId(cand.term);
        
        // Construct Node
        const node: Node = {
            id: id,
            type: cand.type || "concept",
            label: cand.term, // Keep original casing? cand.term is normalized.
                              // Ideally we'd have access to the original raw term,
                              // but Harvester normalized it. 
                              // We can try Title Case for presentation?
                              // Let's stick to the Term for accuracy.
            domain: "lexicon",
            layer: "concept",
            meta: {
                frequency: cand.frequency,
                sources: cand.sources,
                generated_by: "harvester-v1",
                promoted_at: new Date().toISOString()
            }
            // embedding: null
        };

        await JsonlUtils.appendAsync(OUTPUT_FILE, node);
        promotedNodes++;
    }

    console.log("✅ Generation Complete.");
    console.log(`📊 Candidates: ${totalCandidates}`);
    console.log(`👑 Golden Nodes: ${promotedNodes}`);
}

generate();
