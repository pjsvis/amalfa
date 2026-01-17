/**
 * Project Root Detection
 *
 * Detects the project root by searching upward for markers:
 * - amalfa.config.json or amalfa.config.ts
 * - .git directory
 *
 * This enables root-relative path storage in the database,
 * making it portable across directory moves.
 */

import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT_MARKERS = [
	"amalfa.config.json",
	"amalfa.config.ts",
	".git",
	"package.json", // Fallback for npm/bun projects
];

let cachedRoot: string | null = null;

/**
 * Detect project root by searching upward for marker files/dirs.
 *
 * @param startPath - Starting directory (defaults to process.cwd())
 * @returns Absolute path to project root
 * @throws Error if root cannot be found
 */
export function detectProjectRoot(startPath: string = process.cwd()): string {
	// Return cached result if available
	if (cachedRoot) {
		return cachedRoot;
	}

	let currentDir = resolve(startPath);
	const rootDir = "/"; // Stop at filesystem root

	while (currentDir !== rootDir) {
		// Check for any marker file/directory
		for (const marker of ROOT_MARKERS) {
			const markerPath = join(currentDir, marker);
			if (existsSync(markerPath)) {
				cachedRoot = currentDir;
				return currentDir;
			}
		}

		// Move up one directory
		const parentDir = dirname(currentDir);
		if (parentDir === currentDir) {
			// Reached filesystem root without finding marker
			break;
		}
		currentDir = parentDir;
	}

	throw new Error(
		`Could not detect project root. Searched upward from ${startPath} for: ${ROOT_MARKERS.join(", ")}`,
	);
}

/**
 * Clear cached project root (useful for testing).
 */
export function clearProjectRootCache(): void {
	cachedRoot = null;
}

/**
 * Convert absolute path to root-relative path.
 *
 * @param absolutePath - Absolute file path
 * @param projectRoot - Project root (defaults to detected root)
 * @returns Relative path from project root
 */
export function toRootRelative(
	absolutePath: string,
	projectRoot?: string,
): string {
	const root = projectRoot || detectProjectRoot();
	const absPath = resolve(absolutePath);

	// Ensure path is within project
	if (!absPath.startsWith(root)) {
		throw new Error(
			`Path ${absPath} is outside project root ${root}. Cannot create relative path.`,
		);
	}

	// Remove root prefix and leading slash
	const relativePath = absPath.slice(root.length);
	return relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
}

/**
 * Convert root-relative path to absolute path.
 *
 * @param relativePath - Path relative to project root
 * @param projectRoot - Project root (defaults to detected root)
 * @returns Absolute file path
 */
export function fromRootRelative(
	relativePath: string,
	projectRoot?: string,
): string {
	const root = projectRoot || detectProjectRoot();
	return join(root, relativePath);
}
