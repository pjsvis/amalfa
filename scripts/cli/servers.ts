// Configuration - AMALFA Services
const RUNTIME_DIR = ".amalfa/runtime";

const SERVICES = [
	{
		name: "MCP Server",
		pidFile: `${RUNTIME_DIR}/mcp.pid`,
		port: "stdio",
		command: "amalfa serve",
	},
	{
		name: "Vector Daemon",
		pidFile: `${RUNTIME_DIR}/vector-daemon.pid`,
		port: "3010",
		command: "amalfa vector start",
	},
	{
		name: "File Watcher",
		pidFile: `${RUNTIME_DIR}/daemon.pid`,
		port: "-",
		command: "amalfa daemon start",
	},
  {
		name: "Sonar Agent",
		pidFile: `${RUNTIME_DIR}/sonar.pid`,
		port: "3012",
		command: "amalfa sonar start",
	},
  {
		name: "Dashboard",
		pidFile: `${RUNTIME_DIR}/dashboard.pid`,
		port: "3013",
		command: "amalfa dashboard start",
	},
	{
		name: "Dev Server",
		pidFile: `${RUNTIME_DIR}/ssr-docs.pid`,
		port: "3001",
		command: "amalfa ssr-docs start",
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
