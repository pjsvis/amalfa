import { getLogger } from "@src/utils/Logger";
import { LangExtractClient } from "@src/services/LangExtractClient";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { statSync, readFileSync } from "node:fs";

const log = getLogger("CLI:Harvest");

// Ignore list
const IGNORE_DIRS = ["node_modules", ".git", ".amalfa", "dist", "out"];
const ALLOW_EXTS = [".ts", ".tsx", ".md"];
const CONCURRENCY = 1;

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

		// Processing loop with concurrency
		let processed = 0;
		let hits = 0;
		let misses = 0;
		let errors = 0;

		const queue = [...allFiles];
		const workers = Array(CONCURRENCY)
			.fill(null)
			.map(async () => {
				while (queue.length > 0) {
					const filePath = queue.shift();
					if (!filePath) break;

					try {
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

						processed++;
						if (processed % 10 === 0) {
							process.stdout.write(
								`\rProgress: ${processed}/${allFiles.length} (Hits: ${hits}, Misses: ${misses})`,
							);
						}
					} catch (e) {
						errors++;
						log.warn({ file: filePath, err: e }, "Failed to extract");
					}
				}
			});

		await Promise.all(workers);
		await client.close();

		console.log("");
		console.log("Harvest Complete:");
		console.log(`  Files Scanned: ${allFiles.length}`);
		console.log(`  Cache Hits: ${hits}`);
		console.log(`  Cache Misses: ${misses} (API Calls)`);
		console.log(`  Errors: ${errors}`);
		console.log("");
	} catch (e) {
		log.error({ err: e }, "Harvest failed");
		process.exit(1);
	} finally {
		process.exit(0);
	}
}
