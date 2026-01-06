import { spawn } from "node:child_process";
import { resolve } from "node:path";

const MCP_SCRIPT = resolve(process.cwd(), "src/mcp/index.ts");

async function testMcpLifecycle() {
	console.log("🧪 Testing MCP Lifecycle Stability...");

	// 1. Spawn MCP Server (stdio mode)
	const proc = spawn("bun", ["run", MCP_SCRIPT], {
		stdio: ["pipe", "pipe", "pipe"],
		env: { ...process.env, PATH: process.env.PATH },
	});

	const chunks: string[] = [];
	const errChunks: string[] = [];

	proc.stdout.on("data", (data) => {
		const str = data.toString();
		chunks.push(str);
		// data might be JSON-RPC or logs if we messed up
	});

	proc.stderr.on("data", (data) => {
		const str = data.toString();
		errChunks.push(str);
		// console.error("   [MCP STDERR]", str.trim());
	});

	proc.on("exit", (code) => {
		if (code !== 0 && code !== null) {
			console.error(`❌ MCP exited with code ${code}`);
			console.error("STDERR DUMP:", errChunks.join(""));
		}
	});

	// 2. Wait a bit to ensure it doesn't suicide immediately (Zombie Check takes ~100-200ms)
	await new Promise((r) => setTimeout(r, 2000));

	if (proc.exitCode !== null) {
		console.error("❌ MCP died prematurely!");
		process.exit(1);
	}

	console.log("   ✅ MCP process is still alive after startup window.");

	// 3. Send a Handshake
	const handshake = {
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "TestClient", version: "1.0" },
		},
	};

	proc.stdin.write(`${JSON.stringify(handshake)}\n`);

	// 4. Wait for response
	await new Promise((r) => setTimeout(r, 1000));

	const output = chunks.join("");
	if (output.includes("jsonrpc") && output.includes("result")) {
		console.log("   ✅ Received valid JSON-RPC Handshake response.");
	} else {
		console.error("   ❌ No valid handshake response received.");
		console.log("OUTPUT:", output);
		console.error("STDERR:", errChunks.join(""));
		process.exit(1);
	}

	// 5. Clean kill
	proc.kill();
	console.log("🎉 Verification Passed.");
}

testMcpLifecycle();
