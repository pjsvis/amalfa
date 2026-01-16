import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@src/config/defaults";
import { EmberService } from "@src/ember/index";
import { ResonanceDB } from "@src/resonance/db";
import { DaemonManager } from "@src/utils/DaemonManager";
import { discoverOllamaCapabilities } from "@src/utils/ollama-discovery";
import { getDbPath } from "../utils";

export async function cmdDaemon(args: string[]) {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa daemon <start|stop|status|restart>");
		process.exit(1);
	}

	const manager = new DaemonManager();

	if (action === "status") {
		const status = await manager.checkFileWatcher();
		if (status.running) {
			console.log(`✅ File Watcher: Running (PID: ${status.pid})`);
		} else {
			console.log("❌ File Watcher: Stopped");
		}
		return;
	}

	if (action === "start") {
		console.log("🚀 Starting File Watcher...");
		try {
			await manager.startFileWatcher();
			console.log("✅ File Watcher started");
		} catch (e) {
			console.error("❌ Failed to start File Watcher:", e);
			process.exit(1);
		}
		return;
	}

	if (action === "stop") {
		console.log("🛑 Stopping File Watcher...");
		try {
			await manager.stopFileWatcher();
			console.log("✅ File Watcher stopped");
		} catch (e) {
			console.error("❌ Failed to stop File Watcher:", e);
			process.exit(1);
		}
		return;
	}

	if (action === "restart") {
		console.log("🔄 Restarting File Watcher...");
		try {
			await manager.stopFileWatcher();
			await manager.startFileWatcher();
			console.log("✅ File Watcher restarted");
		} catch (e) {
			console.error("❌ Failed to restart File Watcher:", e);
			process.exit(1);
		}
		return;
	}
}

export async function cmdVector(args: string[]) {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa vector <start|stop|status|restart>");
		process.exit(1);
	}

	// Run vector daemon with the specified action
	// Resolve relative to project root
	const vectorPath = join(
		process.cwd(),
		"src/resonance/services/vector-daemon.ts",
	);
	const proc = spawn("bun", ["run", vectorPath, action], {
		stdio: "inherit",
		cwd: process.cwd(),
	});

	proc.on("exit", (code) => {
		process.exit(code ?? 0);
	});
}

export async function cmdReranker(args: string[]) {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa reranker <start|stop|status|restart>");
		process.exit(1);
	}

	// Run reranker daemon with the specified action
	const daemonPath = join(
		process.cwd(),
		"src/resonance/services/reranker-daemon.ts",
	);
	const proc = spawn("bun", ["run", daemonPath, action], {
		stdio: "inherit",
		cwd: process.cwd(),
	});

	proc.on("exit", (code) => {
		process.exit(code ?? 0);
	});
}

export async function cmdSonar(args: string[]) {
	const action = args[1] || "status";
	const validActions = ["start", "stop", "status", "restart", "chat"];

	if (!validActions.includes(action)) {
		console.error(`❌ Invalid action: ${action}`);
		console.error("\nUsage: amalfa sonar <start|stop|status|restart|chat>");
		process.exit(1);
	}

	const manager = new DaemonManager();

	if (action === "status") {
		console.log("🔍 Checking status...");

		// Check Ollama
		try {
			const ollama = await discoverOllamaCapabilities();
			if (ollama.available) {
				console.log(
					`✅ Ollama: Running (Model: ${ollama.model}, Size: ${ollama.size})`,
				);
			} else {
				console.log("❌ Ollama: Not detected");
			}
		} catch {
			console.log("❌ Ollama: Check failed");
		}

		// Check Daemon
		const status = await manager.checkSonarAgent();

		if (status.running) {
			console.log(
				`✅ Sonar Agent: Running (PID: ${status.pid}, Port: ${status.port})`,
			);

			// Check health endpoint
			try {
				const res = await fetch(`http://localhost:${status.port}/health`);
				const health = await res.json();
				console.log(`   Health: ${JSON.stringify(health)}`);
			} catch {
				console.log("   Health: ⚠️  Unresponsive");
			}
		} else {
			console.log("❌ Sonar Agent: Stopped");
		}
		return;
	}

	if (action === "start") {
		console.log("🚀 Starting Sonar Agent...");
		try {
			await manager.startSonarAgent();
			console.log("✅ Sonar Agent started");
		} catch (e) {
			console.error("❌ Failed to start Sonar Agent:", e);
			process.exit(1);
		}
		return;
	}

	if (action === "stop") {
		console.log("🛑 Stopping Sonar Agent...");
		try {
			await manager.stopSonarAgent();
			console.log("✅ Sonar Agent stopped");
		} catch (e) {
			console.error("❌ Failed to stop Sonar Agent:", e);
			process.exit(1);
		}
		return;
	}

	if (action === "chat") {
		const { chatLoop } = await import("@src/cli/sonar-chat");
		await chatLoop();
		return;
	}

	if (action === "restart") {
		console.log("🔄 Restarting Sonar Agent...");
		try {
			await manager.stopSonarAgent();
			await manager.startSonarAgent();
			console.log("✅ Sonar Agent restarted");
		} catch (e) {
			console.error("❌ Failed to restart Sonar Agent:", e);
			process.exit(1);
		}
		return;
	}
}

export async function cmdEmber(args: string[]) {
	const rawAction = args[1] || "help";
	const action =
		rawAction === "--help" || rawAction === "-h" ? "help" : rawAction;

	if (action === "help") {
		console.log(`
EMBER - Automated Enrichment Service

Usage:
  amalfa ember scan [--dry-run]   Analyze files and generate sidecars
  amalfa ember squash             Merge sidecars into markdown files
  amalfa ember status             Show pending sidecars (TODO)
`);
		return;
	}

	// Check DB
	const dbPath = await getDbPath();
	if (!existsSync(dbPath)) {
		console.error("❌ Database not found. Run 'amalfa init' first.");
		process.exit(1);
	}

	const db = new ResonanceDB(dbPath);
	const appConfig = await loadConfig();

	const emberConfig = {
		enabled: true,
		sources: appConfig.sources || ["./docs"],
		minConfidence: 0.7,
		backupDir: ".amalfa/backups",
		excludePatterns: appConfig.excludePatterns || [],
	};

	const ember = new EmberService(db, emberConfig);

	try {
		if (action === "scan") {
			const dryRun = args.includes("--dry-run");
			await ember.runFullSweep(dryRun);
		} else if (action === "squash") {
			await ember.squashAll();
		} else if (action === "status") {
			console.log("Checking pending sidecars... (Not yet implemented)");
		} else {
			console.error(`❌ Unknown action: ${action}`);
			process.exit(1);
		}
	} catch (e) {
		console.error("❌ Ember command failed:", e);
		process.exit(1);
	} finally {
		db.close();
	}
}
