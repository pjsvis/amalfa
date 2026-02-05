/**
 * Path Utilities
 *
 * Simple, reliable path resolution using project markers.
 * Uses import.meta.dir for Bun-compatible base path detection.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";

const MARKERS = ["package.json", "amalfa.settings.json"];

export function findProjectRoot(startDir?: string): string | null {
  let current = startDir || import.meta.dir;

  for (let i = 0; i < 20; i++) {
    for (const marker of MARKERS) {
      if (existsSync(join(current, marker))) {
        return current;
      }
    }

    const parent = join(current, "..");
    if (parent === current) break;
    current = parent;
  }

  return null;
}

export const PROJECT_ROOT = findProjectRoot();

export function resolvePath(...segments: string[]): string {
  if (!PROJECT_ROOT) {
    throw new Error("Could not find project root (no marker file found)");
  }
  return join(PROJECT_ROOT, ...segments);
}

export default { PROJECT_ROOT, resolvePath };
