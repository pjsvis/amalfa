/**
 * Semantic Ingestion Pipeline
 * Uses TriplifierEngine to extract RDF-compatible nodes and edges
 */

import { join } from "node:path";
import type { AmalfaConfig } from "@src/config/defaults";
import { SemanticDB } from "@src/resonance/SemanticDB";
import { TriplifierEngine } from "@src/semantic/TriplifierEngine";
import { getLogger } from "@src/utils/Logger";
import { toRootRelative } from "@src/utils/projectRoot";
import { Glob } from "bun";
import matter from "gray-matter";

export interface SemanticIngestionResult {
  success: boolean;
  stats: {
    files: number;
    entities: number;
    relationships: number;
    durationSec: number;
  };
}

export class SemanticIngestor {
  private log = getLogger("SemanticIngestor");
  private engine: TriplifierEngine;
  private lexicon: Map<string, string> = new Map();

  constructor(
    private config: AmalfaConfig,
    private db: SemanticDB,
    private resonanceDb?: ResonanceDB,
  ) {
    // Initialize TriplifierEngine without a DB (we handle persistence here)
    this.engine = new TriplifierEngine();
    
    if (this.resonanceDb) {
      this.buildLexicon();
    }
  }

  private buildLexicon() {
    if (!this.resonanceDb) return;
    this.log.info("📖 Building lexicon for entity resolution...");
    
    // Fetch all nodes to create a label-to-id map
    const nodes = this.resonanceDb.getNodes({ excludeContent: true });
    for (const node of nodes) {
      if (node.label) {
        this.lexicon.set(node.label.toLowerCase(), node.id);
      }
      this.lexicon.set(node.id.toLowerCase(), node.id);
    }
    this.log.info(`📖 Lexicon built with ${this.lexicon.size} entries`);
  }

  private resolveId(label: string, originalId: string): string {
    const lowered = label.toLowerCase();
    return this.lexicon.get(lowered) || originalId;
  }

  /**
   * Ingest all markdown files into the semantic database
   */
  async ingest(): Promise<SemanticIngestionResult> {
    const startTime = performance.now();
    const sources = this.config.sources || ["./docs"];
    
    this.log.info(`🧠 Starting semantic ingestion from: ${sources.join(", ")}`);

    try {
      const files = await this.discoverFiles();
      this.log.info(`📁 Found ${files.length} markdown files`);

      if (files.length === 0) {
        return {
          success: true,
          stats: { files: 0, entities: 0, relationships: 0, durationSec: 0 },
        };
      }

      let totalEntities = 0;
      let totalRelationships = 0;

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i]!;
        const relativePath = toRootRelative(filePath);
        const docId = this.db.generateId(relativePath);

        try {
          const rawContent = await Bun.file(filePath).text();
          let content: string;
          let frontmatter: Record<string, any> = {};

          try {
            const parsed = matter(rawContent);
            content = parsed.content;
            frontmatter = parsed.data || {};
          } catch (e) {
            this.log.warn({ file: filePath }, "⚠️ Malformed frontmatter, using raw content");
            content = rawContent;
          }

          // Extract using TriplifierEngine
          const result = await this.engine.processDocument(content, docId);

          let transactionActive = false;
          try {
            this.db.beginTransaction();
            transactionActive = true;

            // 1. Insert original document as a node
            this.db.insertNode({
              id: docId,
              type: "document",
              label: (frontmatter.title as string) || relativePath.split("/").pop() || docId,
              domain: "knowledge",
              layer: "document",
              meta: { 
                ...frontmatter,
                source: relativePath 
              }
            });

            // 2. Insert extracted entities as nodes
            for (const entity of result.entities) {
              const resolvedId = this.resolveId(entity.label, entity.id);
              this.db.insertNode({
                id: resolvedId,
                type: entity.type.toLowerCase(),
                label: entity.label,
                domain: "semantic",
                layer: "knowledge",
                summary: entity.definition,
                meta: { 
                  confidence: entity.confidence,
                  source: relativePath 
                }
              });

              // Link document to the entity
              this.db.insertSemanticEdge(
                docId,
                resolvedId,
                "links_to",
                entity.confidence,
                1.0,
                relativePath
              );

              totalEntities++;
            }

            // 3. Insert relationships as edges
            for (const rel of result.relationships) {
              // Find labels to resolve IDs if possible
              const sourceEntity = result.entities.find(e => e.id === rel.sourceId);
              const targetEntity = result.entities.find(e => e.id === rel.targetId);

              const resolvedSource = sourceEntity 
                ? this.resolveId(sourceEntity.label, rel.sourceId)
                : rel.sourceId;

              const resolvedTarget = targetEntity
                ? this.resolveId(targetEntity.label, rel.targetId)
                : rel.targetId;

              this.db.insertSemanticEdge(
                resolvedSource,
                resolvedTarget,
                rel.predicate,
                rel.confidence,
                1.0, // veracity
                relativePath
              );
              totalRelationships++;
            }
            this.db.commit();
            transactionActive = false;
          } catch (dbErr) {
            this.log.error({ file: filePath, err: dbErr }, "❌ Database error during ingestion");
            if (transactionActive) {
              this.db.rollback();
            }
          }

          if ((i + 1) % 10 === 0 || i === files.length - 1) {
            const pct = Math.round(((i + 1) / files.length) * 100);
            console.log(`  ${pct}% (${i + 1}/${files.length}) - Entities: ${totalEntities}, Rel: ${totalRelationships}`);
          }

        } catch (e) {
          this.log.warn({ file: filePath, err: e }, "⚠️ Failed to process file");
        }
      }

      // Final persistence
      this.db.checkpoint();

      const endTime = performance.now();
      const durationSec = (endTime - startTime) / 1000;

      return {
        success: true,
        stats: {
          files: files.length,
          entities: totalEntities,
          relationships: totalRelationships,
          durationSec,
        },
      };

    } catch (e) {
      this.log.error({ err: e }, "❌ Semantic ingestion failed");
      return {
        success: false,
        stats: { files: 0, entities: 0, relationships: 0, durationSec: 0 },
      };
    }
  }

  private async discoverFiles(): Promise<string[]> {
    const files: string[] = [];
    const glob = new Glob("**/*.{md,ts,js}");
    const sources = this.config.sources || ["./docs"];

    for (const source of sources) {
      const sourcePath = join(process.cwd(), source);
      try {
        for (const file of glob.scanSync(sourcePath)) {
          const shouldExclude = this.config.excludePatterns.some((pattern) =>
            file.includes(pattern),
          );
          if (!shouldExclude) {
            files.push(join(sourcePath, file));
          }
        }
      } catch (e) {
        this.log.warn({ source: sourcePath, err: e }, "⚠️ Failed to scan directory");
      }
    }
    return files;
  }
}
