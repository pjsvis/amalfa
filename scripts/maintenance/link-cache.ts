
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { loadConfig } from "../../src/config/defaults";
import { JsonlUtils } from "../../src/utils/JsonlUtils";
import { AMALFA_DIRS } from "../../src/config/defaults";

// We need to replicate the hashing logic exactly
function hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex");
}

function scanDirectory(dir: string, extensions: string[] = [".md", ".ts", ".tsx"]): string[] {
    let results: string[] = [];
    try {
        const list = readdirSync(dir);
        for (const file of list) {
            const filePath = join(dir, file);
            const stat = statSync(filePath);
            if (stat && stat.isDirectory()) {
                if (file.startsWith(".") || file === "node_modules") continue;
                results = results.concat(scanDirectory(filePath, extensions));
            } else {
                if (extensions.some(ext => file.endsWith(ext))) {
                    results.push(filePath);
                }
            }
        }
    } catch (e) {
        // Ignore errors
    }
    return results;
}

async function main() {
    console.log("🔗 Linking Cache Hashes to Source Files...");
    
    // 1. Resolve Source Directories
    const config = await loadConfig();
    const sources = config.sources || ["./docs"];
    const rootDir = process.cwd();
    
    console.log(`📝 Configuration loaded. Sources: ${JSON.stringify(sources)}`);
    
    let allFiles: string[] = [];
    
    for (const source of sources) {
        // Handle glob-like sources roughly or just directories
        // The DEFAULT_CONFIG has "./docs", "./*.md", "./src/**/*.md"
        // For simplicity in this script, we'll scan logical roots.
        // Actually, let's just scan the whole project root respecting ignores?
        // Or stick to what the config says?
        // Let's scan specific known directories for safety.
        
        const cleanPath = source.replace(/\*\*\/\*\.md$/, "").replace(/\*\.md$/, "").replace(/^\.\//, "");
        const fullPath = join(rootDir, cleanPath);
        
        if (cleanPath === "") {
             // Root scan (careful)
             const rootFiles = readdirSync(rootDir).filter(f => f.endsWith(".md"));
             allFiles.push(...rootFiles.map(f => join(rootDir, f)));
             // Also scan src, scripts, docs
             allFiles.push(...scanDirectory(join(rootDir, "src")));
             allFiles.push(...scanDirectory(join(rootDir, "scripts")));
             allFiles.push(...scanDirectory(join(rootDir, "docs")));
             allFiles.push(...scanDirectory(join(rootDir, "debriefs")));
             allFiles.push(...scanDirectory(join(rootDir, "briefs")));
        } else {
             allFiles.push(...scanDirectory(fullPath));
        }
    }
    
    // Deduplicate
    allFiles = [...new Set(allFiles)];
    console.log(`📂 Found ${allFiles.length} potential source files.`);

    const manifestPath = join(AMALFA_DIRS.cache, "manifest.jsonl");
    // Clear existing
    const manifestFile = Bun.file(manifestPath);
    if (await manifestFile.exists()) {
        await Bun.write(manifestPath, ""); 
    }

    let matched = 0;
    
    // 2. Compute Hashes & Check Cache
    for (const file of allFiles) {
        try {
            const content = readFileSync(file, "utf-8");
            const hash = hashContent(content);
            const cachePath = join(AMALFA_DIRS.cache, "lang-extract", `${hash}.json`);
            
            if (await Bun.file(cachePath).exists()) {
                const relPath = relative(rootDir, file);
                const entry = {
                    hash,
                    path: relPath,
                    lastSeen: new Date().toISOString()
                };
                JsonlUtils.append(manifestPath, entry);
                matched++;
            }
        } catch (e) {
            console.warn(`⚠️  Failed to process ${file}`);
        }
    }

    console.log(`✅ Linked ${matched} files to existing cache entries.`);
    console.log(`💾 Manifest saved to ${manifestPath}`);
}

main();
