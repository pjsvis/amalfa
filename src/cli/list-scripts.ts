#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// Registry is now in src/config, relative to src/cli is ../config
const REGISTRY_PATH = join(__dirname, "../config/scripts-registry.json");

interface ScriptEntry {
	path: string;
	command: string;
	description: string;
	category: string;
	type: "user" | "dev";
}

function loadRegistry(): ScriptEntry[] {
	if (!existsSync(REGISTRY_PATH)) {
		console.error(`❌ Registry not found at: ${REGISTRY_PATH}`);
		process.exit(1);
	}
	return JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
}

function printScripts() {
	const scripts = loadRegistry();
	const grouped: Record<string, ScriptEntry[]> = {};

	// Detect environment
	// If "scripts" folder exists in root, we are likely in the repo (Dev Mode)
	// Logic: __dirname is src/cli/. Root is ../..
	const rootDir = join(__dirname, "../../");
	const scriptsDir = join(rootDir, "scripts");
	const isDevMode = existsSync(scriptsDir);

	// Group by category, filtering if needed
	for (const s of scripts) {
		if (!isDevMode && s.type === "dev") continue;

		if (!grouped[s.category]) grouped[s.category] = [];
		grouped[s.category]?.push(s);
	}

	console.log("\n📜 AMALFA Command Registry\n");
	if (isDevMode) {
		console.log("🛠️  Development Mode Detected (showing all repo scripts)\n");
	} else {
		console.log("📦 Production Mode (showing user commands)\n");
	}

	const categories = Object.keys(grouped).sort();

	for (const cat of categories) {
		console.log(`[${cat.toUpperCase()}]`);
		const catScripts = grouped[cat];
		if (catScripts) {
			for (const script of catScripts) {
				console.log(`  $ ${script.command}`);
				console.log(`    ${script.description}`);
				console.log("");
			}
		}
	}
}

printScripts();
