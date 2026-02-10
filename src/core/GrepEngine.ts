import type { Database } from "bun:sqlite";
import { getLogger } from "@src/utils/Logger";
import { spawn } from "bun";

const log = getLogger("GrepEngine");

export interface GrepResult {
  id: string; // The Node ID (derived from filepath)
  path: string;
  line: number;
  content: string;
  score: number; // Artificial score for ranking before fusion (1.0 for exact matches)
}

/**
 * GrepEngine - The "Left Brain" Surveyor.
 * Wraps 'ripgrep' (rg) or 'grep' to find exact symbol matches in the file system.
 */
export class GrepEngine {
  private hasRipgrep = false;
  private db: Database | null = null;
  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.checkAvailability();
  }

  /**
   * Set the database connection for ID resolution.
   */
  setDb(db: Database) {
    this.db = db;
  }

  // Deprecated: No-op for backward compatibility if needed, or just remove usage.
  async load(db: Database) {
    this.setDb(db);
  }

  private async checkAvailability() {
    try {
      const proc = spawn(["rg", "--version"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const exitCode = await proc.exited;
      this.hasRipgrep = exitCode === 0;
    } catch {
      this.hasRipgrep = false;
    }
    log.info({ hasRipgrep: this.hasRipgrep }, "GrepEngine initialized");
  }

  /**
   * Search the filesystem for the query string.
   */ async search(query: string, limit = 50): Promise<GrepResult[]> {
    await this.initPromise; // Ensure we know which tool to use

    if (!query || query.length < 3) return []; // Ignore very short queries
    if (!this.db) {
      log.warn("GrepEngine: Database not set, cannot resolve IDs");
      return [];
    }

    // Determine command
    const cmd = this.hasRipgrep ? "rg" : "grep";
    // Exclude heavy directories
    const ignores = this.hasRipgrep
      ? [
          "--glob",
          "!**/node_modules/**",
          "--glob",
          "!**/.git/**",
          "--glob",
          "!**/.amalfa/**",
        ]
      : [
          "--exclude-dir=node_modules",
          "--exclude-dir=.git",
          "--exclude-dir=.amalfa",
        ];

    const args = this.hasRipgrep
      ? [
          cmd,
          "-i",
          "-n",
          "--max-count=1",
          "--max-columns=200",
          ...ignores,
          query,
          ".",
        ]
      : [cmd, "-r", "-i", "-n", "-m", "1", ...ignores, query, "."];

    const rawResults: { path: string; line: number; content: string }[] = [];
    const start = Date.now();

    try {
      const proc = spawn(args, {
        stdout: "pipe",
        stderr: "pipe",
      });

      const output = await new Response(proc.stdout).text();
      const lines = output.split("\n");

      for (const line of lines) {
        if (rawResults.length >= limit) break;
        if (!line.trim()) continue;

        const parts = line.split(":");
        if (parts.length < 3) continue;

        // biome-ignore lint/style/noNonNullAssertion: checked length above
        const filePath = parts[0]!;
        // biome-ignore lint/style/noNonNullAssertion: checked length above
        const lineNum = parseInt(parts[1]!, 10);
        const content = parts.slice(2).join(":").trim();

        rawResults.push({ path: filePath, line: lineNum, content });
      }

      // Bulk resolve IDs
      const resolved = this.resolveIds(rawResults.map((r) => r.path));

      const results: GrepResult[] = [];
      for (const r of rawResults) {
        const id = resolved.get(r.path);
        if (id) {
          results.push({
            id,
            path: r.path,
            line: r.line,
            content: r.content,
            score: 1.0,
          });
        }
      }

      log.info(
        {
          query,
          found: results.length,
          tool: cmd,
          elapsedMs: Date.now() - start,
        },
        "Grep search complete",
      );

      return results;
    } catch (e) {
      log.error({ err: e }, "Grep search failed");
      return [];
    }
  }

  /**
   * Resolve a list of file paths to Node IDs using the database.
   */
  private resolveIds(paths: string[]): Map<string, string> {
    const map = new Map<string, string>();
    if (!this.db || paths.length === 0) return map;

    // We use a parameterized query to find nodes where meta->source matches any of our paths
    // Since we can't easily do "WHERE meta->source IN (...)" efficiently for JSON,
    // and we iterate per path anyway in application logic, let's try a batch approach or iterative.
    // Iterative is safest for SQLite JSON.

    // Optimization: Pre-prepare the statement
    const stmt = this.db.prepare(
      "SELECT id FROM nodes WHERE json_extract(meta, '$.source') = ?",
    );

    for (const p of paths) {
      // Try relative path (as returned by rg)
      const row = stmt.get(p) as { id: string } | null;
      if (row) {
        map.set(p, row.id);
      }

      // Try absolute path
      // (Assuming DB might store absolute paths, though usually relative is preferred)
      // const abs = Bun.resolveSync(p, process.cwd());
      // row = stmt.get(abs) as { id: string } | null;
      // if (row) map.set(p, row.id);
    }

    return map;
  }
}
