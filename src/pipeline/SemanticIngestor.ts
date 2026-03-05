/**
 * Semantic Ingestor (The Persona Factory)
 * Implements OH-132: Deterministic Record Pipeline (JSONL).
 * Focuses on high-fidelity visual clustering and reachability.
 */

import { join } from "node:path";
import type { AmalfaConfig } from "@src/config/defaults";
import { SemanticDB } from "@src/resonance/SemanticDB";
import { ResonanceDB } from "@src/resonance/db";
import { TriplifierEngine } from "@src/semantic/TriplifierEngine";
import { JsonlUtils } from "@src/utils/JsonlUtils";
import { getLogger } from "@src/utils/Logger";

export interface SemanticIngestionResult {
  success: boolean;
  stats: {
    lexiconRecords: number;
    cdaRecords: number;
    totalEdges: number;
    durationSec: number;
  };
}

export class SemanticIngestor {
  private log = getLogger("SemanticIngestor");
  private engine: TriplifierEngine;
  private lexicon: Map<string, string> = new Map();
  private formalLexicon: Map<string, string> = new Map();
  private artifacts = {
    proposedTriples: [] as any[],
  };

  constructor(
    private config: AmalfaConfig,
    private db: SemanticDB,
    private resonanceDb?: ResonanceDB,
  ) {
    this.engine = new TriplifierEngine();
    if (this.resonanceDb) {
      this.buildInitialLexicon();
    }
  }

  private buildInitialLexicon() {
    if (!this.resonanceDb) return;
    const nodes = this.resonanceDb.getNodes({ excludeContent: true });
    for (const node of nodes) {
      this.lexicon.set(node.id.toLowerCase(), node.id);
      if (node.label) this.lexicon.set(node.label.toLowerCase(), node.id);
    }
  }

  async ingest(): Promise<SemanticIngestionResult> {
    const startTime = performance.now();
    const fixtures = this.config.fixtures;

    if (!fixtures || !fixtures.semanticLexicon || !fixtures.semanticCda || !fixtures.semanticBestiary || !fixtures.semanticLifecycle) {
      throw new Error("Missing semantic JSONL fixtures in settings.");
    }

    this.log.info("🧪 Starting deterministic persona factory ingestion (JSONL)");

    // Pass 1: Build high-fidelity resolution map
    await this.scanForIds(fixtures.semanticLexicon);
    await this.scanForIds(fixtures.semanticCda);
    await this.scanForIds(fixtures.semanticBestiary);
    await this.scanForIds(fixtures.semanticLifecycle);

    // Pass 2: Ingest Records
    const lexiconCount = await this.ingestJsonl(fixtures.semanticLexicon, "lexicon");
    const cdaCount = await this.ingestJsonl(fixtures.semanticCda, "cda");
    const bestiaryCount = await this.ingestBestiary(fixtures.semanticBestiary);
    const lifecycleCount = await this.ingestJsonl(fixtures.semanticLifecycle, "lifecycle");

    this.db.checkpoint();
    await this.postProcess();
    await this.saveArtifacts();

    const durationSec = (performance.now() - startTime) / 1000;

    return {
      success: true,
      stats: {
        lexiconRecords: lexiconCount,
        cdaRecords: cdaCount + bestiaryCount,
        totalEdges: this.artifacts.proposedTriples.length,
        durationSec,
      },
    };
  }

  private async scanForIds(path: string) {
    await JsonlUtils.process(path, (record: any) => {
      const title = record.title || record.term || record.id;
      const id = this.engine.slugify(title);
      this.lexicon.set(title.toLowerCase(), id);
      this.formalLexicon.set(title.toLowerCase(), id);
    });
  }

