import { TokenizerService } from "@src/resonance/services/tokenizer";

// Mock Lexicon
const lexicon = [
	{
		id: "OH-058",
		title: "Dual-Phase Mentation Protocol",
		type: "operational-heuristic",
		category: "Operational Heuristic",
	},
	{ id: "term-001", title: "Mentation", category: "Core Concept" },
];
console.log("🧪 EXPERIMENT: Tokenizer Logic Verification");
console.log("-------------------------------------------");
// 1. Initialize & Load
const tokenizer = TokenizerService.getInstance();
console.log("Step 1: Loading Lexicon...");
tokenizer.loadLexicon(lexicon);
// 2. Test Text
const text = "We should apply OH-058 to improve our Mentation process.";
console.log(`\nStep 2: Processing Text: "${text}"`);
// 3. Extract
const tokens = tokenizer.extract(text);
console.log("\nStep 3: Extraction Result:");
console.log(JSON.stringify(tokens, null, 2));
// DEBUG: Internal Compromise Inspection
const nlp = require("compromise");
const doc = nlp(text);
console.log("\n[DEBUG] Term Analysis:");
doc.json()[0].terms.forEach((t: { text: string; tags: string[] }) => {
	console.log(` - Text: "${t.text}" | Tags: [${t.tags.join(", ")}]`);
});
// 4. Verify
const hasProtocol = tokens.protocols?.includes("OH-058");
const hasConcept = tokens.concepts?.includes("Mentation");
console.log("\nStep 4: Verification:");
console.log(`- Detected OH-058? ${hasProtocol ? "✅ YES" : "❌ NO"}`);
console.log(`- Detected Mentation? ${hasConcept ? "✅ YES" : "❌ NO"}`);
if (hasProtocol) {
	console.log("\n🎉 SUCCESS: The Tokenizer Logic is sound.");
} else {
	console.log("\n🔥 FAILURE: The Tokenizer Logic is broken.");
	// Try to debug why
	// Maybe case sensitivity?
	// Maybe compromise needs specific tagging?
}
