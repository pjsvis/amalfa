import { appendFileSync, existsSync, writeFileSync } from "node:fs";

const RUNS_FILE = ".amalfa/runs.jsonl";

export interface RunStats {
  timestamp: string;
  operation: "harvest" | "init" | "squash";
  files_processed?: number;
  cache_hits?: number;
  cache_misses?: number;
  skipped?: number;
  errors?: number;
  duration_ms?: number;
  cost_usd?: number;
  nodes?: number;
  edges?: number;
}

export class StatsLogger {
  /**
   * Log a completed operation to the runs history
   */
  static logRun(stats: RunStats) {
    // Ensure timestamp is set
    if (!stats.timestamp) {
      stats.timestamp = new Date().toISOString();
    }

    // Create file if it doesn't exist
    if (!existsSync(RUNS_FILE)) {
      writeFileSync(RUNS_FILE, "");
    }

    // Append as JSONL
    appendFileSync(RUNS_FILE, `${JSON.stringify(stats)}\n`);
  }

  /**
   * Log harvest completion
   */
  static logHarvest(stats: {
    files: number;
    hits: number;
    misses: number;
    skipped: number;
    errors: number;
    duration_ms: number;
  }) {
    StatsLogger.logRun({
      timestamp: new Date().toISOString(),
      operation: "harvest",
      files_processed: stats.files,
      cache_hits: stats.hits,
      cache_misses: stats.misses,
      skipped: stats.skipped,
      errors: stats.errors,
      duration_ms: stats.duration_ms,
      // Rough cost estimate: $0.001 per API call
      cost_usd: stats.misses * 0.001,
    });
  }

  /**
   * Log init/ingestion completion
   */
  static logInit(stats: {
    files: number;
    nodes: number;
    edges: number;
    duration_ms: number;
    errors: number;
  }) {
    StatsLogger.logRun({
      timestamp: new Date().toISOString(),
      operation: "init",
      files_processed: stats.files,
      nodes: stats.nodes,
      edges: stats.edges,
      duration_ms: stats.duration_ms,
      errors: stats.errors,
    });
  }
}
