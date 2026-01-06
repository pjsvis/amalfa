import { spawn } from "node:child_process";

console.log("🧪 STARTING TRIAD CONCURRENCY TEST");
console.log("-----------------------------------");

const writer = spawn("bun", ["run", "scripts/lab/lab_daemon.ts"], {
	stdio: "inherit",
});
const reader = spawn("bun", ["run", "scripts/lab/lab_mcp.ts"], {
	stdio: "inherit",
});
const web = spawn("bun", ["run", "scripts/lab/lab_web.ts"], {
	stdio: "inherit",
});

const procs = [writer, reader, web];

process.on("SIGINT", () => {
	console.log("\n🛑 KILLING ALL PROCS...");
	procs.forEach((p) => {
		p.kill();
	});
	process.exit(0);
});

// Run for 30 seconds then exit
setTimeout(() => {
	console.log("\n✅ EXPERIMENT COMPLETE. Success (if no errors visible).");
	procs.forEach((p) => {
		p.kill();
	});
	process.exit(0);
}, 30000);
