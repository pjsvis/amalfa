
import { join } from "node:path";
import { JsonlUtils } from "../../src/utils/JsonlUtils";

const INPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl");
const OUTPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon-refined.jsonl");
const REJECTED_FILE = join(process.cwd(), ".amalfa/lexicon-rejected.jsonl");

// Rules Configuration
const MIN_FREQUENCY = 2;
const MIN_LENGTH = 3;
const STOP_WORDS = new Set([
     "the", "and", "but", "or", "for", "nor", "this", "that", "these", "those",
    "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did",
    "from", "to", "in", "out", "on", "off", "over", "under", "with", "without",
    "can", "could", "will", "would", "shall", "should", "may", "might", "must",
    "true", "false", "null", "undefined", "void", "any", "return", "function", "class", "const", "let", "var",
    "http", "https"
]);

async function refine() {
    console.log("🧹 Purging Weak Nodes...");
    console.log(`📉 Rules: Freq >= ${MIN_FREQUENCY}, Len >= ${MIN_LENGTH}`);

    // Clean outputs
    await Bun.write(OUTPUT_FILE, "");
    await Bun.write(REJECTED_FILE, "");

    let kept = 0;
    let rejected = 0;

    await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
        const term = node.label.toLowerCase();
        const freq = node.meta.frequency;
        
        let rejectReason = "";

        // 1. Frequency Check
        if (freq < MIN_FREQUENCY) {
            rejectReason = "Low Frequency";
        }
        // 2. Length Check
        else if (term.length < MIN_LENGTH) {
            rejectReason = "Too Short";
        }
        // 3. Stop Word Check
        else if (STOP_WORDS.has(term)) {
            rejectReason = "Stop Word";
        }
        // 4. Numeric/Symbol Check
        else if (/^[\d\W]+$/.test(term)) {
             rejectReason = "Pure Noise";
        }
        // 5. Hash Check
        else if (term.match(/^[0-9a-f]{10,}$/)) {
            rejectReason = "Hash/ID";
        }

        if (rejectReason) {
            rejected++;
            // Write to rejected log with reason
            await JsonlUtils.appendAsync(REJECTED_FILE, { ...node, rejection: rejectReason });
        } else {
            kept++;
            await JsonlUtils.appendAsync(OUTPUT_FILE, node);
        }
    });

    console.log("✅ Refinement Complete.");
    console.log(`💎 Kept: ${kept}`);
    console.log(`🗑️  Rejected: ${rejected}`);
    console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

refine();