  private async ingestJsonl(path: string, origin: string): Promise<number> {
    let count = 0;
    this.db.beginTransaction();

    await JsonlUtils.process(path, async (record: any) => {
      const title = record.title || record.term || record.id;
      const id = this.engine.slugify(title);
      const definition = record.description || record.definition || "";
      
      const nodeType = this.detectType(id, title);
      const layer = this.detectLayer(id, record.section || record.category || record.layer);

      // 0. Implicit Governance Roots
      const layerRoot = layer === "philosophical" ? "philosophical-core" : 
                        layer === "substrate" ? "substrate-bestiary" : "operational-competencies";
      
      this.db.insertNode({
        id: layerRoot,
        type: "root",
        label: layerRoot.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        domain: "persona",
        layer: "root",
        summary: `Structural root for ${layer} persona elements.`,
        confidenceScore: 1.0,
        saliencyScore: 1.0
      });
      this.db.insertSemanticEdge(layerRoot, id, "ctx:governs", 1.0, 1.0, "implicit-governance", 1.0);

      // 1. Insert the Node
      this.db.insertNode({
        id,
        type: nodeType,
        label: title,
        domain: "persona",
        layer,
        summary: definition,
        confidenceScore: 1.0,
        saliencyScore: 1.0,
        meta: {
          ...record,
          fixture_path: path, // Real path for JQ resolution
          source: `persona/${layer}/${nodeType}s`, // Virtual path for UI clustering
        },
      });


      // 2. Extract Relationships
      const result = await this.engine.processDocument(definition, id);
      for (const rel of result.relationships) {
        const targetEntity = result.entities.find(e => e.id === rel.targetId);
        const resolvedTarget = targetEntity 
          ? this.resolveId(targetEntity.label, rel.targetId)
          : this.resolveId(rel.targetId, rel.targetId);
        
        this.addProposedTriple(id, rel.predicate, resolvedTarget, "triplifier");
      }

      // 3. Bestiary Mitigations
      if (record.mitigation) {
        this.linkMitigations(id, record.mitigation);
      }

      // 4. Embedded Triples (From Weaving or Manual Editing)
      if (record.triples && Array.isArray(record.triples)) {
        for (const triple of record.triples) {
          if (triple.s && triple.p && triple.o) {
            this.addProposedTriple(triple.s, triple.p, triple.o, triple.method || "embedded");
          }
        }
      }

      // 5. Keyword Fallback (Strict)
      this.linkByKeywords(id, definition, `factory/${origin}`, true);
      
      count++;
    });

    this.db.commit();
    this.log.info(`✅ Ingested ${count} records from ${path}`);
    return count;
  }

  private async ingestBestiary(path: string): Promise<number> {
    let count = 0;
    this.db.beginTransaction();

    // Ensure substrate root exists
    const rootId = "substrate-tendencies";
    this.db.insertNode({
      id: rootId,
      type: "root",
      label: "Substrate Bestiary",
      domain: "persona",
      layer: "substrate",
      summary:
        "Root for known AI substrate failure modes and stochastic behaviors.",
      confidenceScore: 1.0,
      saliencyScore: 1.0
    });

    await JsonlUtils.process(path, async (record: any) => {
      const id = this.engine.slugify(record.title);
      this.db.insertNode({
        id,
        type: "tendency",
        label: record.title,
        domain: "persona",
        layer: "substrate",
        summary: record.description,
        confidenceScore: 0.8, // Observations are reasonably trusted
        saliencyScore: 0.5,   // Start as "Warm"
        meta: { 
          ...record, 
          fixture_path: path, // Real path for JQ
          source: "factory/bestiary" 
        },
      });


      this.db.insertSemanticEdge(
        rootId,
        id,
        "ctx:governs",
        1.0,
        1.0,
        "implicit-governance",
        1.0
      );

      // Link Mitigations
      if (record.mitigation) {
        this.linkMitigations(id, record.mitigation);
      }

      count++;
    });

    this.db.commit();
    this.log.info(`✅ Ingested ${count} bestiary records from ${path}`);
    return count;
  }

  private detectType(id: string, title: string): string {
    const full = `${id} ${title}`.toUpperCase();
    if (
      full.includes("BESTIARY") ||
      id.match(/trap|gravity|bias|collapse|brittleness|smell|detachment|maxxing/i)
    ) {
      return "tendency";
    }
    // Directive IDs or Titles
    if (
      /^(OH|CIP|PHI|COG|ADV|OPM|QHD|IEP)-/i.test(id) ||
      /^(OH|CIP|PHI|COG|ADV|OPM|QHD|IEP)-/i.test(title) ||
      full.includes("PRINCIPLE") ||
      full.includes("PROTOCOL") ||
      full.includes("MANDATE")
    ) {
      return "directive";
    }
    return "concept";
  }

  private detectLayer(id: string, context?: string): string {
    const full = `${id} ${context || ""}`.toUpperCase();
    if (full.includes("SUBSTRATE") || full.includes("BESTIARY")) return "substrate";
    if (full.includes("PHI-") || full.includes("CIP-") || full.includes("COG-") || 
        full.includes("PHILOSOPHY") || full.includes("INTEGRITY")) {
      return "philosophical";
    }
    return "operational";
  }

