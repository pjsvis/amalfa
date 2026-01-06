/**
 * Test script for the SetFit classifier via TypeScript-Python bridge.
 *
 * Usage: bun run scripts/test-classifier.ts
 */

import { join } from "node:path";
import { $ } from "bun";

const VENV_PYTHON = join(process.cwd(), "ingest", ".venv", "bin", "python");

interface ClassificationResult {
	text_fragment: string;
	prediction: string;
	confidence: number;
	is_actionable: boolean;
}

async function classifyText(text: string): Promise<ClassificationResult> {
	const script = `
from inference_engine import ConceptClassifier
import json
c = ConceptClassifier()
result = c.analyze("""${text.replace(/"/g, '\\"')}""")
print(json.dumps(result))
`;

	const result = await $`${VENV_PYTHON} -c ${script}`
		.cwd(join(process.cwd(), "ingest"))
		.quiet();

	// Parse the last line (the JSON output)
	const lines = result.stdout.toString().trim().split("\n");
	const jsonLine = lines[lines.length - 1] ?? "{}";
	return JSON.parse(jsonLine);
}

async function runTests() {
	console.log("🧪 Testing SetFit Classifier via TypeScript Bridge\n");

	const testCases = [
		{
			text: "ResonanceDB is a semantic graph database powering Polyvis.",
			expected: "DEF_CANDIDATE",
		},
		{
			text: "The Noosphere is the sphere of human thought and intellectual activity.",
			expected: "DEF_CANDIDATE",
		},
		{
			text: "Always use the FAFCAS protocol for vector storage.",
			expected: "DIR_CANDIDATE",
		},
		{
			text: "Ensure all code compiles without TypeScript errors.",
			expected: "DIR_CANDIDATE",
		},
		{
			text: "Let's switch gears and talk about the frontend.",
			expected: "LOCUS_SHIFT",
		},
		{ text: "Moving on to the database schema now.", expected: "LOCUS_SHIFT" },
		{ text: "That sounds good, proceed.", expected: "NOISE_CHAT" },
		{ text: "Can you check if the server is running?", expected: "NOISE_CHAT" },
	];

	let passed = 0;
	let failed = 0;

	for (const { text, expected } of testCases) {
		try {
			const result = await classifyText(text);
			const status = result.prediction === expected ? "✅" : "❌";

			if (result.prediction === expected) {
				passed++;
			} else {
				failed++;
			}

			console.log(
				`${status} [${result.prediction}] (${(result.confidence * 100).toFixed(1)}%) "${text.slice(0, 50)}..."`,
			);

			if (result.prediction !== expected) {
				console.log(`   Expected: ${expected}`);
			}
		} catch (error) {
			failed++;
			console.log(`❌ Error classifying: "${text.slice(0, 40)}..."`);
			console.error(`   ${error}`);
		}
	}

	console.log(
		`\n📊 Results: ${passed}/${testCases.length} passed (${((passed / testCases.length) * 100).toFixed(0)}%)`,
	);

	if (failed > 0) {
		console.log(`⚠️  ${failed} tests failed`);
	} else {
		console.log("🎉 All tests passed!");
	}
}

runTests();
