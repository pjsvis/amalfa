
import { join } from "node:path";
import { JsonlUtils } from "../../src/utils/JsonlUtils";

const INPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl");
const OUTPUT_STOP_LIST = join(process.cwd(), ".amalfa/stop-list-candidates.jsonl");

// Heuristics
const STOP_WORDS = new Set([
    "the", "and", "but", "or", "for", "nor", "this", "that", "these", "those",
    "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did",
    "from", "to", "in", "out", "on", "off", "over", "under", "with", "without",
    "can", "could", "will", "would", "shall", "should", "may", "might", "must",
    "true", "false", "null", "undefined", "void", "any", "return", "function", "class", "const", "let", "var"
]);

type Classification = "obvious" | "questionable" | "stop-list" | "low-frequency";

async function classify() {
    console.log("Sortin' the catch... 🐟");

    const counts: Record<Classification, number> = {
        "obvious": 0,
        "questionable": 0,
        "stop-list": 0,
        "low-frequency": 0
    };

    const typeCounts: Record<string, number> = {};
    const candidatesForStopList: string[] = [];

    await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
        const term = node.label.toLowerCase();
        const freq = node.meta.frequency;
        const type = node.type;

        // Type Stats
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        let classification: Classification = "questionable";

        // Stop List Logic
        if (
            term.length < 3 || 
            /^\d+$/.test(term) || // Pure numbers
            STOP_WORDS.has(term) ||
            term.includes("http") || // links
            term.match(/^[0-9a-f]{10,}$/) // hashes
        ) {
            classification = "stop-list";
            candidatesForStopList.push(term);
        }
        else if (freq === 1) {
            classification = "low-frequency"; // separate bucket for singletons
        }
        else if (freq >= 5) {
            classification = "obvious";
        }
        
        counts[classification]++;
    });

    console.log("\n📊 Classification Results:");
    console.table(counts);

    console.log("\n🏷️  By Type:");
    console.table(typeCounts);

    console.log("\n🛑 Stop List Candidates Generated:", candidatesForStopList.length);
    
    // Save stop list candidates
    // We'll just write them as a simple text list or JSONL? User asked for Stop List.
    // Usually stop list is JSON array.
    await Bun.write(OUTPUT_STOP_LIST, candidatesForStopList.map(t => JSON.stringify({term: t})).join("\n"));
    console.log(`💾 Saved to ${OUTPUT_STOP_LIST}`);
}

classify();
