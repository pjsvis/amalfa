import { join } from "node:path";
import { JsonlUtils } from "../../utils/JsonlUtils";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("refine");

// Config
const INPUT_FILE = join(process.cwd(), ".amalfa/lexicon-candidates.jsonl"); // Input from 01
const OUTPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl"); // Output of 02
const REJECTED_FILE = join(process.cwd(), ".amalfa/lexicon-rejected.jsonl");

const MIN_FREQUENCY = 2;
const MIN_LENGTH = 3;
const STOP_WORDS = new Set([
	"the",
	"and",
	"but",
	"or",
	"for",
	"nor",
	"this",
	"that",
	"these",
	"those",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"have",
	"has",
	"had",
	"do",
	"does",
	"did",
	"from",
	"to",
	"in",
	"out",
	"on",
	"off",
	"over",
	"under",
	"with",
	"without",
	"can",
	"could",
	"will",
	"would",
	"shall",
	"should",
	"may",
	"might",
	"must",
	"true",
	"false",
	"null",
	"undefined",
	"void",
	"any",
	"return",
	"function",
	"class",
	"const",
	"let",
	"var",
	"http",
	"https",
]);

/* ID Generation Logic (Reused) */
function generateId(input: string): string {
	const withoutRelativePrefix = input.replace(/^\.*\//, "");
	const withoutExtension = withoutRelativePrefix.replace(
		/\.(md|ts|js|json)$/,
		"",
	);
	const lowercased = withoutExtension.toLowerCase();
	const alphanumericWithSlashes = lowercased.replace(/[^a-z0-9/]/g, "-");
	const collapsed = alphanumericWithSlashes
		.replace(/\/+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return collapsed;
}

async function refine() {
	await client.start();
	try {
		await client.log(`Reading from ${INPUT_FILE}...`);

		await Bun.write(OUTPUT_FILE, "");
		await Bun.write(REJECTED_FILE, "");

		let kept = 0;
		let rejected = 0;

		await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
			// 01-harvest outputs { term, frequency ... }. Need to shape into Node.
			// OR generate-golden-nodes Logic mixed here?
			// 01-harvest outputs Candidates. 02-refine outputs Golden Nodes.

			const term = (node.term || node.label).toLowerCase();
			const freq = node.frequency || node.meta?.frequency || 0;

			let rejectReason = "";

			if (freq < MIN_FREQUENCY) rejectReason = "Low Frequency";
			else if (term.length < MIN_LENGTH) rejectReason = "Too Short";
			else if (STOP_WORDS.has(term)) rejectReason = "Stop Word";
			else if (/^[\d\W]+$/.test(term)) rejectReason = "Pure Noise";
			else if (term.match(/^[0-9a-f]{10,}$/)) rejectReason = "Hash/ID";

			if (rejectReason) {
				rejected++;
				await JsonlUtils.appendAsync(REJECTED_FILE, {
					...node,
					rejection: rejectReason,
				});
			} else {
				kept++;
				// Convert Candidate -> Golden Node Structure if needed
				const goldenNode = {
					id: generateId(term),
					type: node.type || "concept",
					label: node.term || node.label,
					domain: "lexicon",
					layer: "concept",
					meta: {
						frequency: freq,
						sources: node.sources || node.meta?.sources || [],
						promoted_at: new Date().toISOString(),
					},
				};
				await JsonlUtils.appendAsync(OUTPUT_FILE, goldenNode);
			}

			if ((kept + rejected) % 500 === 0)
				await client.update({ processed: kept + rejected });
		});

		await client.log(`Kept ${kept}, Rejected ${rejected}`);
		await client.complete({ kept, rejected });
	} catch (e) {
		await client.error(String(e));
		process.exit(1);
	}
}

refine();
