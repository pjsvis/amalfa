import { spawn } from "node:child_process";

async function test() {
	console.log("🕵️‍♂️ Starting MCP Protocol Test...");

	const proc = spawn("bun", ["run", "src/mcp/index.ts"], {
		stdio: ["pipe", "pipe", "pipe"],
		cwd: process.cwd(),
	});

	// Collect stderr (Logs)
	proc.stderr.on("data", (data) => {
		console.log(`[STDERR/LOGS] ${data.toString().trim()}`);
	});

	// Handle Stdout (Protocol)
	proc.stdout.on("data", (data) => {
		console.log(`\n📥 [STDOUT/PROTOCOL] Received:\n${data.toString()}`);
		// If we receive valid JSON, we are good
		if (data.toString().includes("jsonrpc")) {
			console.log("✅ Valid JSON-RPC response detected on STDOUT.");
			console.log("✅ Test Passed.");
			proc.kill();
			process.exit(0);
		}
	});

	// Send a JSON-RPC 'initialize' request
	const request = {
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "debug-script", version: "1.0" },
		},
	};

	// Wait a bit for server to boot (logs to appear)
	await new Promise((r) => setTimeout(r, 1000));

	console.log(`\n📤 Sending Request: ${JSON.stringify(request)}\n`);
	proc.stdin.write(`${JSON.stringify(request)}\n`);
}

test();
