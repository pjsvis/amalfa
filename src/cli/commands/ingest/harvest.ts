import { readFileSync, statSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { LangExtractClient } from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";
import { StatsLogger } from "@src/utils/StatsLogger";
import { defineCommand } from "citty";

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

export const harvestCommand = defineCommand({
  meta: {
    name: "harvest",
    description: "Harvest semantic triples from source files using LangExtract",
  },
  args: {
    dir: {
      type: "positional",
      description: "Target directory to harvest",
      required: false,
    },
  },
  async run({ args }) {
    const targetDir = args.dir || process.cwd();

    log.info({ targetDir }, "Starting harvest...");

    try {
      const client = new LangExtractClient();
      if (!(await client.isAvailable())) {
        log.error(
          "LangExtract sidecar not available. Run 'amalfa config setup-python' first.",
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
      let skippedCount = 0;
      let errorsCount = 0;
      let consecutiveErrors = 0;

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
                const content = readFileSync(filePath, "utf-8");
                if (client.checkCache(content)) {
                  hits++;
                } else {
                  skippedCount++;
                  skippedFiles.too_large.push(filePath);
                  log.warn(
                    { file: filePath, size: stats.size },
                    "Skipping large file",
                  );
                  processed++;
                  continue;
                }
              }

              const content = readFileSync(filePath, "utf-8");
              const isCached = client.checkCache(content);
              if (isCached) hits++;
              else misses++;

              await client.extract(content);

              // Reset circuit breaker on success
              consecutiveErrors = 0;

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
              errorsCount++;

              const errorMsg = e instanceof Error ? e.message : String(e);
              const isTimeout =
                errorMsg.includes("timeout") || errorMsg.includes("timed out");
              const isRateLimit =
                errorMsg.includes("401") || errorMsg.includes("429");

              if (isTimeout) {
                skippedCount++;
                skippedFiles.timeouts.push(filePath);
                log.warn({ file: filePath, err: e }, "Timeout - skipping file");
                processed++;
                continue;
              }

              if (isRateLimit) {
                consecutiveErrors++;
              } else {
                skippedFiles.errors.push(filePath);
              }

              log.warn({ file: filePath, err: e }, "Failed to extract");

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

      const totalSkipped =
        skippedFiles.timeouts.length +
        skippedFiles.too_large.length +
        skippedFiles.errors.length;

      console.log("");
      console.log("Harvest Complete:");
      console.log(`  Files Scanned: ${allFiles.length}`);
      console.log(`  Cache Hits: ${hits}`);
      console.log(`  Cache Misses: ${misses} (API Calls)`);
      console.log(
        `  Skipped: ${skippedCount} (${skippedFiles.timeouts.length} timeouts, ${skippedFiles.too_large.length} too large)`,
      );
      console.log(`  Errors: ${errorsCount}`);
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
        errors: errorsCount,
        duration_ms,
      });
    } catch (e) {
      log.error({ err: e }, "Harvest failed");
      process.exit(1);
    }
  },
});

// Legacy export
export async function cmdHarvest(args: string[]) {
  if (harvestCommand.run) {
    return harvestCommand.run({
      rawArgs: args,
      args: { _: args, dir: args[0] } as any,
      cmd: harvestCommand,
      data: {},
    });
  }
}
