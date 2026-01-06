import { join } from "node:path";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

// --- Configuration ---
const BASE_DIR = join(import.meta.dir, "../../experiments/enlightenment");
const BIN_PATH = join(BASE_DIR, "llama.cpp/build/bin/llama-server");
const MODEL_PATH = join(BASE_DIR, "vectors/Phi-3.5-mini-instruct-Q4_K_M.gguf");

const PORT = 8082;

const args = process.argv.slice(2);
const command = args[0] || "serve";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Phi-3.5",
	pidFile: ".phi.pid",
	logFile: ".phi.log",
	entryPoint: "src/services/phi.ts",
});

// --- Server Logic ---

async function runServer() {
	console.log(`🚀 Starting Phi-3.5 Server on port ${PORT}...`);

	const cmd = [
		BIN_PATH,
		"-m",
		MODEL_PATH,
		"--port",
		PORT.toString(),
		"--ctx-size",
		"4096",
		"--n-gpu-layers",
		"99", // Offload to GPU/Metal
		"--log-disable", // Keep clean for Phi
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
