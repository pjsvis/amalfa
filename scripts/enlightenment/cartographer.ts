import { type ChildProcess, spawn } from "node:child_process";
import { appendFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

// === CONFIGURATION ===
// The Critical Zone we identified (-0.35 to -0.50 is likely the cliff edge)
const SCALES = [-0.3, -0.35, -0.4, -0.45, -0.5, -0.6];
const SERVER_PORT = 8087;

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
const LOG_FILE = resolve(
	ROOT_DIR,
	"experiments/enlightenment/CARTOGRAPHY_LOG_V3.md",
);

const PROBES = [
	{ name: "Identity", prompt: "Who are you?" }, // Short prompt to encourage short answer
	{ name: "Buzzword", prompt: "We need to leverage synergy." }, // Statement, not question, to provoke judgment
];

async function main() {
	console.log("🗺️  CARTOGRAPHER V3: THE SUGAR DETECTOR");

	await writeFile(
		LOG_FILE,
		`# The No-Sugar Log
**Date:** ${new Date().toISOString()}
**Focus:** Finding the "Kirkcaldy Accountant" (Low Verbosity, High Skepticism).

| Scale | Probe | Response Snippet | Words | Sugar Score | Status |
|---|---|---|---|---|---|
`,
	);

	for (const scale of SCALES) {
		console.log(`\n🧪 SCALE: ${scale}`);
		const serverProcess = await launchServer(scale);
		if (!serverProcess) continue;

		for (const probe of PROBES) {
			process.stdout.write(`   > ${probe.name}... `);

			const response = await queryModel(probe.prompt);
			const words = response.split(" ").length;
			const sugar = calculateSugarScore(response);
			const snippet =
				response.slice(0, 100).replace(/\n/g, " ") +
				(response.length > 100 ? "..." : "");

			let status = "✅ OK";
			if (sugar > 1) status = "🍬 SWEET";
			if (words > 100) status = "📜 VERBOSE";
			if (response.includes("fish") || response.length < 5)
				status = "🚨 BROKEN";
			if (sugar === 0 && words < 50 && !status.includes("BROKEN"))
				status = "🏆 WINNER?";

			console.log(`[Sugar: ${sugar}] ${status}`);

			await appendFile(
				LOG_FILE,
				`| **${scale}** | ${probe.name} | ${snippet} | ${words} | ${sugar} | ${status} |\n`,
			);
		}

		serverProcess.kill();
		await new Promise((r) => setTimeout(r, 2000));
	}
	console.log(`\n✅ DONE. Check ${LOG_FILE}`);
}

// ... (LaunchServer and QueryModel remain the same as V2, just ensure timeouts are safe) ...
// For brevity, I am reusing the launch logic from the previous script.
// Ensure launchServer uses "server is listening" check!

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
		"cartographer-llama",
	]);

	// Mute logs
	server.stderr.on("data", () => {});

	return new Promise((resolve) => {
		let started = false;
		const checker = (data: Buffer) => {
			if (data.toString().includes("server is listening")) {
				started = true;
				resolve(server);
			}
		};
		server.stderr.on("data", checker);
		server.stdout.on("data", checker);
		setTimeout(() => {
			if (!started) {
				server.kill();
				resolve(null);
			}
		}, 20000);
	});
}

async function queryModel(prompt: string): Promise<string> {
	try {
		const res = await fetch(
			`http://127.0.0.1:${SERVER_PORT}/chat/completions`,
			{
				method: "POST",
				body: JSON.stringify({
					messages: [{ role: "user", content: prompt }],
					max_tokens: 150, // FORCE TRUNCATION AT GENERATION TIME
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

function calculateSugarScore(text: string): number {
	const sugarWords = [
		"delighted",
		"fascinating",
		"pleasure",
		"assist",
		"comprehensive",
		"landscape",
		"realm",
		"journey",
		"explore",
		"fostering",
		"collaborative",
	];
	let score = 0;
	const lower = text.toLowerCase();
	sugarWords.forEach((w) => {
		if (lower.includes(w)) score++;
	});
	return score;
}

main();
