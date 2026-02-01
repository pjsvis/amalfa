/**
 * Usage-First Relevance Classification
 * Check actual codebase usage before document analysis
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { getDbPath } from "@src/cli/utils";

async function usageFirstClassification() {
	console.log("📋 USAGE-FIRST RELEVANCE CLASSIFICATION");
	console.log("======================================\n");
	
	const dbPath = await getDbPath();
	const db = new Database(dbPath);
	
	// Get all lexicon entities
	const entities = db.query("SELECT id FROM nodes WHERE domain = 'lexicon' ORDER BY id").all() as any[];
	console.log(`Analyzing ${entities.length} entities...\n`);
	
	// Load current codebase and config content for usage checking
	const currentContent = await loadCurrentContent();
	
	const results = [];
	let processed = 0;
	
	for (const entity of entities.slice(0, 50)) { // Test first 50
		const classification = analyzeEntityUsage(entity.id, currentContent);
		results.push(classification);
		
		console.log(`${classification.classification.padEnd(12)} | ${entity.id.padEnd(30)} | ${classification.reason.substring(0, 60)}`);
		
		processed++;
	}
	
	console.log(`\nProcessed ${processed} entities`);
	
	// Summary
	const summary = {
		active: results.filter(r => r.classification === 'active').length,
		deprecated: results.filter(r => r.classification === 'deprecated').length,
		unknown: results.filter(r => r.classification === 'unknown').length
	};
	
	console.log(`\n📊 Usage-First Results:`);
	console.log(`   Active: ${summary.active} (${(summary.active/results.length*100).toFixed(1)}%)`);
	console.log(`   Deprecated: ${summary.deprecated} (${(summary.deprecated/results.length*100).toFixed(1)}%)`);
	console.log(`   Unknown: ${summary.unknown} (${(summary.unknown/results.length*100).toFixed(1)}%)`);
	
	db.close();
	return results;
}

function analyzeEntityUsage(entityId: string, currentContent: any) {
	const entity = entityId.toLowerCase();
	
	// Check current usage in code
	const inCurrentCode = currentContent.typescript.includes(entity) || 
	                     currentContent.typescript.includes(entityId);
	
	// Check current config
	const inCurrentConfig = currentContent.config.includes(entity) ||
	                       currentContent.config.includes(entityId);
	
	// Check system files (README, AGENTS.md, etc.)
	const inSystemFiles = currentContent.system.includes(entity) ||
	                     currentContent.system.includes(entityId);
	
	// Check package.json scripts
	const inScripts = currentContent.scripts.includes(entity) ||
	                 currentContent.scripts.includes(entityId);
	
	// Classification logic
	if (inCurrentCode || inCurrentConfig || inSystemFiles) {
		return {
			entity: entityId,
			classification: 'active' as const,
			reason: `Found in: ${[
				inCurrentCode && 'code',
				inCurrentConfig && 'config', 
				inSystemFiles && 'system',
				inScripts && 'scripts'
			].filter(Boolean).join(', ')}`,
			evidence: {
				code: inCurrentCode,
				config: inCurrentConfig,
				system: inSystemFiles,
				scripts: inScripts
			}
		};
	}
	
	if (inScripts) {
		return {
			entity: entityId,
			classification: 'active' as const,
			reason: 'Found in package.json scripts',
			evidence: { scripts: true }
		};
	}
	
	return {
		entity: entityId,
		classification: 'unknown' as const,
		reason: 'No current usage detected',
		evidence: {}
	};
}

async function loadCurrentContent() {
	console.log("📂 Loading current codebase content...");
	
	// Current TypeScript files
	const tsResult = spawnSync("find", ["src/", "-name", "*.ts", "-type", "f"], { encoding: "utf8" });
	const tsFiles = tsResult.stdout.trim().split('\n').filter(f => f);
	
	let typescriptContent = '';
	for (const file of tsFiles.slice(0, 20)) { // Sample of current files
		if (existsSync(file)) {
			typescriptContent += readFileSync(file, 'utf8').toLowerCase();
		}
	}
	
	// Current configuration
	const configFiles = ['amalfa.settings.json', 'package.json', '_CURRENT_TASK.md'];
	let configContent = '';
	for (const file of configFiles) {
		if (existsSync(file)) {
			configContent += readFileSync(file, 'utf8').toLowerCase();
		}
	}
	
	// System files
	const systemFiles = ['README.md', 'AGENTS.md'];
	let systemContent = '';
	for (const file of systemFiles) {
		if (existsSync(file)) {
			systemContent += readFileSync(file, 'utf8').toLowerCase();
		}
	}
	
	console.log(`   TypeScript files: ${tsFiles.length} files loaded`);
	console.log(`   Config content: ${configContent.length} chars`);
	console.log(`   System content: ${systemContent.length} chars`);
	
	return {
		typescript: typescriptContent,
		config: configContent,
		system: systemContent,
		scripts: configContent // package.json included in config
	};
}

usageFirstClassification().catch(console.error);