// Configuration - AMALFA Services
const SERVICES = [
	{
		name: "MCP Server",
		pidFile: ".mcp.pid",
		port: "stdio",
		command: "bun run start",
	},
	{
		name: "Vector Daemon",
		pidFile: ".vector-daemon.pid",
		port: "3010",
		command: "bun run src/resonance/services/vector-daemon.ts start",
	},
	{
		name: "File Watcher",
		pidFile: ".amalfa-daemon.pid",
		port: "-",
		command: "bun run src/daemon/index.ts start",
	},
	{
		name: "Dev Server",
		pidFile: ".dev.pid",
		port: "3000",
		command: "bun run dev",
	},
];

async function isRunning(pid: number): Promise<boolean> {
	try {
		process.kill(pid, 0);
		return true;
	} catch (_e) {
		return false;
	}
}

console.log("\n📡 AMALFA Service Status\n");
console.log(
	"----------------------------------------------------------------------",
);
console.log(
	"SERVICE".padEnd(15) +
		"PORT".padEnd(10) +
		"COMMAND".padEnd(15) +
		"STATUS".padEnd(15) +
		"PID".padEnd(10),
);
console.log(
	"----------------------------------------------------------------------",
);

for (const svc of SERVICES) {
	const file = Bun.file(svc.pidFile);
	let status = "⚪️ STOPPED";
	let pidStr = "-";

	if (await file.exists()) {
		const text = await file.text();
		const pid = parseInt(text.trim(), 10);

		if (!Number.isNaN(pid) && (await isRunning(pid))) {
			status = "🟢 RUNNING";
			pidStr = pid.toString();
		} else {
			// Handle stale PIDs
			status = "🔴 STALE";
			pidStr = `${pid} (?)`;
		}
	}

	console.log(
		svc.name.padEnd(15) +
			svc.port.padEnd(10) +
			svc.command.padEnd(15) +
			status.padEnd(15) +
			pidStr.padEnd(10),
	);
}

console.log(
	"----------------------------------------------------------------------\n",
);
