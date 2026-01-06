## User

- i note we now have a @src fodler and a [@resonance](file:///Users/petersmith/Documents/GitHub/polyvis/resonance) folder
- please compare and contrast the functionality of each and lets review what we have 
- proceed

## Assistant

I'll explore both directories to understand their structure and functionality.

**Tool Call: List the `polyvis/resonance` directory's contents**
Status: Completed

# Folders:
polyvis/resonance/src


**Tool Call: List the `polyvis/src` directory's contents**
Status: Completed

# Folders:
polyvis/src/config
polyvis/src/core
polyvis/src/css
polyvis/src/data
polyvis/src/db
polyvis/src/js
polyvis/src/types
polyvis/src/utils

# Files:
polyvis/src/index.ts


**Tool Call: List the `polyvis/resonance/src` directory's contents**
Status: Completed

# Folders:
polyvis/resonance/src/services

# Files:
polyvis/resonance/src/config.ts
polyvis/resonance/src/db.ts


**Tool Call: Read file `src/index.ts`**
Status: Completed

```polyvis/src/index.ts
import { parseArgs } from "util";
import { LocusLedger } from "./data/LocusLedger";
import { BentoBoxer, type BentoBox } from "./core/BentoBoxer";

// -- Configuration --
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    file: { type: "string", short: "f" },
    output: { type: "string", short: "o" },
  },
  allowPositionals: true,
  strict: false
});

const CMD = (positionals[2] || "help") as string; // bun run src/index.ts [cmd]
const FILE_PATH = values.file as string | undefined;
const OUT_PATH = values.output as string | undefined;

// -- Main Execution --
(async () => {
  try {
    const ledger = new LocusLedger(); // Auto-initialises SQLite
    const boxer = new BentoBoxer(ledger);

    switch (CMD) {
      case "box":
        await runBoxCommand(boxer);
        break;
      case "audit":
        await runAuditCommand();
        break;
      default:
        printHelp();
        break;
    }
  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
})();

// -- Command Logic --

/**
 * COMMAND: box
 * Reads raw markdown, applies Seaman-Sizing, injects Locus Tags, writes output.
 */
async function runBoxCommand(boxer: BentoBoxer) {
  if (!FILE_PATH) throw new Error("Missing --file argument");

  console.log(`📦 Bento-Boxing file: ${FILE_PATH}...`);
  
  const inputFile = Bun.file(FILE_PATH);
  if (!await inputFile.exists()) throw new Error(`File not found: ${FILE_PATH}`);

  const rawText = await inputFile.text();

  // 1. Process
  const boxes = boxer.process(rawText);

  // 2. Re-assemble with Locus Tags
  const outputText = boxes.map(assembleBox).join("\n\n");

  // 3. Output
  if (OUT_PATH) {
    await Bun.write(OUT_PATH, outputText);
    console.log(`✅ Written ${boxes.length} boxes to ${OUT_PATH}`);
  } else {
    console.log(outputText); // Stdout pipeline support
  }
}

/**
 * COMMAND: audit
 * Verifies that the 'boxed' file is semantically identical to the 'source' file
 * by stripping Locus tags and structural artifacts.
 */
async function runAuditCommand() {
  if (!FILE_PATH || !OUT_PATH) throw new Error("Audit requires --file (Source) and --output (Boxed) to compare.");

  console.log(`🔍 Auditing integrity...`);

  const sourceFile = Bun.file(FILE_PATH);
  const boxedFile = Bun.file(OUT_PATH);

  if (!await sourceFile.exists()) throw new Error(`Source file not found: ${FILE_PATH}`);
  if (!await boxedFile.exists()) throw new Error(`Boxed file not found: ${OUT_PATH}`);

  const sourceText = (await sourceFile.text()).trim();
  const boxedText = (await boxedFile.text()).trim();

  // Strip Locus Tags: <!-- locus: ... -->
  const strippedBoxed = boxedText
    .replace(/<!-- locus:.*? -->/g, "")
    .trim();
  
  // Simple normalization for comparison (collapse whitespace)
  const normalize = (str: string) => str.replace(/\s+/g, " ");

  if (normalize(sourceText) === normalize(strippedBoxed)) {
    console.log("✅ AUDIT PASSED: Content is semantically identical.");
  } else {
    console.error("⚠️ AUDIT FAILED: Content divergence detected.");
    // In a real tool, we would diff the normalized strings here
    process.exit(1);
  }
}

// -- Helpers --

function assembleBox(box: BentoBox): string {
  // Inject Locus Tag as HTML Comment
  return `<!-- locus:${box.locusId} -->\n${box.content}`;
}

function printHelp() {
  console.log(`
Polyvis Bento-Boxer (CLI)
-------------------------
Usage:
  bun run src/index.ts box --file <path> [--output <path>]
  bun run src/index.ts audit --file <source> --output <boxed>

Commands:
  box    Apply Seaman-sizing and tag generation.
  audit  Verify that the boxed content matches the source content.
  `);
}

```


**Tool Call: List the `polyvis/resonance/src/services` directory's contents**
Status: Completed


# Files:
polyvis/resonance/src/services/embedder.ts


**Tool Call: Read file `resonance/src/db.ts`**
Status: Completed

```polyvis/resonance/src/db.ts
import { Database } from "bun:sqlite";
import { join } from "path";

// Types matching Schema
export interface Node {
    id: string;
    type: string;
    label?: string; // stored as 'title'
    content?: string;
    domain?: string;
    layer?: string;
    embedding?: Float32Array;
    hash?: string;
    meta?: any; // JSON object for flexible metadata
}

export class ResonanceDB {
    private db: Database;

    constructor(dbPath?: string) {
        const target = dbPath || join(process.cwd(), ".resonance/resonance.db");
        this.db = new Database(target);
        this.db.run("PRAGMA journal_mode = WAL;");
        
        // GENESIS Schema
        this.db.run(`
            CREATE TABLE IF NOT EXISTS nodes (
                id TEXT PRIMARY KEY,
                type TEXT,
                title TEXT,
                content TEXT,
                domain TEXT,
                layer TEXT,
                embedding BLOB,
                hash TEXT,
                meta TEXT
            );
            
            CREATE TABLE IF NOT EXISTS edges (
                source TEXT,
                target TEXT,
                type TEXT,
                PRIMARY KEY (source, target, type)
            );
            
            CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source);
            CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target);
        `);
    }

    insertNode(node: Node) {
        // Ensure columns exist (migrations)
        try { this.db.run("ALTER TABLE nodes ADD COLUMN hash TEXT"); } catch (e) {}
        try { this.db.run("ALTER TABLE nodes ADD COLUMN meta TEXT"); } catch (e) {}

        const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO nodes (id, type, title, content, domain, layer, embedding, hash, meta)
            VALUES ($id, $type, $title, $content, $domain, $layer, $embedding, $hash, $meta)
        `);
        
        try {
            const blob = node.embedding ? toFafcas(node.embedding) : null;
            
            stmt.run({
                $id: String(node.id),
                $type: String(node.type),
                $title: node.label ? String(node.label) : null,
                $content: node.content ? String(node.content) : null,
                $domain: String(node.domain || "knowledge"),
                $layer: String(node.layer || "experience"),
                $embedding: blob,
                $hash: node.hash ? String(node.hash) : null,
                $meta: node.meta ? JSON.stringify(node.meta) : null
            });
        } catch (err) {
            console.error("❌ Failed to insert node:", { 
                id: node.id, 
                blobSize: node.embedding ? node.embedding.byteLength : 0,
                blobType: node.embedding ? (node.embedding instanceof Float32Array ? 'F32' : 'Other') : 'Null'
            });
            throw err;
        }
    }

    insertEdge(source: string, target: string, type: string = "related_to") {
        this.db.run(`
            INSERT OR IGNORE INTO edges (source, target, type)
            VALUES (?, ?, ?)
        `, [source, target, type]);
    }

    findSimilar(queryVec: Float32Array, limit = 5, domain?: string): Array<{ id: string; score: number; label: string }> {
        let sql = "SELECT id, title, embedding FROM nodes WHERE embedding IS NOT NULL";
        let params: any[] = [];
        
        if (domain) {
            sql += " AND domain = ?";
            params.push(domain);
        }

        const rows = this.db.query(sql).all(...params) as any[];
        const results = [];

        for (const row of rows) {
            const raw = row.embedding; 
            if (!raw) continue;
            
            // Cast Uint8Array/Buffer to Float32Array view
            const vec = new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4);
            
            const score = dotProduct(queryVec, vec);
            results.push({ 
                id: row.id, 
                label: row.title || row.id, 
                score 
            });
        }
        
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }
    
    getNodeHash(id: string): string | null {
        const row = this.db.prepare("SELECT hash FROM nodes WHERE id = ?").get(id) as any;
        return row ? row.hash : null;
    }
    
    close() {
        this.db.close();
    }
}

