import { existsSync } from "fs";
import { join } from "path";
import { ServiceLifecycle } from "./ServiceLifecycle";
import { AMALFA_DIRS } from "@src/config/defaults";

export interface DaemonStatus {
	running: boolean;
	pid?: number;
	port?: number;
	activeModel?: string;
}

/**
 * DaemonManager - Unified management for AMALFA daemons
 * Handles vector daemon and file watcher daemon
 */
export class DaemonManager {
	private vectorLifecycle: ServiceLifecycle;
	private watcherLifecycle: ServiceLifecycle;
	private phi3Lifecycle: ServiceLifecycle;

	constructor() {
		this.vectorLifecycle = new ServiceLifecycle({
			name: "Vector-Daemon",
			pidFile: join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
			logFile: join(AMALFA_DIRS.logs, "vector-daemon.log"),
			entryPoint: "src/resonance/services/vector-daemon.ts",
		});

		this.watcherLifecycle = new ServiceLifecycle({
			name: "File-Watcher",
			pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
			logFile: join(AMALFA_DIRS.logs, "daemon.log"),
			entryPoint: "src/daemon/index.ts",
		});

		this.phi3Lifecycle = new ServiceLifecycle({
			name: "Phi3Agent",
			pidFile: join(AMALFA_DIRS.runtime, "phi3.pid"),
			logFile: join(AMALFA_DIRS.logs, "phi3.log"),
			entryPoint: "src/daemon/phi3-agent.ts",
		});
	}

	/**
	 * Check if a process is running
	 */
	private async isProcessRunning(pid: number): Promise<boolean> {
		try {
			process.kill(pid, 0);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Read PID from file
	 */
	private async readPid(pidFile: string): Promise<number | null> {
		if (!existsSync(pidFile)) {
			return null;
		}
		try {
			const content = await Bun.file(pidFile).text();
			const pid = Number.parseInt(content.trim(), 10);
			return Number.isNaN(pid) ? null : pid;
		} catch {
			return null;
		}
	}

	/**
	 * Check if vector daemon is running
	 */
	async checkVectorDaemon(): Promise<DaemonStatus> {
		const pid = await this.readPid(
			join(AMALFA_DIRS.runtime, "vector-daemon.pid"),
		);
		if (!pid) {
			return { running: false };
		}

		const running = await this.isProcessRunning(pid);
		return {
			running,
			pid: running ? pid : undefined,
			port: running ? 3010 : undefined,
		};
	}

	/**
	 * Start vector daemon
	 */
	async startVectorDaemon(): Promise<void> {
		await this.vectorLifecycle.start();
		// Wait a moment for daemon to initialize
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	/**
	 * Stop vector daemon
	 */
	async stopVectorDaemon(): Promise<void> {
		await this.vectorLifecycle.stop();
	}

	/**
	 * Check if file watcher daemon is running
	 */
	async checkFileWatcher(): Promise<DaemonStatus> {
		const pid = await this.readPid(join(AMALFA_DIRS.runtime, "daemon.pid"));
		if (!pid) {
			return { running: false };
		}

		const running = await this.isProcessRunning(pid);
		return {
			running,
			pid: running ? pid : undefined,
		};
	}

	/**
	 * Start file watcher daemon
	 */
	async startFileWatcher(): Promise<void> {
		await this.watcherLifecycle.start();
		// Wait a moment for daemon to initialize
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	/**
	 * Stop file watcher daemon
	 */
	async stopFileWatcher(): Promise<void> {
		await this.watcherLifecycle.stop();
	}

	/**
	 * Check if Phi3 Agent is running
	 */
	async checkPhi3Agent(): Promise<DaemonStatus> {
		const pid = await this.readPid(join(AMALFA_DIRS.runtime, "phi3.pid"));
		if (!pid) {
			return { running: false };
		}

		const running = await this.isProcessRunning(pid);
		let activeModel: string | undefined;

		if (running) {
			try {
				const health = (await fetch("http://localhost:3012/health").then((r) =>
					r.json(),
				)) as { model?: string };
				activeModel = health.model;
			} catch {
				// disregard
			}
		}

		return {
			running,
			pid: running ? pid : undefined,
			port: running ? 3012 : undefined,
			activeModel,
		};
	}

	/**
	 * Start Phi3 Agent
	 */
	async startPhi3Agent(): Promise<void> {
		await this.phi3Lifecycle.start();
		// Wait a moment for daemon to initialize
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	/**
	 * Stop Phi3 Agent
	 */
	async stopPhi3Agent(): Promise<void> {
		await this.phi3Lifecycle.stop();
	}

	/**
	 * Check status of all daemons
	 */
	async checkAll(): Promise<{
		vector: DaemonStatus;
		watcher: DaemonStatus;
		phi3: DaemonStatus;
	}> {
		const [vector, watcher, phi3] = await Promise.all([
			this.checkVectorDaemon(),
			this.checkFileWatcher(),
			this.checkPhi3Agent(),
		]);
		return { vector, watcher, phi3 };
	}

	/**
	 * Stop all daemons
	 */
	async stopAll(): Promise<void> {
		await Promise.all([
			this.stopVectorDaemon(),
			this.stopFileWatcher(),
			this.stopPhi3Agent(),
		]);
	}
}
