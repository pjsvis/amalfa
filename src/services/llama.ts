import { join } from "node:path";
import { ServiceLifecycle } from "../utils/ServiceLifecycle";

// --- Configuration ---
const BASE_DIR = join(import.meta.dir, "../../experiments/enlightenment");
const BIN_PATH = join(BASE_DIR, "llama.cpp/build/bin/llama-server");
const MODEL_PATH = join(
	BASE_DIR,
	"vectors/Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",
);
const VECTOR_PATH = join(BASE_DIR, "vectors/enlightenment_vector_v2.gguf");

const PORT = 8083;

const args = process.argv.slice(2);
const command = args[0] || "serve";

// --- Service Lifecycle ---

const lifecycle = new ServiceLifecycle({
	name: "Llama-3",
	pidFile: ".llama.pid",
	logFile: ".llama.log",
	entryPoint: "src/services/llama.ts",
});

// --- Server Logic ---

async function runServer() {
	console.log(`🚀 Starting Llama-3 Server on port ${PORT}...`);
	console.log(`   🧠 Applying Control Vector: The Accountant (-0.11)`);

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
		"--control-vector-scaled",
		`${VECTOR_PATH}:-0.11`, // The Accountant (Calibrated: Optimal Strength)
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
