/**
 * Code-Canon Relevance Test (10 Entity Sample)
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "child_process";
import { readFileSync, existsSync } from "fs";

async function testCodeCanonRelevance() {
	console.log("⚖️ CODE-CANON RELEVANCE TEST");
	console.log("============================\n");
	
	// Test entities: mix of obvious active, obvious deprecated, and unclear
	const testEntities = [
		'fafcas',                    // Should be active (core protocol)
		'tinydolphin',               // Should be deprecated (replaced model)
		'HfBgeReranker',             // Should be active (current reranker)
		'HfBgeReranker',             // Should be active (current impl)
		'amalfa',                    // Should be active (project name)
		'resonancedb',               // Should be active (core DB)
		'ollama',                    // Should be active (current AI provider)
		'adam-smith',                // Should be deprecated (Edinburgh Protocol concept)
		'embeddings',                // Should be active (core concept)
		'claude'                     // Should be deprecated (specific AI model)
	];
	
	console.log("Testing 10 entities against current codebase...\n");
	
	// Load canonical sources
	const canonicalSources = await loadCanonicalSources();
	
	console.log(`📂 Canonical Sources Loaded:`);
	console.log(`   src/ files: ${canonicalSources.srcFiles} files`);
	console.log(`   Config files: ${canonicalSources.configFiles.length} files`);
	console.log(`   Total canonical chars: ${canonicalSources.totalChars.toLocaleString()}\n`);
	
	// Test each entity
	for (const entity of testEntities) {
		const analysis = analyzeEntityCanonical(entity, canonicalSources);
		
		console.log(`${analysis.classification.toUpperCase().padEnd(10)} | ${entity.padEnd(25)} | ${analysis.evidence.join(', ')}`);
		console.log(`${''.padEnd(10)} | ${''.padEnd(25)} | ${analysis.reason}`);
		
		// Show specific matches for interesting cases
		if (analysis.matches.length > 0) {
			console.log(`${''.padEnd(10)} | ${''.padEnd(25)} | Matches: ${analysis.matches.slice(0, 3).join(', ')}`);
		}
		console.log('');
	}
}

function analyzeEntityCanonical(entity: string, sources: any) {
	const entityLower = entity.toLowerCase();
	const entityVariations = [
		entity,
		entityLower,
		entity.replace(/-/g, ''),
		entity.replace(/-/g, '').toLowerCase()
	];
	
	const matches = [];
	const evidence = [];
	
	// Check src/ code (PRIMARY CANON)
	let inSrcCode = false;
	for (const variation of entityVariations) {
		if (sources.srcContent.includes(variation)) {
			inSrcCode = true;
			matches.push(`src:${variation}`);
			break;
		}
	}
	if (inSrcCode) evidence.push('src-code');
	
	// Check imports specifically (HIGH CONFIDENCE)
	let inImports = false;
	for (const variation of entityVariations) {
		if (sources.srcContent.includes(`import.*${variation}`) || 
		    sources.srcContent.includes(`from.*${variation}`)) {
			inImports = true;
			matches.push(`import:${variation}`);
			break;
		}
	}
	if (inImports) evidence.push('imports');
	
	// Check configuration (SECONDARY CANON)
	let inConfig = false;
	for (const variation of entityVariations) {
		if (sources.configContent.includes(variation)) {
			inConfig = true;
			matches.push(`config:${variation}`);
			break;
		}
	}
	if (inConfig) evidence.push('config');
	
	// Check package.json scripts (OPERATIONAL CANON)
	let inScripts = false;
	for (const variation of entityVariations) {
		if (sources.packageJson.includes(variation)) {
			inScripts = true;
			matches.push(`scripts:${variation}`);
			break;
		}
	}
	if (inScripts) evidence.push('scripts');
	
	// Check system files (README, AGENTS.md)
	let inSystemFiles = false;
	for (const variation of entityVariations) {
		if (sources.systemFiles.includes(variation)) {
			inSystemFiles = true;
			matches.push(`system:${variation}`);
			break;
		}
	}
	if (inSystemFiles) evidence.push('system-files');
	
	// Classification
	let classification: 'active' | 'unused';
	let reason: string;
	
	if (inSrcCode || inImports) {
		classification = 'active';
		reason = `Found in active source code`;
	} else if (inConfig || inScripts) {
		classification = 'active'; 
		reason = `Found in operational configuration`;
	} else if (inSystemFiles) {
		classification = 'active';
		reason = `Found in system documentation`;
	} else {
		classification = 'unused';
		reason = `Not found in any canonical sources`;
	}
	
	return {
		entity,
		classification,
		evidence,
		reason,
		matches,
		hasCanonicalUsage: evidence.length > 0
	};
}

async function loadCanonicalSources() {
	// Load all current src/ TypeScript files
	const tsResult = spawnSync("find", ["src/", "-name", "*.ts", "-type", "f"], { encoding: "utf8" });
	const tsFiles = tsResult.stdout.trim().split('\n').filter(f => f && existsSync(f));
	
	let srcContent = '';
	for (const file of tsFiles) {
		srcContent += readFileSync(file, 'utf8').toLowerCase() + ' ';
	}
	
	// Load configuration files
	const configFiles = ['amalfa.settings.json', 'package.json', '_CURRENT_TASK.md'];
	let configContent = '';
	let packageJson = '';
	
	for (const file of configFiles) {
		if (existsSync(file)) {
			const content = readFileSync(file, 'utf8').toLowerCase();
			configContent += content + ' ';
			if (file === 'package.json') {
				packageJson = content;
			}
		}
	}
	
	// Load system files
	const systemFiles = ['README.md', 'AGENTS.md'];
	let systemFileContent = '';
	for (const file of systemFiles) {
		if (existsSync(file)) {
			systemFileContent += readFileSync(file, 'utf8').toLowerCase() + ' ';
		}
	}
	
	return {
		srcContent,
		configContent,
		packageJson,
		systemFiles: systemFileContent,
		srcFiles: tsFiles.length,
		configFiles,
		totalChars: srcContent.length + configContent.length + systemFileContent.length
	};
}

testCodeCanonRelevance().catch(console.error);