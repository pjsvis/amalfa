// scripts/check-system.ts (The "Worker")
import { Hono } from "hono";
import { streamText } from "hono/streaming";

const app = new Hono();

app.get("/stream/system-check", (c) => {
	return streamText(c, async (stream) => {
		// Helper to send JSONL
		const send = async (data: any) => {
			await stream.write(JSON.stringify(data) + "\n");
		};

		// 1. Log Start
		await send({
			type: "log",
			level: "info",
			message: "Starting diagnostics...",
			timestamp: new Date().toLocaleTimeString(),
		});
		await stream.sleep(500); // Fake work

		// 2. Emit a Stat
		await send({ type: "stat", label: "CPU Load", value: "45%" });
		await stream.sleep(800);

		// 3. Check a Pipeline
		await send({
			type: "log",
			level: "info",
			message: "Checking Twitter Firehose...",
			timestamp: new Date().toLocaleTimeString(),
		});
		await send({
			type: "pipeline",
			name: "Twitter Stream",
			status: "active",
			metric: "1,240 tweets/s",
		});

		// 4. Simulate an Error
		await stream.sleep(1000);
		await send({
			type: "log",
			level: "error",
			message: "Connection timeout on DB-02",
			timestamp: new Date().toLocaleTimeString(),
		});
		await send({
			type: "pipeline",
			name: "Legacy Import",
			status: "error",
			metric: "FAILED",
		});

		// 5. Finish
		await send({
			type: "log",
			level: "info",
			message: "Diagnostics complete.",
			timestamp: new Date().toLocaleTimeString(),
		});
	});
});

export default app;
