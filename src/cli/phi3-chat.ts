// import { Command } from "commander";
import { createInterface } from "readline";
import { DaemonManager } from "../utils/DaemonManager";

export async function chatLoop() {
	const manager = new DaemonManager();
	const status = await manager.checkPhi3Agent();

	if (!status.running) {
		console.log(
			"❌ Phi3 Agent is not running. Start it with: amalfa phi3 start",
		);
		process.exit(1);
	}

	const BASE_URL = `http://localhost:${status.port}`;
	let sessionId: string | undefined;

	console.log(`💬 AMALFA Corpus Assistant (${status.activeModel || "Phi3"})`);
	console.log("   Type 'exit' or 'quit' to leave.\n");

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: "You > ",
	});

	rl.prompt();

	rl.on("line", async (line) => {
		const input = line.trim();
		if (["exit", "quit"].includes(input.toLowerCase())) {
			rl.close();
			return;
		}

		if (!input) {
			rl.prompt();
			return;
		}

		let timer: Timer | undefined;
		try {
			const start = Date.now();
			process.stdout.write("🤖 Thinking... (0s)");

			timer = setInterval(() => {
				const elapsed = Math.floor((Date.now() - start) / 1000);
				process.stdout.clearLine(0);
				process.stdout.cursorTo(0);
				process.stdout.write(`🤖 Thinking... (${elapsed}s)`);
			}, 1000);

			const res = await fetch(`${BASE_URL}/chat`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: input, sessionId }),
			});

			clearInterval(timer);

			if (!res.ok) {
				throw new Error(`API Error: ${res.statusText}`);
			}

			const data = (await res.json()) as {
				message: { content: string };
				sessionId: string;
			};

			// Update session ID if new
			if (!sessionId) {
				sessionId = data.sessionId;
			}

			// Clear "Thinking..." line
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);

			console.log(`Phi3 > ${data.message.content}\n`);
		} catch (e) {
			clearInterval(timer);
			process.stdout.clearLine(0);
			process.stdout.cursorTo(0);
			console.error(
				`❌ Error: ${e instanceof Error ? e.message : String(e)}\n`,
			);
		}

		rl.prompt();
	}).on("close", () => {
		console.log("\n👋 Goodbye!");
		process.exit(0);
	});
}
