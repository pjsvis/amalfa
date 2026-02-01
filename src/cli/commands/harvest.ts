import { readFileSync, statSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { LangExtractClient } from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";
import { StatsLogger } from "@src/utils/StatsLogger";

const log = getLogger("CLI:Harvest");

// Ignore list
const IGNORE_DIRS = ["node_modules", ".git", ".amalfa", "dist", "out"];
const ALLOW_EXTS = [".ts", ".tsx", ".md"];
const CONCURRENCY = 1;
const MAX_FILE_SIZE = 25 * 1024; // 25KB Guardrail
const CIRCUIT_BREAKER_THRESHOLD = 3; // Fail fast after N consecutive errors
const RATE_LIMIT_DELAY_MS = 100; // 10 RPS (safe for $10+ balance)

async function getFiles(dir: string): Promise<string[]> {
	const files: string[] = [];
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			if (IGNORE_DIRS.includes(entry.name)) continue;
			files.push(...(await getFiles(fullPath)));
		} else if (entry.isFile()) {
			if (ALLOW_EXTS.some((ext) => entry.name.endsWith(ext))) {
				files.push(fullPath);
			}
		}
	}
	return files;
}

export async function cmdHarvest(args: string[]) {
	// Parse arguments
	let targetDir = process.cwd();
	const dirArg = args[0]; // First non-flag argument usually
	if (dirArg && !dirArg.startsWith("-")) targetDir = dirArg;

	log.info({ targetDir }, "Starting harvest...");

	try {
		const client = new LangExtractClient();
		if (!(await client.isAvailable())) {
			log.error(
				"LangExtract sidecar not available. Run 'amalfa setup-python' first.",
			);
			process.exit(1);
		}

		let allFiles: string[] = [];
		const stat = statSync(targetDir);

		if (stat.isFile()) {
			allFiles = [targetDir];
		} else {
			allFiles = await getFiles(targetDir);
		}

		log.info({ count: allFiles.length }, "Found files to harvest");

		// Track timing
		const startTime = Date.now();

		// Processing loop with concurrency
		let processed = 0;
		let hits = 0;
		let misses = 0;
		let skipped = 0;
		let errors = 0;
		let consecutiveErrors = 0;
		let _lastErrorMessage = "";

		// Track skipped files by reason
		const skippedFiles: {
			timeouts: string[];
			too_large: string[];
			errors: string[];
		} = {
			timeouts: [],
			too_large: [],
			errors: [],
		};

		const queue = [...allFiles];
		const workers = Array(CONCURRENCY)
			.fill(null)
			.map(async () => {
				while (queue.length > 0) {
					const filePath = queue.shift();
					if (!filePath) break;

					try {
						// 1. Guardrail: Check file size
						const stats = statSync(filePath);
						if (stats.size > MAX_FILE_SIZE) {
							// Check if cached anyway (maybe from previous run or manual)
							const content = readFileSync(filePath, "utf-8");
							if (client.checkCache(content)) {
								hits++;
							} else {
								skipped++;
								skippedFiles.too_large.push(filePath);
								log.warn(
									{ file: filePath, size: stats.size },
									"Skipping large file",
								);
								processed++;
								continue;
							}
							// If cached, we fall through to extract() which will return cached result quickly
						}

						const content = readFileSync(filePath, "utf-8");
						// We access the private cache via public extract method which handles the logic
						// But we want to know if it was a hit or miss.
						// The client doesn't expose hit/miss, so we rely on speed/logs?
						// Actually, we can just run it. The client logs hit/miss at DEBUG level.

						// Optimization: We could expose cache checking publicly on client,
						// but for now, just calling extract() is enough to populate the cache.

						const isCached = client.checkCache(content);
						if (isCached) hits++;
						else misses++;

						await client.extract(content);

						// Reset circuit breaker on success
						consecutiveErrors = 0;
						_lastErrorMessage = "";

						processed++;
						if (processed % 10 === 0) {
							process.stdout.write(
								`\rProgress: ${processed}/${allFiles.length} (Hits: ${hits}, Misses: ${misses})`,
							);
						}

						// Rate limiting: delay between requests
						if (!isCached) {
							await new Promise((resolve) =>
								setTimeout(resolve, RATE_LIMIT_DELAY_MS),
							);
						}
					} catch (e) {
						errors++;

						const errorMsg = e instanceof Error ? e.message : String(e);
						const isTimeout =
							errorMsg.includes("timeout") || errorMsg.includes("timed out");
						const isRateLimit =
							errorMsg.includes("401") || errorMsg.includes("429");

						// Timeouts are expected for complex files - skip and continue
						if (isTimeout) {
							skipped++;
							skippedFiles.timeouts.push(filePath);
							log.warn({ file: filePath, err: e }, "Timeout - skipping file");
							processed++;
							continue; // Don't count timeouts toward circuit breaker
						}

						// Other errors tracked for circuit breaker
						if (isRateLimit) {
							consecutiveErrors++;
							_lastErrorMessage = errorMsg;
						} else {
							skippedFiles.errors.push(filePath);
						}

						log.warn({ file: filePath, err: e }, "Failed to extract");

						// Circuit Breaker: Only abort on rate limit errors (systemic failure)
						if (consecutiveErrors >= CIRCUIT_BREAKER_THRESHOLD) {
							const errorType = errorMsg.includes("401")
								? "Authentication/Rate Limit"
								: errorMsg.includes("429")
									? "Rate Limit"
									: "Unknown";

							console.log("");
							console.log("\n🚨 Circuit Breaker Triggered!");
							console.log(`   Error Type: ${errorType}`);
							console.log(`   Consecutive Failures: ${consecutiveErrors}`);
							console.log(`   Last Error: ${errorMsg.substring(0, 100)}...`);
							console.log("\n💡 Recommendation:");
							if (
								errorType.includes("Rate Limit") ||
								errorType.includes("Authentication")
							) {
								console.log(
									"   - Check OpenRouter dashboard for rate limits or credit balance",
								);
								console.log("   - Verify OPENROUTER_API_KEY is valid");
								console.log("   - Wait a few minutes and retry");

								// Health check: Query OpenRouter API status
								if (process.env.OPENROUTER_API_KEY) {
									console.log("\n🔍 Checking OpenRouter account status...");
									try {
										const healthCheck = Bun.spawnSync([
											"curl",
											"-s",
											"-H",
											`Authorization: Bearer ${process.env.OPENROUTER_API_KEY}`,
											"https://openrouter.ai/api/v1/key",
										]);
										if (healthCheck.exitCode === 0) {
											const response = JSON.parse(
												healthCheck.stdout.toString(),
											);
											if (response.data) {
												console.log(
													`   Balance: $${response.data.limit?.toFixed(2) || "N/A"}`,
												);
												console.log(
													`   Used Today: $${response.data.usage?.toFixed(2) || "N/A"}`,
												);
												console.log(
													`   Free Tier: ${response.data.is_free_tier ? "Yes" : "No"}`,
												);
												if (response.data.rate_limit) {
													console.log(
														`   Rate Limit: ${response.data.rate_limit.requests}/${response.data.rate_limit.interval}`,
													);
												}
											}
										}
									} catch (_err) {
										console.log("   (Could not fetch account status)");
									}
								}
							} else if ((errorType as string) === "Timeout") {
								console.log("   - Files may be too large for processing");
								console.log("   - Consider reducing MAX_FILE_SIZE");
							} else {
								console.log("   - Check network connectivity");
								console.log("   - Review error logs above");
							}
							console.log("\n⏸️  Harvest paused. Progress saved to cache.");
							console.log(
								"   Re-run 'amalfa harvest' to resume from where you left off.\n",
							);

							await client.close();
							process.exit(1);
						}
					}
				}
			});

		await Promise.all(workers);
		await client.close();

		// Save skipped files manifest
		const manifestPath = ".amalfa/harvest-skipped.json";
		await writeFile(manifestPath, JSON.stringify(skippedFiles, null, 2));

		// Send desktop notification
		const totalSkipped =
			skippedFiles.timeouts.length +
			skippedFiles.too_large.length +
			skippedFiles.errors.length;
		const notificationTitle = "Harvest Complete";
		const notificationMessage = `Processed: ${allFiles.length} | Cached: ${hits} | New: ${misses} | Skipped: ${totalSkipped}`;

		try {
			// macOS notification using osascript
			Bun.spawnSync([
				"osascript",
				"-e",
				`display notification "${notificationMessage}" with title "${notificationTitle}"`,
			]);
		} catch (_err) {
			// Notification failed, not critical
		}

		console.log("");
		console.log("Harvest Complete:");
		console.log(`  Files Scanned: ${allFiles.length}`);
		console.log(`  Cache Hits: ${hits}`);
		console.log(`  Cache Misses: ${misses} (API Calls)`);
		console.log(
			`  Skipped: ${skipped} (${skippedFiles.timeouts.length} timeouts, ${skippedFiles.too_large.length} too large)`,
		);
		console.log(`  Errors: ${errors}`);
		if (totalSkipped > 0) {
			console.log(`\n  Skipped files saved to: ${manifestPath}`);
		}
		console.log("");

		// Log stats to history
		const duration_ms = Date.now() - startTime;
		StatsLogger.logHarvest({
			files: allFiles.length,
			hits,
			misses,
			skipped: totalSkipped,
			errors,
			duration_ms,
		});
	} catch (e) {
		log.error({ err: e }, "Harvest failed");
		process.exit(1);
	} finally {
		process.exit(0);
	}
}
