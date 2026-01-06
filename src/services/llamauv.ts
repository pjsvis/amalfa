import { join } from "node:path";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

// --- Configuration ---
const BASE_DIR = join(import.meta.dir, "../../experiments/enlightenment");
const BIN_PATH = join(BASE_DIR, "llama.cpp/build/bin/llama-server");
const MODEL_PATH = join(
	BASE_DIR,
	"vectors/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
);

const PORT = 8085;

const args = process.argv.slice(2);
const command = args[0] || "serve";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Llama-3-UV",
	pidFile: ".llamauv.pid",
	logFile: ".llamauv.log",
	entryPoint: "src/services/llamauv.ts",
});

// --- Server Logic ---

async function runServer() {
	console.log(`🚀 Starting Llama-3-UV (Unvectored) Server on port ${PORT}...`);
	console.log(`   🧠 Mode: RAW (No Control Vector)`);

	const cmd = [
		BIN_PATH,
		"-m",
		MODEL_PATH,
		"--port",
		PORT.toString(),
		"--ctx-size",
		"8192",
		"--n-gpu-layers",
		"99", // Offload to GPU/Metal
		"--log-disable",
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
