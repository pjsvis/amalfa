import { Database } from "bun:sqlite";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { JsonlUtils } from "../../utils/JsonlUtils";
import { PipelineClient } from "./lib/client";

const client = new PipelineClient("enrich");

const MANIFEST_FILE = join(process.cwd(), ".amalfa/cache/manifest.jsonl");
const CACHE_DIR = join(process.cwd(), ".amalfa/cache/lang-extract");
const INPUT_FILE = join(process.cwd(), ".amalfa/golden-lexicon.jsonl");
const OUTPUT_FILE = join(
  process.cwd(),
  ".amalfa/golden-lexicon-enriched.jsonl",
);
const TEMP_DB = join(process.cwd(), ".amalfa/runtime/manifest-lookup.db");

// Cache for Sidecars (LRU-ish)
const sidecarCache = new Map<string, any>();
async function getSidecar(hash: string) {
  if (sidecarCache.has(hash)) return sidecarCache.get(hash);
  const path = join(CACHE_DIR, `${hash}.json`);
  if (await Bun.file(path).exists()) {
    try {
      const data = await Bun.file(path).json();
      if (sidecarCache.size > 200) sidecarCache.clear();
      sidecarCache.set(hash, data);
      return data;
    } catch (_e) {
      return null;
    }
  }
  return null;
}

function findDescription(sidecar: any, label: string): string | null {
  if (!sidecar || !sidecar.entities) return null;
  const normalizedLabel = label.toLowerCase();
  for (const ent of sidecar.entities) {
    if (ent.name && ent.name.toLowerCase() === normalizedLabel) {
      return ent.description || null;
    }
  }
  return null;
}

async function enrich() {
  await client.start();

  try {
    await client.log("Indexing Manifest to SQLite...");

    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);
    const db = new Database(TEMP_DB);
    db.run("PRAGMA journal_mode = WAL;");
    db.run("CREATE TABLE manifest (path TEXT PRIMARY KEY, hash TEXT)");
    const insert = db.prepare(
      "INSERT OR IGNORE INTO manifest (path, hash) VALUES ($path, $hash)",
    );
    const insertTx = db.transaction((chunk: any[]) => {
      for (const entry of chunk)
        insert.run({ $path: entry.path, $hash: entry.hash });
    });

    // Index Manifest
    let indexed = 0;
    let chunk: any[] = [];
    if (existsSync(MANIFEST_FILE)) {
      await JsonlUtils.process<any>(MANIFEST_FILE, async (entry) => {
        if (entry.path && entry.hash) {
          chunk.push(entry);
          if (chunk.length >= 1000) {
            insertTx(chunk);
            chunk = [];
          }
        }
        indexed++;
      });
      if (chunk.length > 0) insertTx(chunk);
    }
    await client.log(`Indexed ${indexed} paths.`);

    const lookup = db.prepare("SELECT hash FROM manifest WHERE path = ?");

    // Enrich process
    await Bun.write(OUTPUT_FILE, "");
    let enrichedCount = 0;
    let totalCount = 0;

    await JsonlUtils.process<any>(INPUT_FILE, async (node) => {
      totalCount++;
      let description = node.summary;

      if (!description && node.meta && node.meta.sources) {
        for (const source of node.meta.sources) {
          let hash = source;
          const match = lookup.get(source) as { hash: string } | undefined;
          if (match) hash = match.hash;

          if (hash.length < 5) continue;

          const sidecar = await getSidecar(hash);
          if (sidecar) {
            const desc = findDescription(sidecar, node.label);
            if (desc) {
              description = desc;
              break;
            }
          }
        }
      }

      const enrichedNode = { ...node, summary: description };
      if (description) enrichedCount++;
      await JsonlUtils.appendAsync(OUTPUT_FILE, enrichedNode);

      if (totalCount % 100 === 0)
        await client.update({ processed: totalCount, enriched: enrichedCount });
    });

    db.close();
    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);

    await client.complete({ total: totalCount, enriched: enrichedCount });
  } catch (e) {
    await client.error(String(e));
    process.exit(1);
  }
}

enrich();