// FAFCAS Protocol: use Dot Product for normalized vectors
// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function dotProduct(a: Float32Array, b: Float32Array): number {
    let sum = 0;
    // Modern JS engines SIMD-optimize this loop automatically
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] || 0) * (b[i] || 0);
    }
    return sum;
}

// Source: playbooks/embeddings-and-fafcas-protocol-playbook.md
export function toFafcas(vector: Float32Array): Uint8Array {
    // 1. Calculate Magnitude (L2 Norm)
    let sum = 0;
    for (let i = 0; i < vector.length; i++) {
        const val = vector[i] || 0;
        sum += val * val;
    }
    const magnitude = Math.sqrt(sum);

    // 2. Normalize (Divide by Magnitude)
    // Optimization: If magnitude is 0, return zero vector
    if (magnitude > 1e-6) {
        for (let i = 0; i < vector.length; i++) {
            const val = vector[i] || 0;
            vector[i] = val / magnitude;
        }
    }

    // 3. Serialize to Raw Bytes (FAFCAS Blob)
    return new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
}

```


**Tool Call: Read file `resonance/src/config.ts`**
Status: Completed

```polyvis/resonance/src/config.ts
import { z } from "zod";
import { join } from "path";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const ResonanceConfigSchema = z.object({
    project_name: z.string().default("resonance-project"),
    version: z.string().default("0.1.0"),
    sources: z.object({
        playbooks: z.string().default("./playbooks"),
        debriefs: z.string().default("./debriefs"),
        docs: z.string().default("./docs"),
    }),
    registry: z.string().url().optional(),
});

export type ResonanceConfig = z.infer<typeof ResonanceConfigSchema>;

export function loadConfig(): ResonanceConfig {
    const configPath = join(process.cwd(), "resonance.settings.json");
    if (!existsSync(configPath)) {
        return ResonanceConfigSchema.parse({});
    }
    try {
        const data = JSON.parse(readFileSync(configPath, "utf-8"));
        return ResonanceConfigSchema.parse(data);
    } catch (e) {
        console.error("❌ Invalid configuration file:", e);
        return ResonanceConfigSchema.parse({});
    }
}

```


**Tool Call: Read file `resonance/src/services/embedder.ts`**
Status: Completed

```polyvis/resonance/src/services/embedder.ts
import { FlagEmbedding, EmbeddingModel } from "fastembed";
import { join } from "path";

export class Embedder {
    private static instance: Embedder;
    private nativeEmbedder: FlagEmbedding | null = null;

    private constructor() {}

    public static getInstance(): Embedder {
        if (!Embedder.instance) {
            Embedder.instance = new Embedder();
        }
        return Embedder.instance;
    }

    private async init() {
        if (!this.nativeEmbedder) {
            const cacheDir = join(process.cwd(), ".resonance/cache");
            this.nativeEmbedder = await FlagEmbedding.init({
                model: EmbeddingModel.AllMiniLML6V2,
                cacheDir: cacheDir,
                showDownloadProgress: true
            });
        }
    }

    public async embed(text: string): Promise<Float32Array> {
        if (!this.nativeEmbedder) await this.init();
        
        const gen = this.nativeEmbedder!.embed([text]);
        const result = await gen.next();
        
        const val = result.value?.[0];
        if (!val || val.length === 0) {
            throw new Error("Failed to generate embedding");
        }
        
        return new Float32Array(val);
    }
}

