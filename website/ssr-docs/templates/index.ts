/**
 * SSR Template Integration Layer
 * 
 * Bridges server with JSX templates.
 * Uses canonical ResonanceDB for data access.
 */

import { join, resolve } from "node:path";
import { DashboardPage, type DashboardData } from "./dashboard.tsx";
import { LexiconPage, type LexiconData, type LexiconEntry } from "./lexicon.tsx";
import { DocPage, type DocPageData } from "./doc.tsx";
import { PROJECT_ROOT, resolvePath } from "../lib/paths.ts";

if (!PROJECT_ROOT) {
  throw new Error("Could not find project root");
}

const ROOT_PATH = PROJECT_ROOT;

export interface SafeConfig {
  sources: string[];
  database: string;
  embeddings: { model: string; dimensions: number };
  watch: { enabled: boolean };
  ember: { enabled: boolean };
  sonar: { enabled: boolean; port?: number };
  scratchpad: { enabled: boolean };
}

export async function loadConfig(): Promise<SafeConfig> {
  const defaultConfig: SafeConfig = {
    sources: ["."],
    database: ".amalfa/resonance.db",
    embeddings: { model: "BAAI/bge-small-en-v1.5", dimensions: 384 },
    watch: { enabled: true },
    ember: { enabled: true },
    sonar: { enabled: true, port: 3012 },
    scratchpad: { enabled: true },
  };

  try {
    const configFile = Bun.file("amalfa.settings.json");
    const content = await configFile.text();
    const parsed = JSON.parse(content);
    return { ...defaultConfig, ...parsed };
  } catch {
    console.warn("Failed to load amalfa.settings.json, using defaults");
    return defaultConfig;
  }
}

export async function getDashboardData(config: SafeConfig): Promise<DashboardData> {
  let nodes = 0;
  let edges = 0;
  let vectors = 0;
  let size_mb = 0;

  const dbPath = resolvePath(config.database);

  try {
    const { Database } = await import("bun:sqlite");
    const db = new Database(dbPath);
    
    const nodeResult = db.query("SELECT COUNT(*) as count FROM nodes").get() as { count: number } | undefined;
    nodes = nodeResult?.count || 0;
    
    const edgeResult = db.query("SELECT COUNT(*) as count FROM edges").get() as { count: number } | undefined;
    edges = edgeResult?.count || 0;
    
    const vectorResult = db.query("SELECT COUNT(*) as count FROM nodes WHERE embedding IS NOT NULL").get() as { count: number } | undefined;
    vectors = vectorResult?.count || 0;
    
    const pageCount = db.query("PRAGMA page_count").get() as { page_count: number } | undefined;
    const pageSize = db.query("PRAGMA page_size").get() as { page_size: number } | undefined;
    size_mb = ((pageCount?.page_count || 0) * (pageSize?.page_size || 4096)) / (1024 * 1024);
    
    db.close();
  } catch (e) {
    console.warn("Database query failed:", e);
  }

  return {
    stats: { nodes, edges, vectors, size_mb },
    services: [
      { name: "Vector Daemon", status: "running", pid: "25882" },
      { name: "Reranker Daemon", status: "running", pid: "20584" },
      { name: "Sonar Agent", status: "stopped" },
      { name: "Dashboard", status: "running", pid: "37781" },
      { name: "Harvester", status: "running", pid: "1852" },
    ],
    harvest: { cached: 497, timeouts: 10, too_large: 0, errors: 23 },
    uptime: Math.floor(process.uptime()),
    version: "v1.5.1-alpha",
  };
}

export async function getLexiconData(): Promise<LexiconData> {
  const lexiconPath = resolvePath("scripts/fixtures/conceptual-lexicon-ref-v1.79.json");
  
  try {
    const file = Bun.file(lexiconPath);
    const content = await file.text();
    const entries: LexiconEntry[] = JSON.parse(content);
    
    const categories = [...new Set(entries.map((e) => e.category || "Uncategorized"))];
    
    return {
      entries: entries.slice(0, 100),
      totalCount: entries.length,
      categories,
    };
  } catch (e) {
    console.warn("Failed to load lexicon:", e);
    return {
      entries: [],
      totalCount: 0,
      categories: [],
    };
  }
}

export function renderDashboardPage(data: DashboardData): string {
  return DashboardPage(data);
}

export function renderLexiconPage(data: LexiconData): string {
  return LexiconPage(data);
}

export function renderDocPage(data: DocPageData): string {
  return DocPage(data);
}

export default {
  loadConfig,
  getDashboardData,
  getLexiconData,
  renderDashboardPage,
  renderLexiconPage,
  renderDocPage,
};
