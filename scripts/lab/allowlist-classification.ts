import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";

const CURRENT_USAGE_ALLOWLIST = [
  'src/',
  'tests/',
  'package.json',
  'amalfa.settings.json', 
  'AGENTS.md',
  'README.md',
  '_CURRENT_TASK.md'
];

async function allowlistClassification() {
  console.log("✅ ALLOWLIST CLASSIFICATION TEST");
  console.log("================================\n");
  
  const testEntities = [
    'fafcas',                    
    'tinydolphin',               
    'HfBgeReranker',             
    'amalfa',                    
    'resonancedb',               
    'ollama',                    
    'adam-smith',                
    'embeddings',                
    'claude'                     
  ];
  
  // Load allowlisted content
  const allowlistedContent = await loadAllowlistedContent();
  
  console.log("📋 Classification Results:");
  console.log("RELEVANCE | ENTITY                    | EVIDENCE\n");
  
  for (const entity of testEntities) {
    const result = classifyEntityAllowlist(entity, allowlistedContent);
    
    console.log(`${result.classification.toUpperCase().padEnd(9)} | ${entity.padEnd(25)} | ${result.evidence.join(', ') || 'none'}`);
    if (result.specificMatches.length > 0) {
      console.log(`${''.padEnd(9)} | ${''.padEnd(25)} | → ${result.specificMatches.slice(0, 2).join(', ')}`);
    }
  }
}

function classifyEntityAllowlist(entity: string, content: any) {
  const entityLower = entity.toLowerCase();
  const variations = [entity, entityLower, entity.replace(/-/g, ''), entity.replace(/-/g, '').toLowerCase()];
  
  const evidence = [];
  const specificMatches = [];
  
  // Check each allowlisted source
  for (const source of Object.keys(content)) {
    const sourceContent = content[source];
    
    for (const variation of variations) {
      if (sourceContent.includes(variation)) {
        evidence.push(source);
        specificMatches.push(`${source}:${variation}`);
        break; // Found in this source, move to next
      }
    }
  }
  
  return {
    entity,
    classification: evidence.length > 0 ? 'active' : 'unused',
    evidence: [...new Set(evidence)], // Remove duplicates
    specificMatches
  };
}

async function loadAllowlistedContent() {
  console.log("📂 Loading allowlisted content...\n");
  
  const content = {};
  
  // Load src/ files
  const tsResult = spawnSync("find", ["src/", "-name", "*.ts", "-type", "f"], { encoding: "utf8" });
  const tsFiles = tsResult.stdout.trim().split('\n').filter(f => f && existsSync(f));
  
  let srcContent = '';
  for (const file of tsFiles) {
    srcContent += readFileSync(file, 'utf8').toLowerCase() + ' ';
  }
  content['src'] = srcContent;
  
  // Load individual allowlisted files
  const allowlistedFiles = ['package.json', 'amalfa.settings.json', 'AGENTS.md', 'README.md', '_CURRENT_TASK.md'];
  
  for (const file of allowlistedFiles) {
    if (existsSync(file)) {
      const fileName = file.replace('.json', '').replace('.md', '');
      content[fileName] = readFileSync(file, 'utf8').toLowerCase();
    }
  }
  
  // Load tests/ if exists
  if (existsSync('tests/')) {
    const testResult = spawnSync("find", ["tests/", "-name", "*.ts", "-type", "f"], { encoding: "utf8" });
    const testFiles = testResult.stdout.trim().split('\n').filter(f => f && existsSync(f));
    
    let testContent = '';
    for (const file of testFiles) {
      testContent += readFileSync(file, 'utf8').toLowerCase() + ' ';
    }
    content['tests'] = testContent;
  }
  
  console.log("Allowlisted content loaded:");
  for (const [source, sourceContent] of Object.entries(content)) {
    console.log(`  ${source}: ${(sourceContent as string).length.toLocaleString()} chars`);
  }
  console.log('');
  
  return content;
}

allowlistClassification().catch(console.error);
