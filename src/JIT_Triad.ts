import { type Subprocess, spawn } from "bun";
import { EnlightenedTriad } from "./EnlightenedTriad"; // Re-using your existing interface

// --- CONFIGURATION ---
const BASE_DIR = `${import.meta.dir}/../experiments/enlightenment`; // Adjust relative to src/
const BIN_PATH = `${BASE_DIR}/llama.cpp/build/bin/llama-server`;
const VECTORS_DIR = `${BASE_DIR}/vectors`;

const AGENTS = {
	SCOUT: {
		port: 8082,
		model: `${VECTORS_DIR}/Phi-3.5-mini-instruct-Q4_K_M.gguf`,
		ctx: 4096,
		vector: null,
	},
	ARCHITECT: {
		port: 8083,
		model: `${VECTORS_DIR}/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf`,
		ctx: 8192,
		vector: `${VECTORS_DIR}/enlightenment_vector_v2.gguf`,
		scale: "-0.3",
	},
	AUDITOR: {
		port: 8084,
		model: `${VECTORS_DIR}/Olmo-3-7B-Think-Q4_K_M.gguf`,
		ctx: 8192,
		vector: null,
	},
};

let currentProcess: Subprocess | null = null;

// --- LIFECYCLE MANAGER ---
async function bootAgent(role: keyof typeof AGENTS) {
	if (currentProcess) {
		console.log("♻️  Freeing VRAM (Stopping previous agent)...");
		currentProcess.kill();
		await new Promise((r) => setTimeout(r, 1000)); // Cool down
	}

	const config = AGENTS[role];
	console.log(`🚀 Booting ${role} on Port ${config.port}...`);

	const args = [
		BIN_PATH,
		"-m",
		config.model,
		"--port",
		config.port.toString(),
		"--ctx-size",
		config.ctx.toString(),
		"--n-gpu-layers",
		"99", // Metal
		"--log-disable", // Keep console clean
	];

	if (config.vector) {
		args.push("--control-vector-scaled", `${config.vector}:${config.scale}`);
	}

	// Spawn via Bun
	currentProcess = spawn(args, {
		stdout: "ignore", // Silence server logs
		stderr: "ignore",
	});

	// Wait for Health Check
	process.stdout.write("   Waiting for neural activity...");
	for (let i = 0; i < 30; i++) {
		try {
			const res = await fetch(`http://127.0.0.1:${config.port}/health`);
			if (res.ok) {
				console.log(" Online! 🟢");
				return;
			}
		} catch (_e) {}
		await new Promise((r) => setTimeout(r, 500));
		process.stdout.write(".");
	}
	throw new Error(`${role} failed to start.`);
}

async function shutdown() {
	if (currentProcess) {
		console.log("\n🛑 Shutting down final agent...");
		currentProcess.kill();
	}
}

// --- THE DEMO FLOW ---
async function runOptimizedPipeline() {
	const triad = new EnlightenedTriad();

	try {
		console.log("⚡️ SYSTEM ONLINE: Engaging OPTIMIZED Intelligence...\n");
		const rawLog =
			"2025-12-19 14:02:11 [CRITICAL] Connection refused at 192.168.1.5 (DB_SHARD_04). Latency 4005ms.";

		// --- STEP 1: SCOUT ---
		await bootAgent("SCOUT");
		console.log("\n--- 🕵️ SCOUT TASK ---");
		const scoutResult = await triad.scout(
			rawLog,
			"Extract IP and Error Message. No notes.",
		);
		console.log(`>> Output: ${scoutResult}`);

		// --- STEP 2: ARCHITECT ---
		await bootAgent("ARCHITECT");
		console.log("\n--- 📐 ARCHITECT TASK ---");
		const architectResult = await triad.architect(scoutResult);
		console.log(`>> Output:`, JSON.stringify(architectResult, null, 2));

		// --- STEP 3: AUDITOR ---
		await bootAgent("AUDITOR");
		console.log("\n--- 🧠 AUDITOR TASK ---");
		const claim = `The error 'Connection refused' caused the high latency.`;
		const auditResult = await triad.audit(claim);

		console.log(
			`\n📝 THOUGHT TRACE:\n${auditResult.thought_trace.substring(0, 300)}...`,
		);
		console.log(`\n⚖️ VERDICT: ${auditResult.passed ? "✅ PASS" : "❌ FAIL"}`);
	} catch (error) {
		console.error("\n💥 Pipeline Error:", error);
	} finally {
		await shutdown();
	}
}

// Handle Ctrl+C
process.on("SIGINT", async () => {
	await shutdown();
	process.exit(0);
});

runOptimizedPipeline();
