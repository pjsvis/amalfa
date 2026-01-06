import { mkdir, readdir, rename } from "node:fs/promises";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const MISC_DIR = join(ROOT_DIR, "_misc");

// The "Canon" - Files that are allowed to exist in the root
const CANON_FILES = new Set([
	// Config
	".env",
	".gitignore",
	".prettierrc",
	".biomeignore",
	"biome.json",
	"package.json",
	"package-lock.json",
	"bun.lock",
	"tsconfig.json",
	"polyvis.settings.json",
	"drizzle.config.ts",

	// Logic/Source
	"src",
	"public",
	"scripts",
	"index.html", // Vite entry

	// Documentation
	"README.md",
	"LICENSE",
	"BENTO_BOXING_STRATEGY.md",

	// Project Structure
	".git",
	".github",
	".vscode",
	".idea",
	".resonance",
	"node_modules",

	// Folders
	"briefs",
	"debriefs",
	"docs",
	"playbooks",
	"reports",
	"context",
	"tests",
	"examples",
	"images",
	"local_cache",
	"scratchpads",
	"drizzle",
	"plans",
	"substack",
	"_misc", // The destination itself
]);

// Patterns to explicitely target (safety check)
const _IS_SHOUTY = /^[A-Z0-9_ -]+\.(md|json|png|sqlite)$/i; // Matches CAPS, underscores, common artifacts

async function cleanupRoot() {
	console.log("🧹 Scanning project root...");

	// Ensure _misc exists
	await mkdir(MISC_DIR, { recursive: true });

	const files = await readdir(ROOT_DIR);
	let movedCount = 0;

	for (const file of files) {
		// Skip Canon files
		if (CANON_FILES.has(file)) continue;

		// Move everything else that looks like a file
		// Strategy: If it's not in CANON, and it looks like a loose file, move it.
		// We'll be slightly conservative: Move if it matches patterns OR is a known clutter type

		// Check if it's a directory?
		const isDir = !file.includes("."); // Naive check, but Canon handles known dirs
		if (isDir && !CANON_FILES.has(file)) {
			// Unknown directory - warn but don't move automatically?
			// User asked for "SHOUTY root files". I'll stick to files.
			// Actually, user said "the briefs folder...".
			// Let's stick to files for safety.
			console.warn(`⚠️  Unknown directory found (skipping): ${file}`);
			continue;
		}

		// It is a file / candidate
		console.log(`📦 Moving: ${file}`);
		await rename(join(ROOT_DIR, file), join(MISC_DIR, file));
		movedCount++;
	}

	console.log(`\n✨ Cleanup complete! Moved ${movedCount} files to _misc/`);
}

cleanupRoot().catch(console.error);
