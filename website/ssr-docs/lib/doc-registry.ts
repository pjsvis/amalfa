/**
 * Persisted Document Registry
 *
 * Stored in `.amalfa/runtime/doc-registry.json`.
 * Cache is invalidated when the file watcher signals changes.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from "fs";
import { join, resolve, relative, dirname } from "path";
import matter from "gray-matter";

export interface DocFolder {
  key: string;
  path: string;
  label: string;
}

export interface DocMetadata {
  id: string;
  title: string;
  file: string;
  folder: string;
  date?: string;
  type?: string;
  tags?: string[];
  modified: number;
  [key: string]: unknown;
}

export interface DocumentSet {
  version: number;
  generated: string;
  folders: DocFolder[];
  documents: DocMetadata[];
  byFolder: Record<string, DocMetadata[]>;
  byCategory: {
    index: DocMetadata[];
    playbooks: DocMetadata[];
    debriefs: DocMetadata[];
    briefs: DocMetadata[];
  };
}

const REGISTRY_PATH = ".amalfa/runtime/doc-registry.json";
const CURRENT_VERSION = 1;

const DEFAULT_FOLDERS: DocFolder[] = [
  { key: "docs", path: "docs", label: "Documentation" },
  { key: "briefs", path: "briefs", label: "Briefs" },
  { key: "debriefs", path: "debriefs", label: "Debriefs" },
];

function loadSettings(): Record<string, unknown> {
  try {
    const content = readFileSync("amalfa.settings.json", "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function loadRegistry(): DocumentSet | null {
  try {
    if (!existsSync(REGISTRY_PATH)) return null;
    const content = readFileSync(REGISTRY_PATH, "utf-8");
    const parsed = JSON.parse(content) as DocumentSet;
    if (parsed.version !== CURRENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveRegistry(registry: DocumentSet): void {
  const dir = dirname(REGISTRY_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

function parseDocument(filePath: string, folder: string): DocMetadata | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const { data } = matter(content);
    const stats = statSync(filePath);
    return {
      id: relative(process.cwd(), filePath),
      title: data.title || filePath.split("/").pop()?.replace(/\.md$/i, "") || "Untitled",
      file: relative(process.cwd(), filePath),
      folder,
      date: data.date,
      type: data.type,
      tags: data.tags,
      modified: stats.mtimeMs,
    };
  } catch {
    return null;
  }
}

function categorize(doc: DocMetadata): string {
  const file = doc.file.toLowerCase();
  if (file.includes("playbook")) return "playbooks";
  if (file.includes("debrief")) return "debriefs";
  if (file.includes("brief")) return "briefs";
  return "index";
}

function scanFolder(dir: string, folder: string, docs: DocMetadata[]): void {
  const items = readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = join(dir, item.name);

    if (item.isDirectory() && !item.name.startsWith(".") && !item.name.startsWith("_")) {
      scanFolder(fullPath, folder, docs);
    } else if (item.isFile() && (item.name.endsWith(".md") || item.name.endsWith(".MD"))) {
      const doc = parseDocument(fullPath, folder);
      if (doc) docs.push(doc);
    }
  }
}

let cachedRegistry: DocumentSet | null = null;

export function getDocumentRegistry(): DocumentSet {
  if (cachedRegistry) return cachedRegistry;

  const registry = loadRegistry();
  if (registry) {
    cachedRegistry = registry;
    return registry;
  }

  return refreshRegistry();
}

export function refreshRegistry(): DocumentSet {
  const settings = loadSettings();
  const docsSettings = settings.docs as { folders?: Record<string, string> } | undefined;
  const folderConfig = docsSettings?.folders;

  const folders: DocFolder[] = folderConfig
    ? Object.entries(folderConfig).map(([key, path]) => ({
        key,
        path,
        label: key.charAt(0).toUpperCase() + key.slice(1),
      }))
    : DEFAULT_FOLDERS;

  const documents: DocMetadata[] = [];

  for (const folder of folders) {
    const folderPath = resolve(folder.path);
    if (!existsSync(folderPath)) continue;
    scanFolder(folderPath, folder.key, documents);
  }

  const byFolder: Record<string, DocMetadata[]> = {};
  const byCategory = { index: [] as DocMetadata[], playbooks: [] as DocMetadata[], debriefs: [] as DocMetadata[], briefs: [] as DocMetadata[] };

  for (const doc of documents) {
    if (!byFolder[doc.folder]) byFolder[doc.folder] = [];
    const folderDocs = byFolder[doc.folder];
    if (folderDocs) folderDocs.push(doc);

    const cat = categorize(doc);
    byCategory[cat as keyof typeof byCategory].push(doc);
  }

  const newRegistry: DocumentSet = {
    version: CURRENT_VERSION,
    generated: new Date().toISOString(),
    folders,
    documents,
    byFolder,
    byCategory,
  };

  saveRegistry(newRegistry);
  cachedRegistry = newRegistry;
  return newRegistry;
}

export function invalidateCache(): void {
  cachedRegistry = null;
}

export function signalChange(): void {
  invalidateCache();
}

export default { getDocumentRegistry, refreshRegistry, invalidateCache, signalChange };