```


**Tool Call: List the `polyvis/src/data` directory's contents**
Status: Completed


# Files:
polyvis/src/data/LocusLedger.ts


**Tool Call: List the `polyvis/src/core` directory's contents**
Status: Completed


# Files:
polyvis/src/core/BentoBoxer.ts
polyvis/src/core/BentoNormalizer.ts
polyvis/src/core/EdgeWeaver.ts
polyvis/src/core/FractureLogic.ts
polyvis/src/core/Harvester.ts
polyvis/src/core/MarkdownMasker.ts
polyvis/src/core/TagEngine.ts


**Tool Call: Read file `src/data/LocusLedger.ts`**
Status: Completed

```polyvis/src/data/LocusLedger.ts
import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import { DB_PATHS } from "../config/constants";

export class LocusLedger {
  private db: Database;

  constructor(dbPath: string = DB_PATHS.LEDGER) {
    this.db = new Database(dbPath, { create: true });
    this.initialize();
  }

  /**
   * Initialize the schema.
   * We index by canon_hash to ensure O(1) lookups during the boxing phase.
   */
  private initialize() {
    this.db.query(`
      CREATE TABLE IF NOT EXISTS bento_map (
        canon_hash TEXT PRIMARY KEY,
        locus_id TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `).run();
  }

  /**
   * The core idempotent operation.
   * If the content hash exists, return the existing ID.
   * If not, mint a new one, persist it, and return it.
   */
  public getOrMintId(contentHash: string): string {
    const query = this.db.query("SELECT locus_id FROM bento_map WHERE canon_hash = $hash");
    const result = query.get({ $hash: contentHash }) as { locus_id: string } | null;

    if (result) {
      return result.locus_id;
    }

    const newId = randomUUID();
    this.db.query("INSERT INTO bento_map (canon_hash, locus_id) VALUES ($hash, $id)")
      .run({ $hash: contentHash, $id: newId });

    return newId;
  }

  /**
   * Utility: Generate a simple hash for text content.
   * Uses Bun's native hashing capabilities for speed.
   */
  public static hashContent(text: string): string {
    const hasher = new Bun.CryptoHasher("md5"); // MD5 is sufficient for local content collision detection
    hasher.update(text.trim());
    return hasher.digest("hex");
  }
}

```


**Tool Call: Search files for regex `^import|^export`**
Status: Completed

Showing matches 1-20 (there were more matches found; use offset: 20 to see next page):

## Matches in polyvis/src/config/constants.ts

### L1-3
```
export const SEAMAN_CONSTANTS = {
  MAX_SIZE: 300, // Maximum tokens per Bento Box
};
```

### L5-7
```
export const DB_PATHS = {
  LEDGER: "bento_ledger.sqlite",
};
```

## Matches in polyvis/src/core/BentoBoxer.ts

### L1-16
```
import { LocusLedger } from "../data/LocusLedger";
import { MarkdownMasker } from "./MarkdownMasker";
import { 
  REGEX_PIVOT, 
  REGEX_ENUMERATION, 
  REGEX_DIGRESSION, 
  REGEX_SENTENCE_BOUNDARY 
} from "./FractureLogic";
import { SEAMAN_CONSTANTS } from "../config/constants";

export interface BentoBox {
  locusId: string;
  content: string;
  tokenCount: number;
  isLeaf: boolean; // True if this box fits in the Seaman Constant
}
```

123 lines remaining in ancestor node. Read the file to see all.

### L18-28
```
export class BentoBoxer {
  private ledger: LocusLedger;
  private masker: MarkdownMasker;

  constructor(ledger: LocusLedger) {
    this.ledger = ledger;
    this.masker = new MarkdownMasker();
  }

  /**
   * The public entry point.
```

110 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/core/BentoNormalizer.ts

### L6-16
```
export function fixHeadless(content: string, filename: string): string {
    const lines = content.split('\n');
    
    // Find first non-empty line, skipping frontmatter
    let firstContentIndex = 0;
    if (lines[0]?.trim() === '---') {
        let i = 1;
        while (i < lines.length && (lines[i]?.trim() ?? "") !== '---') {
            i++;
        }
        if (i < lines.length) {
```

36 lines remaining in ancestor node. Read the file to see all.

### L59-69
```
export function fixShouting(content: string): string {
    const lines = content.split('\n');
    let h1Count = 0;

    return lines.map(line => {
        if (line.trim().startsWith('# ')) {
            h1Count++;
            if (h1Count > 1) {
                return '#' + line; // Demote to ##
            }
        }
```

3 lines remaining in ancestor node. Read the file to see all.

### L79-89
```
export function flattenDeepNesting(content: string): string {
    const lines = content.split('\n');
    
    return lines.map(line => {
        // Match H4 (#### ), H5 (##### ), H6 (###### )
        const match = line.match(/^(#{4,6})\s+(.+)$/);
        if (match && match[2]) {
            // Convert to bold: "**Title**"
            return `**${match[2].trim()}**`;
        }
        return line;
```

2 lines remaining in ancestor node. Read the file to see all.

### L93-99
```
export function normalize(content: string, filename: string): string {
    let normalized = content;
    normalized = fixHeadless(normalized, filename);
    normalized = fixShouting(normalized);
    normalized = flattenDeepNesting(normalized);
    return normalized;
}
```

### L101-106
```
export const BentoNormalizer = {
    fixHeadless,
    fixShouting,
    flattenDeepNesting,
    normalize
};
```

## Matches in polyvis/src/core/EdgeWeaver.ts

### L1-13
```
import type { ResonanceDB } from "@resonance/src/db";

export class EdgeWeaver {
    private db: ResonanceDB;
    // Lexicon for lookups (Slug -> ID)
    private lexicon: Map<string, string>;

    constructor(db: ResonanceDB, context: any[] = []) {
        this.db = db;
        this.lexicon = new Map();

        // Build efficient lookup map (Slug -> ID)
        if (Array.isArray(context)) {
```

75 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/core/FractureLogic.ts

### L1-18
```
/**
 * Fracture Logic: The Cleaver
 * Contains regex patterns and scoring logic for splitting text.
 */

// 1. Priority A: Structural Pivot
// "However,", "Therefore,", etc. at the start of a sentence or line.
export const REGEX_PIVOT = /(?:^|\s)(?:However|Therefore|Nevertheless|Furthermore|Consequently|Thus|Hence)(?:,)/gi;

// 2. Priority B: Enumeration
// Numbered lists (1.), Lettered lists (a)), or bullet points (-, *)
export const REGEX_ENUMERATION = /(?:^|\n)(?:\d+\.|[a-z]\)|[-*])\s/g;