  private linkMitigations(tendencyId: string, mitigationText: string) {
    if (!mitigationText) return;
    const lowered = mitigationText.toLowerCase();

    // 1. Precise ID match (OH-001, PHI-5)
    const idPattern = /([A-Z]+-\d+)/gi;
    const idMatches = mitigationText.match(idPattern);
    if (idMatches) {
      for (const match of idMatches) {
        const resolvedId = this.resolveId(match, "");
        if (resolvedId && resolvedId !== "") {
          this.addProposedTriple(resolvedId, "ctx:mitigates", tendencyId, "bestiary-id-link");
        }
      }
    }

    // 2. Keyword fallback (match titles in mitigation text)
    for (const [term, targetId] of this.formalLexicon.entries()) {
      if (term.length < 5) continue;
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(lowered)) {
        this.addProposedTriple(targetId, "ctx:mitigates", tendencyId, "bestiary-keyword-link");
      }
    }
  }

  private resolveId(text: string, originalId: string): string {
    const lowered = text.toLowerCase().trim();
    if (this.lexicon.has(lowered)) return this.lexicon.get(lowered)!;

    const slugged = this.engine.slugify(text);
    if (this.lexicon.has(slugged)) return this.lexicon.get(slugged)!;

    return originalId;
  }

  private addProposedTriple(s: string, p: string, o: string, method: string) {
    this.artifacts.proposedTriples.push({ s, p, o, method });
    this.db.insertSemanticEdge(s, o, p, 0.9, 1.0, "persona-factory", 0.5);
  }

  private linkByKeywords(sourceId: string, text: string, origin: string, strict: boolean) {
    if (!text) return;
    const lowered = text.toLowerCase();
    const noise = new Set(["text", "target", "source", "link", "process", "result", "data", "info", "model", "tools", "instance", "context", "pattern", "graph", "agents", "baseline", "content", "describe"]);

    for (const [term, targetId] of this.formalLexicon.entries()) {
      if (targetId === sourceId || term.length < 5 || noise.has(term)) continue;
      const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(lowered)) {
        this.addProposedTriple(sourceId, "ctx:mentions", targetId, "lexical-strict");
      }
    }
  }

  private async postProcess() {
    this.log.info(
      "🧹 Starting post-processing: Outlier detection & Mitigation audit...",
    );

    // 1. Create Mitigation Backlog Node
    const todoId = "todo-mitigation-backlog";
    this.db.insertNode({
      id: todoId,
      type: "root",
      label: "Mitigation Backlog",
      domain: "persona",
      layer: "root",
      summary:
        "Strategic TODO: Substrate tendencies requiring formal operational mitigations.",
    });

    // 2. Link Un-mitigated Tendencies to Backlog
    this.db.getRawDb().run(
      `
      INSERT INTO edges (source, target, type, confidence, veracity, context_source)
      SELECT ?, n.id, 'ctx:requiresMitigation', 1.0, 1.0, 'factory/audit'
      FROM nodes n
      WHERE n.type = 'tendency'
      AND NOT EXISTS (
        SELECT 1 FROM edges e 
        WHERE e.target = n.id AND (e.type = 'ctx:mitigates' OR e.type = 'ctx:mitigatedBy')
      )
    `,
      [todoId],
    );

    // 3. Categorize Outliers
    // Find absolute orphans (no organic edges) and move to 'outlier' layer
    this.db.getRawDb().run(`
      UPDATE nodes 
      SET 
        meta = json_set(COALESCE(meta, '{}'), '$.original_layer', layer),
        layer = 'outlier'
      WHERE id IN (
        SELECT n.id
        FROM nodes n
        WHERE n.domain = 'persona' AND n.type NOT IN ('root', 'tendency')
        AND NOT EXISTS (
          SELECT 1 FROM edges e 
          WHERE (e.source = n.id OR e.target = n.id)
          AND e.type NOT IN ('ctx:governs', 'ctx:requiresMitigation', 'ctx:mentions')
        )
      )
    `);
  }

  private async saveArtifacts() {
    const artifactDir = join(process.cwd(), "docs/temp-semantic-artifacts");
    await Bun.write(join(artifactDir, "factory-triples.jsonl"), 
      this.artifacts.proposedTriples.map(t => JSON.stringify(t)).join("\n") + "\n");
  }
}
