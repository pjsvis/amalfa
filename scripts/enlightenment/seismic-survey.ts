import { type ChildProcess, spawn } from "node:child_process";
import { appendFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// === CONFIGURATION ===
// Hypothesis: The "Bedrock" (Original Functionality) is hidden under layers of fine-tuning/vectors.
// We are drilling down (negative scaling) to find where the original model behavior (Bedrock) re-emerges.
const CANDIDATES = [-0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.8, -1.0];
const SERVER_PORT = 8088;
const ROOT_DIR = process.cwd();
const MODEL_PATH = resolve(
	ROOT_DIR,
	"experiments/enlightenment/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
);
const VECTOR_PATH = resolve(
	ROOT_DIR,
	"experiments/enlightenment/enlightenment_vector_v2.gguf",
);
const SERVER_BIN = resolve(
	ROOT_DIR,
	"experiments/enlightenment/llama.cpp/build/bin/llama-server",
);
const LOG_FILE = resolve(ROOT_DIR, "experiments/enlightenment/SEISMIC_LOG.md");

const SHOTS = [
	{
		name: "Positivity Test",
		prompt: "I am having a wonderful day!",
		expected_sentiment: "POSITIVE",
	},
	{
		name: "Negativity Test",
		prompt: "Everything is going wrong.",
		expected_sentiment: "NEGATIVE",
	},
];

async function main() {
	console.log("⛏️  SEISMIC SURVEY: RECIPROCAL METHOD");

	await writeFile(
		LOG_FILE,
		`# The Seismic Log
**Date:** ${new Date().toISOString()}
**Method:** Reciprocal Sentiment Analysis (Palmer's Method)

| Depth (Scale) | Shot Direction | Response | Bedrock? |
|---|---|---|---|
`,
	);

	for (const depth of CANDIDATES) {
		console.log(`\n\n📍 DRILLING AT DEPTH: ${depth}`);

		const serverProcess = await launchServer(depth);
		if (!serverProcess) continue;

		let bedrockHits = 0;

		for (const shot of SHOTS) {
			process.stdout.write(`   💥 Firing ${shot.name}... `);

			const response = await queryModel(shot.prompt);

			const bedrock = isBedrock(response, shot.expected_sentiment);

			if (bedrock) bedrockHits++;

			const mark = bedrock ? "✅ SOLID" : "⚠️ GRAVEL";
			console.log(`${mark}`);

			const cleanResp = response.slice(0, 100).replace(/\n/g, " ");
			await appendFile(
				LOG_FILE,
				`| **${depth}** | ${shot.name} | *"${cleanResp}..."* | ${mark} |\n`,
			);
		}

		// Bayesian Stop: If both shots hit bedrock, we have found the anomaly.
		if (bedrockHits === 2) {
			console.log(`\n🏆 ANOMALY CONFIRMED AT ${depth}. STOPPING SEARCH.`);
			await appendFile(
				LOG_FILE,
				`\n**CONCLUSION:** The pot of gold is at ${depth}.`,
			);
			serverProcess.kill();
			process.exit(0);
		}

		serverProcess.kill();
		// Allow port to clear
		await new Promise((r) => setTimeout(r, 2000));
	}
}

async function launchServer(scale: number): Promise<ChildProcess | null> {
	const vectorArg = `${VECTOR_PATH}:${scale}`;
	const server = spawn(SERVER_BIN, [
		"-m",
		MODEL_PATH,
		"--port",
		SERVER_PORT.toString(),
		"--control-vector-scaled",
		vectorArg,
		"--ctx-size",
		"2048",
		"--alias",
		"seismic-llama",
	]);

	// Mute logs
	server.stderr.on("data", () => {});

	return new Promise((resolvePromise) => {
		let started = false;
		const checker = (data: Buffer) => {
			if (data.toString().includes("server is listening")) {
				started = true;
				resolvePromise(server);
			}
		};
		server.stderr.on("data", checker);
		server.stdout.on("data", checker);
		setTimeout(() => {
			if (!started) {
				server.kill();
				resolvePromise(null);
			}
		}, 20000);
	});
}

async function queryModel(prompt: string): Promise<string> {
	try {
		const res = await fetch(
			`http://127.0.0.1:${SERVER_PORT}/v1/chat/completions`,
			{
				method: "POST",
				body: JSON.stringify({
					messages: [{ role: "user", content: prompt }],
					max_tokens: 150,
				}),
			},
		);
		const data = (await res.json()) as {
			choices?: { message?: { content?: string } }[];
		};
		return data.choices?.[0]?.message?.content || "ERR";
	} catch {
		return "CONN_ERR";
	}
}

function isBedrock(response: string, expected: string): boolean {
	const lower = response.toLowerCase();
	// Very naive sentiment check as a placeholder
	if (
		expected === "POSITIVE" &&
		(lower.includes("glad") ||
			lower.includes("happy") ||
			lower.includes("good") ||
			lower.includes("great"))
	)
		return true;
	if (
		expected === "NEGATIVE" &&
		(lower.includes("sorry") ||
			lower.includes("bad") ||
			lower.includes("unfortunate") ||
			lower.includes("sad"))
	)
		return true;
	return false;
}

main();
