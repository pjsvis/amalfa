import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ResonanceDB } from "./db";

export class SemanticDB extends ResonanceDB {
  /**
   * @param dbPath - Absolute path to the SQLite database file
   */
  constructor(dbPath: string) {
    // Ensure parent directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // If file doesn't exist, create an empty one so ResonanceDB constructor doesn't throw
    if (!existsSync(dbPath)) {
      const emptyDb = new (require("bun:sqlite").Database)(dbPath);
      emptyDb.close();
    }

    super(dbPath);
  }
}
