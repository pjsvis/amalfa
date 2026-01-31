import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ARCH_DIR = "docs/architecture";
const DIAG_DIR = join(ARCH_DIR, "diagrams");

try {
    mkdirSync(DIAG_DIR, { recursive: true });
} catch (e) {}

const files = readdirSync(ARCH_DIR).filter(f => f.endsWith(".md"));

for (const file of files) {
    const path = join(ARCH_DIR, file);
    const content = readFileSync(path, "utf-8");
    
    // Extract DOT
    const match = content.match(/```dot([\s\S]*?)```/);
    if (match) {
        const dot = match[1].trim();
        const base = file.replace(".md", "");
        const dotPath = join(DIAG_DIR, `${base}.dot`);
        const svgPath = join(DIAG_DIR, `${base}.svg`);
        
        writeFileSync(dotPath, dot);
        console.log(`Generating SVG for ${file}...`);
        try {
            execSync(`dot -Tsvg "${dotPath}" -o "${svgPath}"`);
            console.log(`✅ Saved ${svgPath}`);
            execSync(`rm "${dotPath}"`);
        } catch (e) {
            // @ts-ignore
            console.error(`❌ Failed to generate ${file}:`, e.message);
        }
    }
}
