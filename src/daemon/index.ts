#!/usr/bin/env bun

/**
 * AMALFA Daemon
 * File watcher for incremental database updates
 */

import { existsSync, watch } from "node:fs";
import { join } from "node:path";
import {
	AMALFA_DIRS,
	type AmalfaConfig,
	loadConfig,
} from "@src/config/defaults";
import { AmalfaIngestor } from "@src/pipeline/AmalfaIngestor";
import { ResonanceDB } from "@src/resonance/db";
import { getLogger } from "@src/utils/Logger";
import { sendNotification } from "@src/utils/Notifications";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("AmalfaDaemon");

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
	name: "AMALFA-Daemon",
	pidFile: join(AMALFA_DIRS.runtime, "daemon.pid"),
	logFile: join(AMALFA_DIRS.logs, "daemon.log"),
	entryPoint: "src/daemon/index.ts",
});

// Debouncing for file changes
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const pendingFiles = new Set<string>();

// Retry queue for failed ingestions
const retryQueue = new Map<
	string,
	{ attempts: number; lastError: string; lastAttempt: number }
>();
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 5000;

/**
 * Main daemon logic
 */
async function main() {
	// Load configuration
	const config = await loadConfig();
	const DEBOUNCE_MS = config.watch.debounce;

	const sources = config.sources || ["./docs"];
	log.info(
		{
			sources,
			database: config.database,
			debounce: DEBOUNCE_MS,
		},
		"🚀 AMALFA Daemon starting...",
	);

	// Verify source directories exist
	for (const source of sources) {
		const sourcePath = join(process.cwd(), source);
		if (!existsSync(sourcePath)) {
			log.warn({ path: sourcePath }, "⚠️  Source directory not found, skipping");
		}
	}

	// Start file watchers for all sources
	for (const source of sources) {
		startWatcher(source, DEBOUNCE_MS);
	}

	log.info("✅ Daemon ready. Watching for changes...");

	// Keep process alive
	process.on("SIGTERM", () => {
		log.info("🛑 Received SIGTERM, shutting down...");
		process.exit(0);
	});

	process.on("SIGINT", () => {
		log.info("🛑 Received SIGINT, shutting down...");
		process.exit(0);
	});

	// Keep alive
	await new Promise(() => {});
}

/**
 * Start file watcher
 */
function startWatcher(sourceDir: string, debounceMs: number) {
	const watchPath = join(process.cwd(), sourceDir);

	log.info({ path: watchPath }, "👀 Watching directory");

	try {
		watch(watchPath, { recursive: true }, (event, filename) => {
			// Only process markdown files
			if (filename?.endsWith(".md")) {
				const fullPath = join(watchPath, filename);

				log.debug(
					{
						file: filename,
						event,
					},
					"📝 Change detected",
				);

				pendingFiles.add(fullPath);
				triggerIngestion(debounceMs);
			}
		});
	} catch (e) {
		log.fatal({ err: e, path: watchPath }, "❌ Failed to watch directory");
		process.exit(1);
	}
}

/**
 * Trigger debounced ingestion
 */
function triggerIngestion(debounceMs: number) {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}

	debounceTimer = setTimeout(async () => {
		const batchSize = pendingFiles.size;
		if (batchSize === 0) return;

		log.info({ batchSize }, "🔄 Processing changes...");

		// Drain pending files
		const batch = Array.from(pendingFiles);
		pendingFiles.clear();

		// Load config for each batch (allows runtime config changes)
		let config: AmalfaConfig | undefined;
		try {
			config = await loadConfig();
			const dbPath = join(process.cwd(), config.database);

			// Open database
			const db = new ResonanceDB(dbPath);

			// Create ingestor
			const ingestor = new AmalfaIngestor(config, db);

			// Process only changed files
			// Note: We'd need to modify AmalfaIngestor to accept file list
			// For now, we'll re-run full ingestion (hash checking prevents duplicates)
			await ingestor.ingest();

			db.close();

			log.info({ files: batchSize }, "✅ Update complete");

			// Clear retry counts for successful files
			for (const file of batch) {
				retryQueue.delete(file);
			}

			// Send notification (if enabled in config)
			if (config.watch?.notifications !== false) {
				await sendNotification(
					"AMALFA",
					`Knowledge graph updated (${batchSize} file${batchSize > 1 ? "s" : ""})`,
				);
			}
		} catch (e) {
			const errorMsg = e instanceof Error ? e.message : String(e);
			log.error({ err: e }, "❌ Update failed");

			// Re-queue failed files with retry logic
			const now = Date.now();
			for (const file of batch) {
				const retryInfo = retryQueue.get(file) || {
					attempts: 0,
					lastError: "",
					lastAttempt: 0,
				};

				if (retryInfo.attempts < MAX_RETRIES) {
					const nextAttempt = retryInfo.attempts + 1;
					retryQueue.set(file, {
						attempts: nextAttempt,
						lastError: errorMsg,
						lastAttempt: now,
					});

					// Schedule retry with backoff
					setTimeout(() => {
						pendingFiles.add(file);
						triggerIngestion(debounceMs);
					}, RETRY_BACKOFF_MS * nextAttempt);

					log.warn(
						{
							file,
							attempt: nextAttempt,
							max: MAX_RETRIES,
							delayMs: RETRY_BACKOFF_MS * nextAttempt,
						},
						"🔄 Scheduling retry",
					);
				} else {
					log.error(
						{
							file,
							lastError: retryInfo.lastError,
						},
						"⛔ ABANDONED: Max retries exceeded",
					);
					retryQueue.delete(file);
				}
			}

			// Send error notification (if enabled in config)
			if (config?.watch?.notifications !== false) {
				await sendNotification(
					"AMALFA",
					`Update failed (${batch.length} file${batch.length > 1 ? "s" : ""} will retry)`,
				);
			}
		}
	}, debounceMs);
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
