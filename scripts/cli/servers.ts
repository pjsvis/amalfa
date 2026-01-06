// Configuration
const SERVICES = [
	{ name: "Dev Server", pidFile: ".dev.pid", port: "3000", command: "dev" },
	{ name: "Daemon", pidFile: ".daemon.pid", port: "3010", command: "daemon" },
	{ name: "MCP", pidFile: ".mcp.pid", port: "Stdio", command: "mcp" },
	{ name: "Olmo-3", pidFile: ".olmo3.pid", port: "8084", command: "olmo3" },
	{ name: "Phi-3.5", pidFile: ".phi.pid", port: "8082", command: "phi" },
	{ name: "Llama-3", pidFile: ".llama.pid", port: "8083", command: "llama" },
	{
		name: "Llama-3-UV",
		pidFile: ".llamauv.pid",
		port: "8085",
		command: "llamauv",
	},
	{
		name: "Reactor",
		pidFile: ".reactor.pid",
		port: "3050",
		command: "reactor",
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

console.log("\n📡 PolyVis Service Status\n");
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
