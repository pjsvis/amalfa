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
  private formalLexicon: Map<string, string> = new Map(); // High-signal formal terms (IDs, Protocols)
  private artifacts = {
    lexiconMap: {} as Record<string, string>,
    rawExtractions: [] as any[],
    proposedTriples: [] as any[],
  };

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
      const idLower = node.id.toLowerCase();
      const labelLower = node.label?.toLowerCase();

      // 1. Add to global lexicon
      if (labelLower) {
        this.lexicon.set(labelLower, node.id);
        this.artifacts.lexiconMap[labelLower] = node.id;
      }
      this.lexicon.set(idLower, node.id);
      this.artifacts.lexiconMap[idLower] = node.id;

      // 2. Add to formal lexicon if it looks like a directive or protocol
      if (idLower.match(/^(oh-|cip-|phi-|cog-|adv-|opm-|term-|concept-)/)) {
        this.formalLexicon.set(idLower, node.id);
        if (labelLower) this.formalLexicon.set(labelLower, node.id);
      }
    }
    this.log.info(`📖 Lexicon built with ${this.lexicon.size} entries (${this.formalLexicon.size} formal)`);
  }

  private async saveArtifacts() {
    const artifactDir = join(process.cwd(), ".amalfa/artifacts/semantic");
    
    await Bun.write(
      join(artifactDir, "lexicon-map.json"),
      JSON.stringify(this.artifacts.lexiconMap, null, 2)
    );
    await Bun.write(
      join(artifactDir, "fixture-extractions.json"),
      JSON.stringify(this.artifacts.rawExtractions, null, 2)
    );
    await Bun.write(
      join(artifactDir, "proposed-triples.json"),
      JSON.stringify(this.artifacts.proposedTriples, null, 2)
    );
    
    this.log.info(`📦 Artifacts saved to ${artifactDir}`);
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

    // 1. Ingest Fixtures (CL/CDA)
    await this.ingestFixtures();

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
          this.artifacts.rawExtractions.push({ id: docId, source: relativePath, ...result });

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
              this.artifacts.proposedTriples.push({ s: docId, p: "links_to", o: resolvedId, method: "doc-to-entity" });
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

              this.artifacts.proposedTriples.push({ s: resolvedSource, p: rel.predicate, o: resolvedTarget, method: "triplifier" });
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
      await this.saveArtifacts();

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

  private async ingestFixtures() {
    const fixtures = this.config.fixtures;
    if (!fixtures) return;

    if (fixtures.lexicon) {
      await this.ingestLexicon(fixtures.lexicon);
    }
    if (fixtures.cda) {
      await this.ingestCDA(fixtures.cda);
    }
  }

  private async ingestLexicon(path: string) {
    this.log.info(`📖 Ingesting Conceptual Lexicon: ${path}`);
    try {
      const content = await Bun.file(path).json();
      
      // Pass 1: Build local ID map for internal resolution
      for (const entry of content) {
        const id = entry.title.toLowerCase().replace(/\s+/g, "-");
        this.lexicon.set(entry.title.toLowerCase(), id);
        this.formalLexicon.set(entry.title.toLowerCase(), id);
      }

      this.db.beginTransaction();
      for (const entry of content) {
        const id = entry.title.toLowerCase().replace(/\s+/g, "-");
        this.db.insertNode({
          id,
          type: "concept",
          label: entry.title,
          domain: "lexicon",
          layer: "foundation",
          summary: entry.description,
          meta: { ...entry, source: "lexicon-fixture" }
        });

        // 1. Precise extraction (Triplifier)
        const result = await this.engine.processDocument(entry.description, id);
        this.artifacts.rawExtractions.push({ id, source: "lexicon", ...result });

        for (const rel of result.relationships) {
          const targetEntity = result.entities.find(e => e.id === rel.targetId);
          const resolvedTarget = targetEntity 
            ? this.resolveId(targetEntity.label, rel.targetId)
            : this.resolveId(rel.targetId, rel.targetId);
          
          this.artifacts.proposedTriples.push({ s: id, p: rel.predicate, o: resolvedTarget, method: "triplifier" });
          this.db.insertSemanticEdge(id, resolvedTarget, rel.predicate, rel.confidence, 1.0, "lexicon-fixture");
        }

        // 2. Lexical fallback (Strict Keyword matching)
        this.linkByKeywords(id, entry.description, "lexicon-fixture", true);
      }
      this.db.commit();
    } catch (e) {
      this.log.error({ err: e }, "❌ Failed to ingest lexicon fixture");
      this.db.rollback();
    }
  }

  private async ingestCDA(path: string) {
    this.log.info(`📜 Ingesting Core Directives Array: ${path}`);
    try {
      const content = await Bun.file(path).json();

      // Pass 1: Build local ID map
      for (const section of content.directives) {
        for (const entry of section.entries) {
          const id = entry.id.toLowerCase();
          const title = entry.title || entry.term || id;
          this.lexicon.set(title.toLowerCase(), id);
          this.lexicon.set(id, id);
          this.formalLexicon.set(title.toLowerCase(), id);
          this.formalLexicon.set(id, id);
        }
      }

      this.db.beginTransaction();
      for (const section of content.directives) {
        for (const entry of section.entries) {
          const id = entry.id.toLowerCase();
          const title = entry.title || entry.term || id;
          this.db.insertNode({
            id,
            type: entry.id.match(/^[A-Z]+/) ? "directive" : "concept",
            label: title,
            domain: "lexicon",
            layer: "cda",
            summary: entry.definition,
            meta: { ...entry, section: section.section, source: "cda-fixture" }
          });

          // 1. Precise extraction (Triplifier)
          const result = await this.engine.processDocument(entry.definition, id);
          this.artifacts.rawExtractions.push({ id, source: "cda", ...result });

          for (const rel of result.relationships) {
            const targetEntity = result.entities.find(e => e.id === rel.targetId);
            const resolvedTarget = targetEntity
              ? this.resolveId(targetEntity.label, rel.targetId)
              : this.resolveId(rel.targetId, rel.targetId);
            
            this.artifacts.proposedTriples.push({ s: id, p: rel.predicate, o: resolvedTarget, method: "triplifier" });
            this.db.insertSemanticEdge(id, resolvedTarget, rel.predicate, rel.confidence, 1.0, "cda-fixture");
          }

          // 2. Lexical fallback (Strict)
          this.linkByKeywords(id, entry.definition, "cda-fixture", true);
        }
      }
      this.db.commit();
    } catch (e) {
      this.log.error({ err: e }, "❌ Failed to ingest CDA fixture");
      this.db.rollback();
    }
  }

  /**
   * Scans text for lexicon terms and creates links.
   * Minimalist 'EdgeWeaver' for semantic ingestion.
   */
  private linkByKeywords(sourceId: string, text: string, origin: string, strict: boolean = false) {
    if (!text) return;
    const lowered = text.toLowerCase();
    
    // Noise terms to skip (common words that happen to be in node titles/ids)
    const noiseTerms = new Set(["text", "target", "source", "link", "process", "result", "data", "info", "model", "tools", "instance", "context", "pattern", "graph", "agents", "baseline", "content", "describe"]);

    const targetLexicon = strict ? this.formalLexicon : this.lexicon;

    for (const [term, targetId] of targetLexicon.entries()) {
      // Don't link to self
      if (targetId === sourceId) continue;
      
      // Quality filters
      if (term.length < 5 && !term.match(/^[a-z]+-\d+/)) continue; // Allow short formal IDs (OH-1)
      if (!strict && noiseTerms.has(term)) continue;

      // Only link if the term is found as a whole word or significant substring
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(lowered)) {
        this.artifacts.proposedTriples.push({ s: sourceId, p: "ctx:mentions", o: targetId, method: "lexical", mode: strict ? "strict" : "loose" });
        this.db.insertSemanticEdge(sourceId, targetId, "ctx:mentions", 0.6, 1.0, origin);
      }
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