// 3. Priority C: Digression
// Notes, Edits, Updates
export const REGEX_DIGRESSION = /\((?:Note|Edit|Update):/gi;

// 4. Fallback: Sentence Boundary
```

4 lines remaining in ancestor node. Read the file to see all.

### L19-22
```
// Standard period, question mark, exclamation point.
// We allow standard sentence ending punctuation.
export const REGEX_SENTENCE_BOUNDARY = /[.!?](?:\s|$)/g;

```

## Matches in polyvis/src/core/Harvester.ts

### L1-14
```
import { Glob } from "bun";
import { Embedder } from "@resonance/src/services/embedder";

export class Harvester {
    private embedder: Embedder;

    constructor() {
        this.embedder = Embedder.getInstance();
    }

    /**
     * Scans directories for `tag-` tokens.
     * @returns A map of tag -> file paths[]
     */
```

54 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/core/MarkdownMasker.ts

### L1-13
```
import { randomUUID } from "crypto";

export class MarkdownMasker {
  private stash: Map<string, string> = new Map();

  // Regex patterns for "No-Fly Zones"
  private static PATTERNS = [
    /```[\s\S]*?```/g,       // Fenced Code Blocks (Multi-line)
    /`[^`]*`/g,               // Inline Code
    /^\|.*\|$/gm,             // Tables (GFM) - Basic detection
  ];

  /**
```

37 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/core/TagEngine.ts

### L1-4
```
export interface TagResult {
  hardTags: string[]; // High confidence / Existing CL terms
  softTokens: string[]; // Exploratory / New terms
}
```

### L6-16
```
export class TagEngine {
  private model: string;
  private endpoint: string;

  constructor(model = "llama3.2", endpoint = "http://localhost:11434/api/generate") {
    this.model = model;
    this.endpoint = endpoint;
  }

  public async generateTags(content: string): Promise<TagResult> {
    const prompt = `
```

37 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/data/LocusLedger.ts

### L1-15
```
import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";
import { DB_PATHS } from "../config/constants";

export class LocusLedger {
  private db: Database;

  constructor(dbPath: string = DB_PATHS.LEDGER) {
    this.db = new Database(dbPath, { create: true });
    this.initialize();
  }

  /**
   * Initialize the schema.
   * We index by canon_hash to ensure O(1) lookups during the boxing phase.
```

42 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/src/db/schema.ts

### L1-13
```
import { sqliteTable, text, blob, primaryKey } from "drizzle-orm/sqlite-core";

export const nodes = sqliteTable("nodes", {
	id: text("id").primaryKey(),
	type: text("type").notNull(),
	
	// Content Fields
	title: text("title"),
	content: text("content"),
	
	// Taxonomy
	domain: text("domain").default("knowledge"),
	layer: text("layer").default("experience"),
```

19 lines remaining in ancestor node. Read the file to see all.

### L25-31
```
export const edges = sqliteTable("edges", {
	source: text("source").notNull(),
	target: text("target").notNull(),
	type: text("type").notNull(),
}, (t) => ({
    pk: primaryKey({ columns: [t.source, t.target, t.type] }),
}));
```

## Matches in polyvis/src/index.ts

### L1-11
```
import { parseArgs } from "util";
import { LocusLedger } from "./data/LocusLedger";
import { BentoBoxer, type BentoBox } from "./core/BentoBoxer";

// -- Configuration --
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    file: { type: "string", short: "f" },
    output: { type: "string", short: "o" },
  },
```

119 lines remaining in ancestor node. Read the file to see all.


**Tool Call: Read file `src/core/BentoBoxer.ts`**
Status: Completed

```polyvis/src/core/BentoBoxer.ts
import { LocusLedger } from "../data/LocusLedger";
import { MarkdownMasker } from "./MarkdownMasker";
import { 
  REGEX_PIVOT, 
  REGEX_ENUMERATION, 
  REGEX_DIGRESSION, 
  REGEX_SENTENCE_BOUNDARY 
} from "./FractureLogic";
import { SEAMAN_CONSTANTS } from "../config/constants";

export interface BentoBox {
  locusId: string;
  content: string;
  tokenCount: number;
  isLeaf: boolean; // True if this box fits in the Seaman Constant
}

export class BentoBoxer {
  private ledger: LocusLedger;
  private masker: MarkdownMasker;

  constructor(ledger: LocusLedger) {
    this.ledger = ledger;
    this.masker = new MarkdownMasker();
  }

  /**
   * The public entry point.
   * Recursively processes text and returns a flat array of valid Bento Boxes.
   */
  public process(text: string): BentoBox[] {
    // 1. Reset Masker for new document
    this.masker.reset();

    // 2. Protect No-Fly Zones
    const cleanText = text.trim();
    if (!cleanText) return [];

    const maskedText = this.masker.mask(cleanText);

    // 3. Begin Recursive Boxing
    return this.internalProcess(maskedText);
  }

  private internalProcess(text: string): BentoBox[] {
    const tokenCount = this.countTokens(text);

    // BASE CASE: The text fits within the Seaman Constant.
    if (tokenCount <= SEAMAN_CONSTANTS.MAX_SIZE) {
      // Unmask BEFORE generation of hash/ID and final content
      // uniqueness relies on the ACTUAL content, not the masked content.
      const unmaskedContent = this.masker.unmask(text);
      
      const hash = LocusLedger.hashContent(unmaskedContent);
      const id = this.ledger.getOrMintId(hash);

      return [{
        locusId: id,
        content: unmaskedContent,
        tokenCount: tokenCount, // Count of tokens in the processing state (atomic boulders)
        isLeaf: true
      }];
    }

    // RECURSIVE STEP: The text is "Overweight".
    // We must find a fracture plane and split.
    const splitIndex = this.findFracturePlane(text);
    
    // Safety: If no split is found, force median split.
    const effectiveSplitIndex = splitIndex !== -1 ? splitIndex : Math.floor(text.length / 2);

    const [left, right] = this.splitText(text, effectiveSplitIndex);

    return [
      ...this.internalProcess(left),
      ...this.internalProcess(right)
    ];
  }

  /**
   * Identifies the optimal index to split the string.
   * Priority: Pivot > Enumeration > Digression > Sentence Boundary.
   * It searches near the middle of the text to ensure balanced trees.
   */
  private findFracturePlane(text: string): number {
    const midPoint = Math.floor(text.length / 2);
    const searchWindow = Math.floor(text.length * 0.25); // Look +/- 25% from center

    // Helper to find regex match closest to midPoint
    const findBestMatch = (regex: RegExp): number => {
      let bestIndex = -1;
      let minDistance = Infinity;
      
      // Reset regex state
      regex.lastIndex = 0;
      
      let match = regex.exec(text);
      while (match !== null) {
        const dist = Math.abs(match.index - midPoint);
        if (dist < minDistance && dist < searchWindow) {
          minDistance = dist;
          bestIndex = match.index;
        }
        match = regex.exec(text);
      }
      return bestIndex;
    };

    // 1. Priority A: Structural Pivot
    const pivotIdx = findBestMatch(REGEX_PIVOT);
    if (pivotIdx !== -1) return pivotIdx;

    // 2. Priority B: Enumeration
    const enumIdx = findBestMatch(REGEX_ENUMERATION);
    if (enumIdx !== -1) return enumIdx;

    // 3. Priority C: Digression
    const digressionIdx = findBestMatch(REGEX_DIGRESSION);
    if (digressionIdx !== -1) return digressionIdx;

    // 4. Fallback: Sentence Boundary
    // We just want the period closest to the middle
    const sentenceIdx = findBestMatch(REGEX_SENTENCE_BOUNDARY);
    return sentenceIdx !== -1 ? sentenceIdx + 1 : -1; // +1 to split AFTER the period
  }

  /**
   * Rudimentary token counter. 
   * For the purpose of "Seaman-sizing", whitespace splitting is a sufficient proxy.
   */
  private countTokens(text: string): number {
    return text.split(/\s+/).length;
  }

  private splitText(text: string, index: number): [string, string] {
    return [text.substring(0, index).trim(), text.substring(index).trim()];
  }
}

```


## Assistant

Now let me check the README or any documentation that might explain the purpose of each:

**Tool Call: Search files for regex `resonance|@resonance`**
Status: Completed

Showing matches 1-20 (there were more matches found; use offset: 20 to see next page):

## Matches in polyvis/README.md

### L55-65
```
├── public/              # Web Root (HTML, Static Data)
│   ├── explorer/        # SigmaJS Graph Explorer
│   └── data/            # SQLite Databases (ctx.db, resonance.db)
│
├── src/                 # Application Source Code
│   ├── core/            # The Bento Box Kernel (Normalizer, Weaver)
│   ├── config/          # Shared Configuration
│   └── db/              # Database Schemas
│
├── scripts/             # Data Pipeline & Tooling
│   ├── pipeline/        # ETL Scripts (Sync, Load)
```

8 lines remaining in ancestor node. Read the file to see all.

## Matches in polyvis/_CURRENT_TASK.md

### L6-7
```
**Objective:**
Lift and shift the core "Bento Box" and Resonance functionality (Normalizer, Weaver, Harvester) from `scripts/core` to `src/core` (or `src/bento`) to prepare for MCP distribution. Ensure high test coverage.
```

### L29-30
```
- Begin implementing the next phase of the Resonance Engine or Polyvis Bento features as directed.
- Execute `briefs/4-tagging-and-safety.md`.
```

## Matches in polyvis/_staging.md

### L8-15
```
  - debriefs/2025-12-10-edge-weaver-protocol.md
  - briefs/3-brief-resonance-harvester.md
  - briefs/holding/user-manual.md
  - briefs/vibe-agent/resonance-core.md
  - briefs/vibe-agent/vibe-agent.md
  - briefs/archive/2-brief-edge-weaver.md

## statutory-harm
```

### L17-21
```
- **Occurrences:**
  - briefs/3-brief-resonance-harvester.md
  - briefs/holding/user-manual.md

## procedural-default
```

### L23-27
```
- **Occurrences:**
  - briefs/3-brief-resonance-harvester.md
  - briefs/vibe-agent/brief-vibe-worker-agent.md

## recursive-bullshit
```

### L50-54
```
- **Occurrences:**
  - briefs/vibe-agent/resonance-core.md
  - briefs/vibe-agent/vibe-agent.md

## michelle
```

### L61-64
```
- **Occurrences:**
  - briefs/3-brief-resonance-harvester.md

## risk
```

### L66-69
```
- **Occurrences:**
  - briefs/3-brief-resonance-harvester.md

## entropy-cascade
```

## Matches in polyvis/briefs/archive/1-brief-bento-box-protocol.md

### L3-5
```
**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a "Normalization Layer" in the ingestion pipeline. This ensures all input documents conform to a strict semantic hierarchy (The Bento Standard) *before* they are parsed into the Knowledge Graph.
```

### L13-14
```
Every document must conform to this schema to be considered "Resonance-Ready."

```

### L53-55
```
5.  **Write:** Upsert all Nodes to `resonance.db`.

**B. The Verification**
```

## Matches in polyvis/briefs/archive/2-brief-edge-weaver.md

### L3-5
```
**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a deterministic "Linkage Layer" in `resonance.db`. This transforms the graph into a navigable knowledge network by connecting **Experience** (Bento Boxes) to **Persona** (Concepts) via Semantic Tags.
```

## Matches in polyvis/briefs/archive/2025-12-08-experience-graph-integration.md

### L3-4
```
**Objective:** Populate `ctx.db` with resonance documents (Playbooks/Debriefs) and visualize them in Sigma Explorer, controlled by `polyvis.settings.json`.

```

## Matches in polyvis/briefs/archive/2025-12-08-structural-reorganization.md

### L51-54
```
        *   Create edge Node --(`BELONGS_TO`)--> `002-EXPERIENCE`.
        *   Set `domain` column to `resonance`.

---
```

### L68-72
```
*   **Experience Mode:**
    *   Filter: Show only nodes where `domain == 'resonance'` OR `id == '002-EXPERIENCE'`.
    *   Hide `001-PERSONA` and its children.

**Visuals:**
```

### graph › domains › experience › L89-92
```
    "domains": {
      "persona": "persona",
      "experience": "resonance"
    },
```

## Matches in polyvis/briefs/archive/3-brief-resonance-harvester.md

### L3-5
```
**Status:** Execution-Ready
**Context:** Resonance Engine / Unification Sprint
**Objective:** To implement a high-precision "Discovery Engine" that harvests emerging concepts using explicit **Semantic Tags** (`tag-token`). This operationalises the **"Air-Lock"** workflow to validate concepts, cluster them via embeddings, and route them to the correct Graph Domain.
```

### L35-36
```
* **Tool:** `resonance harvest` (CLI).
* **Logic:** Scans all files for `tag-[a-z-]+`.
```

### L45-46
```
* **Command:** `resonance promote`.
* **Action:** User defines terms and routes them:
```


**Tool Call: Read file `README.md`**
Status: Completed

````polyvis/README.md
# Polyvis: A Neuro-Symbolic Graph Visualizer

Polyvis is a lightweight, frontend-only web application for exploring and visualizing neuro-symbolic knowledge graphs. It renders conceptual relationships from a pre-built SQLite database, allowing users to navigate a "Neuro-Map" of interconnected ideas, principles, and directives.

The application is built with HTML, CSS, and [Alpine.js](https://alpinejs.dev/), and uses [Bun](https://bun.sh/) as its JavaScript runtime and toolkit. The graph visualization is powered by [viz.js](https://github.com/mdaines/viz.js) and [Sigma.js](https://www.sigmajs.org/), and the in-browser database is handled by [sql.js](https://sql.js.org/).

## Features

- **Interactive Graph Visualization:** Explore the knowledge graph by searching for terms.
- **Data-Driven Suggestions:** The search box provides a curated list of high-value terms guaranteed to produce rich, interesting graphs.
- **In-Browser Database:** The entire graph dataset is loaded into the browser via sql.js, requiring no active backend server for querying.
- **Alpine.js Reactivity:** Uses [Alpine.js](https://alpinejs.dev/) for a lightweight, reactive UI without a complex build step.
- **Alpine.js Reactivity:** Uses [Alpine.js](https://alpinejs.dev/) for a lightweight, reactive UI without a complex build step.
- **Zero-Build Frontend:** Built with vanilla web technologies and Alpine.js for maximum simplicity and performance.
-   **Themable UI:** All design tokens (colors, dimensions) are centralized in `src/css/layers/theme.css` ("The Control Panel") for easy customization.
-   **Semantic Styling:** No magic numbers. All styles use semantic variables (e.g., `--surface-panel`, `--border-base`) for consistent theming.

## Design System (The Control Center)
The application's visual design is strictly controlled by **`src/css/layers/theme.css`**. This file acts as a configuration panel for:
-   **Dimensions:** Sidebar widths, header heights.
-   **Colors:** Semantic mappings (e.g., `--surface-1`, `--brand`).
-   **Spacing:** Global padding and gaps.

**Protocol:** Always check and tweak `theme.css` before modifying component styles.

## Prerequisites

- [Bun.js](https://bun.sh/docs/installation) (v1.0 or later)
- A local web server for development (e.g., `npm install -g live-server`)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Installation

There are no external dependencies to install for the application itself, as it relies on vanilla JavaScript and CDN-hosted libraries.

### 2. Development Workflow

For detailed instructions on CSS development, database building, and running the app, please refer to the **[Development Workflow Playbook](playbooks/development-workflow-playbook.md)**.

**Quick Start:**
1.  **Dev Mode:** `bun run dev` (Starts server & CSS watcher)
2.  **Build DB:** `bun run scripts/build_db.ts`

## Project Structure

### 3. Detailed Documentation
For a deep dive on the codebase organization, please see **[Project Structure](docs/project-structure.md)**.

## Project Structure (High Level)

```
├── public/              # Web Root (HTML, Static Data)
│   ├── explorer/        # SigmaJS Graph Explorer
│   └── data/            # SQLite Databases (ctx.db, resonance.db)
│
├── src/                 # Application Source Code
│   ├── core/            # The Bento Box Kernel (Normalizer, Weaver)
│   ├── config/          # Shared Configuration
│   └── db/              # Database Schemas
│
├── scripts/             # Data Pipeline & Tooling
│   ├── pipeline/        # ETL Scripts (Sync, Load)
│   ├── cli/             # Command Line Tools (Harvest)
│   └── verify/          # Integrity Checks
│
├── docs/                # Project Documentation
├── playbooks/           # Operational Protocols
├── polyvis.settings.json # Central Configuration
└── README.md            # This file
```

## Contributing
## Contribution Guidelines
Please review `AGENTS.md` for our operational protocols, specifically:
-   **EVP (Empirical Verification Protocol):** Use the browser to verify, don't guess.
-   **GEP (Granular Execution Protocol):** One step at a time.
 Please feel free to open issues or submit pull requests.

````


**Tool Call: Read file `package.json`**
Status: Completed

```polyvis/package.json
{
	"name": "polyvis",
	"private": true,
	"version": "0.1.0",
	"license": "MIT",
	"devDependencies": {
		"@biomejs/biome": "2.3.8",
		"@tailwindcss/cli": "^4.1.17",
		"@tailwindcss/postcss": "^4.1.17",
		"@types/bun": "^1.3.4",
		"open-props": "^1.7.16",
		"tailwindcss": "^4.1.17"
	},
	"scripts": {
		"dev": "bun run scripts/cli/dev.ts",
		"build:css": "tailwindcss -i ./src/css/main.css -o ./public/css/app.css",
		"watch:css": "tailwindcss -i ./src/css/main.css -o ./public/css/app.css --watch",
		"build:js": "bun build ./src/js/app.js ./src/js/utils/theme.js --outdir ./public/js",
		"watch:js": "bun build ./src/js/app.js ./src/js/utils/theme.js --outdir ./public/js --watch",
		"build:data": "bun run scripts/build_data.ts && bun run scripts/build_experience.ts",
		"check": "biome check .",
		"format": "biome format --write .",
		"lint": "biome lint ."
	},
	"peerDependencies": {
		"typescript": "^5"
	},
	"dependencies": {
		"@mistralai/mistralai": "^1.10.0",
		"alpinejs": "^3.15.2",
		"drizzle-kit": "^0.31.8",
		"drizzle-orm": "^0.45.0",
		"fastembed": "^2.0.0",
		"glob": "^13.0.0",
		"marked": "^17.0.1"
	}
}

```


**Tool Call: 1 match**
Status: Completed

file:///Users/petersmith/Documents/GitHub/polyvis/tsconfig.json

**Tool Call: Read file `tsconfig.json`**
Status: Completed

```polyvis/tsconfig.json
{
	"compilerOptions": {
		// Environment setup & latest features
		"lib": ["ESNext"],
		"target": "ESNext",
		"module": "Preserve",
		"moduleDetection": "force",
		"jsx": "react-jsx",
		"allowJs": true,

		// Bundler mode
		"moduleResolution": "bundler",
		"allowImportingTsExtensions": true,
		"verbatimModuleSyntax": true,
		"noEmit": true,

		// Best practices
		"strict": true,
		"skipLibCheck": true,
		"noFallthroughCasesInSwitch": true,
		"noUncheckedIndexedAccess": true,
		"noImplicitOverride": true,

		// Some stricter flags (disabled by default)
		"noUnusedLocals": false,
		"noUnusedParameters": false,
		"noPropertyAccessFromIndexSignature": false,
		"baseUrl": ".",
		"paths": {
			"@src/*": ["./src/*"],
			"@scripts/*": ["./scripts/*"],
			"@resonance/*": ["./resonance/*"],
			"@/*": ["./*"]
		}
	},
	"exclude": ["public/docs", "node_modules", "dist", ".resonance", "briefs", "examples"]
}

```


**Tool Call: Search files for regex `^# |^## `**
Status: Completed

Showing matches 1-20 (there were more matches found; use offset: 20 to see next page):

## Matches in polyvis/briefs/archive/1-brief-bento-box-protocol.md

### # Project Brief: The Bento Box Protocol (Document Normalization) › L1-2
```
# Project Brief: The Bento Box Protocol (Document Normalization)

```

### ## 1. The "Bento" Standard › L12-13
```
## 1. The "Bento" Standard
Every document must conform to this schema to be considered "Resonance-Ready."
```

### ## 2. The Normalization Logic (`scripts/normalize_docs.ts`) › L25-26
```
## 2. The Normalization Logic (`scripts/normalize_docs.ts`)

```

### ## 3. Integration Plan › L43-44
```
## 3. Integration Plan

```

### ## 4. Success Criteria › L60-61
```
## 4. Success Criteria
* [ ] `scripts/normalize_docs.ts` exists and passes unit tests.
```

## Matches in polyvis/briefs/archive/1-brief-polyvis-bento-implementation.md

### # Implementation Brief: Polyvis Bento-Boxing Tool › L1-2
```
# Implementation Brief: Polyvis Bento-Boxing Tool

```

### ## 1\. Project Overview › L5-6
```
## 1\. Project Overview

```

### ## 2\. Technical Requirements › L11-12
```
## 2\. Technical Requirements

```

### ## 3\. Project Structure › L18-19
```
## 3\. Project Structure

```

### ## 4\. Module Specifications › L34-35
```
## 4\. Module Specifications

```

### ## 5\. Implementation Steps (The Happy Path) › L73-74
```
## 5\. Implementation Steps (The Happy Path)

```

### ## 6\. Definition of Done › L98-99
```
## 6\. Definition of Done

```

## Matches in polyvis/briefs/archive/2-brief-edge-weaver.md

### # Project Brief: The Edge Weaver Protocol › L1-2
```
# Project Brief: The Edge Weaver Protocol

```

### ## 1. The Warp: Structural Edges (Vertical) › L12-13
```
## 1. The Warp: Structural Edges (Vertical)
These edges define the backbone, derived strictly from the AST.
```

### ## 2. The Weft: Associative Edges (Lateral) › L19-20
```
## 2. The Weft: Associative Edges (Lateral)
These edges are derived from the **Semantic Tags** (`tag-`) harvested from the content.
```

### ## 3. Implementation Plan (`src/commands/sync.ts`) › L35-36
```
## 3. Implementation Plan (`src/commands/sync.ts`)

```

### ## 4. Success Criteria › L50-51
```
## 4. Success Criteria
* [ ] A `tag-circular-logic` in a letter creates an `EXEMPLIFIES` edge to the Concept "Circular Logic."
```

## Matches in polyvis/briefs/archive/2025-12-08-experience-graph-integration.md

### # Plan: Experience Graph Integration (Sidecar Pipeline) › L1-2
```
# Plan: Experience Graph Integration (Sidecar Pipeline)

```

### ## 1. Safety & Verification (First Step) › L5-6
```
## 1. Safety & Verification (First Step)
We will create a verification script to ensure we don't corrupt the existing Lexicon graph.
```

### ## 2. Ingestion Logic (The Sidecar) › L13-14
```
## 2. Ingestion Logic (The Sidecar)
We will implement the "Sidecar" pattern as requested to avoid touching `build_db.ts`.
```


## Assistant

Perfect! Now I have a comprehensive view. Let me create a detailed comparison document.

## 📊 Comparison: `/src` vs `/resonance` Folders

Based on my exploration, here's a detailed comparison and review:

---

## **Architecture Overview**

### **`/src` - The Bento Box CLI Tool**
**Purpose:** A command-line tool for processing markdown documents into "Bento Boxes" - semantically chunked content units with stable identifiers.

**Core Functionality:**
- **Document Processing Pipeline:** Takes raw markdown, applies "Seaman-sizing" (300 token chunks), generates stable Locus IDs
- **Idempotent Tagging:** Content-based hashing ensures same content = same ID across runs
- **CLI Interface:** `box` and `audit` commands for processing and verification

**Key Components:**
```polyvis/src/
├── core/
│   ├── BentoBoxer.ts         # Main orchestrator - recursive chunking
│   ├── BentoNormalizer.ts    # Document cleanup (headings, structure)
│   ├── FractureLogic.ts      # Smart splitting rules (pivots, lists, etc.)
│   ├── MarkdownMasker.ts     # Protects code blocks during processing
│   ├── Harvester.ts          # Scans for tag- tokens
│   ├── EdgeWeaver.ts         # Creates graph edges
│   └── TagEngine.ts          # AI tag generation
├── data/
│   └── LocusLedger.ts        # SQLite ledger (hash → locus_id mapping)
└── index.ts                   # CLI entry point
```

**Database:** Simple ledger (`bento_ledger.sqlite`) with hash→ID mapping only

---

### **`/resonance` - The Knowledge Graph Engine**
**Purpose:** A semantic graph database and embedding service for building a navigable knowledge network.

**Core Functionality:**
- **Vector Embeddings:** Uses `fastembed` (AllMiniLML6V2 model) for semantic similarity
- **FAFCAS Protocol:** Normalized float32 vectors stored as blobs with dot-product similarity
- **Graph Storage:** Nodes (concepts/content) + Edges (relationships) in SQLite
- **Configuration Management:** Project-level settings via `resonance.settings.json`

**Key Components:**
```polyvis/resonance/src/
├── services/
│   └── embedder.ts          # Singleton embedding service
├── db.ts                     # ResonanceDB class (nodes/edges schema)
└── config.ts                 # Configuration loader
```

**Database:** Full graph structure with:
- **Nodes:** id, type, title, content, domain, layer, embedding (blob), hash, meta
- **Edges:** source, target, type (with compound primary key)
- **Indexes:** Source/target edges for fast traversal

---

## **Key Differences**

| Aspect | `/src` (Bento Box) | `/resonance` (Knowledge Graph) |
|--------|-------------------|-------------------------------|
| **Primary Goal** | Document chunking & stable IDs | Semantic graph & similarity search |
| **Database Schema** | Minimal (2 tables: bento_map, edges) | Rich (nodes with embeddings + edges) |
| **AI/ML** | Optional (TagEngine via Ollama) | Core (embeddings via fastembed) |
| **Processing Model** | Recursive splitting algorithm | Embedding generation + graph traversal |
| **Output** | Markdown with `<!-- locus:... -->` tags | SQLite graph database |
| **Use Case** | Content versioning & chunking | Semantic search & knowledge discovery |

---

## **Integration Points**

The two systems are **complementary** but currently **separate**:

1. **`/src`** creates stable content chunks (Bento Boxes)
2. **`/resonance`** could consume these boxes as nodes with embeddings
3. **`EdgeWeaver`** in `/src` already imports from `@resonance/src/db` - showing intended integration!

**Evidence of Planned Integration:**
```typescript:polyvis/src/core/EdgeWeaver.ts#L1-2
import type { ResonanceDB } from "@resonance/src/db";
```

The `EdgeWeaver` and `Harvester` in `/src/core` are designed to work with the Resonance graph.

---

## **Current State Assessment**

### ✅ **Strengths**
1. **Clean Separation of Concerns:** Chunking logic (src) vs graph storage (resonance)
2. **Path Aliases Working:** TypeScript paths configured (`@resonance/*`, `@src/*`)
3. **Idempotent Design:** Locus IDs are stable across re-runs
4. **Production-Ready Patterns:** Singleton embedder, WAL mode, proper indexing

### ⚠️ **Observations**
1. **Duplicate Schemas:** Both have node/edge tables but different purposes
2. **No Unified Entry Point:** Two separate CLIs (src/index.ts vs resonance CLI?)
3. **EdgeWeaver Integration Incomplete:** Imports ResonanceDB but isn't actively used in main CLI
4. **Different Hash Approaches:** 
   - `/src`: MD5 hash for content deduplication
   - `/resonance`: Hash field exists but purpose unclear

---

## **Recommended Next Steps**

### **Option A: Full Integration (Recommended)**
Make `/src` the **data preparation layer** and `/resonance` the **storage/query layer**:

```typescript:polyvis/src/index.ts#L1-5
// Add new command: ingest
case "ingest":
  await runIngestCommand(boxer, resonanceDB);
  break;
```

**Workflow:**
1. `bun run src/index.ts box --file doc.md` → Creates Bento Boxes
2. `bun run src/index.ts ingest --file boxed.md` → Populates resonance.db with embeddings
3. Query via resonance similarity search

### **Option B: Keep Separate (Current State)**
- `/src` = Markdown preprocessing tool (standalone)
- `/resonance` = Knowledge graph service (independent)
- Manual bridge via scripts

---

## **Questions for You**

1. **Is the goal to merge these into a unified pipeline?** (Box → Embed → Graph)
2. **Should EdgeWeaver actively write to resonance.db?** (Currently it imports the type but doesn't use it in the main CLI)
3. **What's the role of `tag-` tokens?** (Harvester scans for them, TagEngine generates them, but integration with resonance unclear)

Would you like me to:
- **A)** Create a unified CLI that bridges both systems?
- **B)** Document the current separation more clearly?
- **C)** Build the "ingest" command to populate resonance from boxed files?

