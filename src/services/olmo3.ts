import { join } from "node:path";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

// --- Configuration ---
const BASE_DIR = join(import.meta.dir, "../../experiments/enlightenment");
const BIN_PATH = join(BASE_DIR, "llama.cpp/build/bin/llama-server");
const MODEL_PATH = join(BASE_DIR, "vectors/Olmo-3-7B-Think-Q4_K_M.gguf");

const PORT = 8084;

const args = process.argv.slice(2);
const command = args[0] || "serve";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Olmo-3",
	pidFile: ".olmo3.pid",
	logFile: ".olmo3.log",
	entryPoint: "src/services/olmo3.ts",
});

// --- Server Logic ---

async function runServer() {
	console.log(`🚀 Starting Olmo-3 Server on port ${PORT}...`);

	const cmd = [
		BIN_PATH,
		"-m",
		MODEL_PATH,
		"--port",
		PORT.toString(),
		"--ctx-size",
		"8192", // Reduced context for stability on Metal
		"--n-gpu-layers",
		"99", // Offload to GPU/Metal
		"--jinja", // Jinja2 template support
		"--reasoning-format",
		"deepseek", // Separate partial thinking
		"-fa",
		"on", // Flash Attention
		"--temp",
		"0.6",
	];

	const serverProcess = Bun.spawn(cmd, {
		stdout: "inherit",
		stderr: "inherit",
	});

	// Wait for process to exit
	await serverProcess.exited;
}

// --- Dispatch ---

await lifecycle.run(command, runServer);
