import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Reuse the type, though we treat data as opaque JSON
import type { ExtractedGraph } from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";

const log = getLogger("HarvesterCache");

export class HarvesterCache {
  private cacheDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.cacheDir = join(baseDir, ".amalfa/cache/lang-extract");
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate SHA-256 hash of content
   */
  public hash(content: string): string {
    return createHash("sha256").update(content).digest("hex");
  }

  /**
   * Get cached extraction result
   */
  public get(contentHash: string): ExtractedGraph | null {
    const filePath = join(this.cacheDir, `${contentHash}.json`);
    if (existsSync(filePath)) {
      try {
        const raw = readFileSync(filePath, "utf-8");
        return JSON.parse(raw);
      } catch (err) {
        log.warn({ err, hash: contentHash }, "Failed to read cache file");
        return null; // Corrupt cache counts as miss
      }
    }
    return null;
  }

  /**
   * Set cache extraction result
   * Writes atomically by writing to temporary file then renaming
   */
  public set(contentHash: string, data: ExtractedGraph): void {
    const filePath = join(this.cacheDir, `${contentHash}.json`);
    const tempPath = join(this.cacheDir, `${contentHash}.tmp`);

    try {
      // Atomic write pattern
      writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
      // Rename is atomic on POSIX
      const rename = Bun.spawnSync(["mv", tempPath, filePath]);
      if (rename.exitCode !== 0) {
        log.error("Failed to rename atomic cache file");
      }
    } catch (err) {
      log.error({ err, hash: contentHash }, "Failed to write cache file");
    }
  }

  public has(contentHash: string): boolean {
    return existsSync(join(this.cacheDir, `${contentHash}.json`));
  }
}
