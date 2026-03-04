/**
 * TriplifierEngine.ts
 * LLM-powered entity extraction and RDF triple generation
 *
 * This module transforms unstructured text into semantic triples,
 * enabling the Ctx persona to reason over arbitrary document corpora
 * using formal ontologies.
 *
 * Design Philosophy (PHI-1: Abstract & Structure):
 * - Transform "Stuff" (raw text) into "Things" (semantic triples)
 * - Every extraction is tethered to its source document
 * - Ontology-driven predicate selection ensures consistency
 */

import type { Database } from "bun:sqlite";
import {
  CLASSES,
  ctxUri,
  documentUri,
  formatAsNTriples,
  PREDICATES,
  resourceUri,
  type Triple,
  type TripleWithProvenance,
} from "./RdfContext";
import { TripleMapper } from "./TripleMapper";

// === EXTRACTION INTERFACES ===

export interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
  triples: TripleWithProvenance[];
  metadata: {
    sourceId: string;
    extractionTime: number;
    modelUsed: string;
    tokensUsed?: number;
  };
}

export interface ExtractedEntity {
  id: string;
  label: string;
  type: string;
  definition?: string;
  confidence: number;
  startPosition?: number;
  endPosition?: number;
}

export interface ExtractedRelationship {
  sourceId: string;
  targetId: string;
  predicate: string;
  confidence: number;
  context?: string;
}

export interface TriplifierConfig {
  /** LLM endpoint for entity extraction (optional - uses rules if not provided) */
  llmEndpoint?: string;
  /** Model to use for extraction */
  model?: string;
  /** Minimum confidence threshold for including triples */
  confidenceThreshold?: number;
  /** Whether to extract definitions */
  extractDefinitions?: boolean;
  /** Custom ontology predicates to use */
  customPredicates?: string[];
  /** Domain sleeve configuration */
  domainSleeve?: DomainSleeve;
}

export interface DomainSleeve {
  name: string;
  nodeTypes: string[];
  predicates: string[];
  mandatoryPredicates?: string[];
  extractionPrompt?: string;
}

// === ONTOLOGY SCHEMA ===

/**
 * Default ontology schema for Ctx persona artifacts
 */
export const CTX_ONTOLOGY_SCHEMA = {
  // Node types (classes)
  classes: {
    Heuristic: {
      label: "Operational Heuristic",
      description: "A protocol or procedure for the Ctx persona",
      prefixes: ["OH-", "oh-"],
    },
    Directive: {
      label: "Core Directive",
      description: "A governing rule from the CDA",
      prefixes: ["CIP-", "PHI-", "COG-", "ADV-"],
    },
    SubstrateIssue: {
      label: "Substrate Issue",
      description: "A risk or problem category",
      prefixes: [],
    },
    Concept: {
      label: "Core Concept",
      description: "A foundational idea or term",
      prefixes: [],
    },
    Document: {
      label: "Document",
      description: "A source document",
      prefixes: [],
    },
    Protocol: {
      label: "Protocol",
      description: "A structured process",
      prefixes: [],
    },
  },

  // Predicate definitions
  predicates: {
    implements: {
      label: "implements",
      domain: "Heuristic",
      range: "Directive",
      description: "This heuristic implements a directive",
    },
    guided_by: {
      label: "guided by",
      domain: "Heuristic",
      range: ["Directive", "Heuristic", "Concept"],
      description: "This heuristic is guided by another artifact",
    },
    mitigates: {
      label: "mitigates",
      domain: ["Heuristic", "Directive"],
      range: "SubstrateIssue",
      description: "This artifact mitigates a substrate issue",
    },
    constrained_by: {
      label: "constrained by",
      domain: "Heuristic",
      range: "Directive",
      description: "This heuristic is constrained by a directive",
    },
    relatesTo: {
      label: "relates to",
      domain: "Resource",
      range: "Resource",
      description: "Generic relationship between resources",
    },
    hasPart: {
      label: "has part",
      domain: "Resource",
      range: "Resource",
      description: "Part-whole relationship",
    },
    dependsOn: {
      label: "depends on",
      domain: "Resource",
      range: "Resource",
      description: "Dependency relationship",
    },
  },
};

// === TRILIPLIFIER ENGINE CLASS ===

export class TriplifierEngine {
  private db: Database;
  private config: TriplifierConfig;
  private mapper: TripleMapper;

  constructor(db: Database, config: TriplifierConfig = {}) {
    this.db = db;
    this.config = {
      confidenceThreshold: 0.7,
      extractDefinitions: true,
      model: "rule-based",
      ...config,
    };
    this.mapper = new TripleMapper(db);
  }

  /**
   * Process a document and extract semantic triples
   */
  async processDocument(
    content: string,
    sourceId: string,
    metadata?: Record<string, unknown>,
  ): Promise<ExtractionResult> {
    const startTime = performance.now();

    // Step 1: Extract entities using rule-based patterns
    const entities = this.extractEntities(content, sourceId);

    // Step 2: Extract relationships between entities
    const relationships = this.extractRelationships(
      content,
      entities,
      sourceId,
    );

    // Step 3: Generate triples from extractions
    const triples = this.generateTriples(entities, relationships, sourceId);

    // Step 4: Add provenance triples
    const provenanceTriples = this.addProvenance(triples, sourceId);

    const endTime = performance.now();

    return {
      entities,
      relationships,
      triples: provenanceTriples,
      metadata: {
        sourceId,
        extractionTime: endTime - startTime,
        modelUsed: this.config.model || "rule-based",
      },
    };
  }

  /**
   * Extract entities from text using rule-based patterns
   */
  private extractEntities(
    content: string,
    sourceId: string,
  ): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Pattern 1: Heuristic IDs (OH-XXX)
    const heuristicPattern = /\b(OH-\d{3})\b/g;
    let match;
    while ((match = heuristicPattern.exec(content)) !== null) {
      entities.push({
        id: match[1],
        label: match[1],
        type: "Heuristic",
        confidence: 1.0,
        startPosition: match.index,
        endPosition: match.index + match[1].length,
      });
    }

    // Pattern 2: Directive IDs (CIP-X, PHI-X, COG-X, ADV-X)
    const directivePattern = /\b(CIP-\d+|PHI-\d+|COG-\d+|ADV-\d+)\b/g;
    while ((match = directivePattern.exec(content)) !== null) {
      entities.push({
        id: match[1],
        label: match[1],
        type: "Directive",
        confidence: 1.0,
        startPosition: match.index,
        endPosition: match.index + match[1].length,
      });
    }

    // Pattern 3: Substrate Issues (in brackets or tagged)
    const issuePattern =
      /\[(?:Substrate_Issue|Issue):\s*([^\]]+)\]|\bBiddability\b|\bReward_Hacking\b|\bComplexity_Collapse\b/gi;
    while ((match = issuePattern.exec(content)) !== null) {
      const issueName = match[1] || match[0];
      const normalized = issueName.replace(/\s+/g, "_").trim();
      entities.push({
        id: normalized,
        label: issueName.trim(),
        type: "SubstrateIssue",
        confidence: 0.9,
        startPosition: match.index,
        endPosition: match.index + match[0].length,
      });
    }

    // Pattern 4: WikiLinks [[Entity]]
    const wikiLinkPattern = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    while ((match = wikiLinkPattern.exec(content)) !== null) {
      const entityName = match[1].trim();
      const id = this.slugify(entityName);
      entities.push({
        id,
        label: entityName,
        type: "Resource",
        confidence: 0.95,
        startPosition: match.index,
        endPosition: match.index + match[0].length,
      });
    }

    // Pattern 5: Tags [Tag: Value] or [Key: Value]
    const tagPattern = /\[(\w+):\s*([^\]]+)\]/g;
    while ((match = tagPattern.exec(content)) !== null) {
      const key = match[1];
      const value = match[2].trim();
      entities.push({
        id: this.slugify(value),
        label: value,
        type: this.inferTypeFromTag(key),
        confidence: 0.85,
        startPosition: match.index,
        endPosition: match.index + match[0].length,
      });
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    return entities.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  }

  /**
   * Extract relationships between entities
   */
  private extractRelationships(
    content: string,
    entities: ExtractedEntity[],
    sourceId: string,
  ): ExtractedRelationship[] {
    const relationships: ExtractedRelationship[] = [];

    // Build entity position map for proximity analysis
    const entityPositions = new Map<string, ExtractedEntity>();
    for (const entity of entities) {
      if (entity.startPosition !== undefined) {
        entityPositions.set(entity.id, entity);
      }
    }

    // Pattern 1: Explicit relationship syntax [RELATION: Target]
    const relationPattern = /\[(\w+):\s*([^\]]+)\]/g;
    let match;
    while ((match = relationPattern.exec(content)) !== null) {
      const predicate = match[1].toLowerCase();
      const targetLabel = match[2].trim();
      const targetId = this.slugify(targetLabel);

      // Find the nearest entity before this relation
      const nearestEntity = this.findNearestEntity(
        match.index,
        entities,
        "before",
      );

      if (nearestEntity && predicate !== "tag") {
        relationships.push({
          sourceId: nearestEntity.id,
          targetId,
          predicate: this.normalizePredicate(predicate),
          confidence: 0.9,
          context: match[0],
        });
      }
    }

    // Pattern 2: "X implements Y" or "X mitigates Y" syntax
    const verbPattern =
      /\b(\w+(?:\s+\w+)?)\s+(implements|mitigates|guides|constrains|depends\s+on|relates\s+to)\s+(\w+(?:\s+\w+)?)\b/gi;
    while ((match = verbPattern.exec(content)) !== null) {
      const sourceLabel = match[1].trim();
      const predicate = match[2].toLowerCase().replace(/\s+/g, "_");
      const targetLabel = match[3].trim();

      const sourceId = this.slugify(sourceLabel);
      const targetId = this.slugify(targetLabel);

      relationships.push({
        sourceId,
        targetId,
        predicate: this.normalizePredicate(predicate),
        confidence: 0.8,
        context: match[0],
      });
    }

    // Pattern 3: Proximity-based relationships (entities close to each other)
    for (let i = 0; i < entities.length - 1; i++) {
      const current = entities[i];
      const next = entities[i + 1];

      if (
        current.startPosition !== undefined &&
        next.startPosition !== undefined
      ) {
        const distance = next.startPosition - current.endPosition!;

        // If entities are within 100 characters, suggest a relationship
        if (distance > 0 && distance < 100) {
          relationships.push({
            sourceId: current.id,
            targetId: next.id,
            predicate: "ctx:relatesTo",
            confidence: 0.5,
            context: content.substring(current.startPosition, next.endPosition),
          });
        }
      }
    }

    return relationships;
  }

  /**
   * Generate RDF triples from extracted entities and relationships
   */
  private generateTriples(
    entities: ExtractedEntity[],
    relationships: ExtractedRelationship[],
    sourceId: string,
  ): TripleWithProvenance[] {
    const triples: TripleWithProvenance[] = [];

    // Generate type triples for entities
    for (const entity of entities) {
      if (entity.confidence >= (this.config.confidenceThreshold || 0.7)) {
        const subjectUri = this.getEntityUri(entity);

        // Type triple
        triples.push({
          subject: subjectUri,
          predicate: "rdf:type",
          object: `ctx:${entity.type}`,
          objectType: "uri",
          sourceDocument: sourceId,
          confidence: entity.confidence,
        });

        // Label triple
        triples.push({
          subject: subjectUri,
          predicate: "rdfs:label",
          object: entity.label,
          objectType: "literal",
          sourceDocument: sourceId,
          confidence: entity.confidence,
        });

        // Definition triple (if available)
        if (entity.definition) {
          triples.push({
            subject: subjectUri,
            predicate: "ctx:definition",
            object: entity.definition,
            objectType: "literal",
            sourceDocument: sourceId,
            confidence: entity.confidence,
          });
        }
      }
    }

    // Generate relationship triples
    for (const rel of relationships) {
      if (rel.confidence >= (this.config.confidenceThreshold || 0.7)) {
        const sourceUri = this.getEntityUri({
          id: rel.sourceId,
          type: "Resource",
        } as ExtractedEntity);
        const targetUri = this.getEntityUri({
          id: rel.targetId,
          type: "Resource",
        } as ExtractedEntity);

        triples.push({
          subject: sourceUri,
          predicate: rel.predicate.startsWith("ctx:")
            ? rel.predicate
            : `ctx:${rel.predicate}`,
          object: targetUri,
          objectType: "uri",
          sourceDocument: sourceId,
          confidence: rel.confidence,
        });
      }
    }

    return triples;
  }

  /**
   * Add provenance triples linking extractions to source document
   */
  private addProvenance(
    triples: TripleWithProvenance[],
    sourceId: string,
  ): TripleWithProvenance[] {
    const sourceUri = documentUri(sourceId);

    // Add isDerivedFrom triple for each unique subject
    const subjects = new Set(triples.map((t) => t.subject));
    const provenanceTriples: TripleWithProvenance[] = [];

    for (const subject of subjects) {
      provenanceTriples.push({
        subject,
        predicate: "ctx:isDerivedFrom",
        object: sourceUri,
        objectType: "uri",
        sourceDocument: sourceId,
        confidence: 1.0,
        veracity: 1.0,
      });
    }

    return [...triples, ...provenanceTriples];
  }

  /**
   * Persist extracted triples to the database
   */
  async persistTriples(result: ExtractionResult): Promise<void> {
    this.db.run("BEGIN TRANSACTION");

    try {
      for (const triple of result.triples) {
        // Insert node (if not exists)
        const nodeId = this.extractIdFromUri(triple.subject);
        const nodeType = this.extractTypeFromUri(triple.object);

        this.db.run(
          `INSERT OR IGNORE INTO nodes (id, type, title, domain, layer)
           VALUES (?, ?, ?, 'semantic', 'extracted')`,
          [
            nodeId,
            nodeType || "Resource",
            triple.objectType === "literal" ? triple.object : nodeId,
          ],
        );

        // Insert edge for relationship triples
        if (triple.objectType === "uri" && triple.predicate !== "rdf:type") {
          const predicateName = triple.predicate
            .replace("ctx:", "")
            .toUpperCase();
          const targetId = this.extractIdFromUri(triple.object);

          this.db.run(
            `INSERT OR IGNORE INTO edges (source, target, type, confidence, context_source)
             VALUES (?, ?, ?, ?, ?)`,
            [
              nodeId,
              targetId,
              predicateName,
              triple.confidence || 1.0,
              triple.sourceDocument || null,
            ],
          );
        }
      }

      this.db.run("COMMIT");
    } catch (error) {
      this.db.run("ROLLBACK");
      throw error;
    }
  }

  // === HELPER METHODS ===

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private inferTypeFromTag(tagKey: string): string {
    const typeMap: Record<string, string> = {
      implements: "Directive",
      mitigates: "SubstrateIssue",
      guided_by: "Directive",
      constrained_by: "Directive",
      tag: "Concept",
      category: "Concept",
    };
    return typeMap[tagKey.toLowerCase()] || "Resource";
  }

  private normalizePredicate(predicate: string): string {
    const normalized = predicate.toLowerCase().replace(/[\s-]+/g, "_");
    const predicateMap: Record<string, string> = {
      implements: "ctx:implements",
      mitigates: "ctx:mitigates",
      guided_by: "ctx:guided_by",
      constrained_by: "ctx:constrained_by",
      guidedby: "ctx:guided_by",
      constrainedby: "ctx:constrained_by",
      depends_on: "ctx:dependsOn",
      dependson: "ctx:dependsOn",
      relates_to: "ctx:relatesTo",
      relatesto: "ctx:relatesTo",
      has_part: "ctx:hasPart",
      haspart: "ctx:hasPart",
    };
    return predicateMap[normalized] || `ctx:${normalized}`;
  }

  private getEntityUri(entity: ExtractedEntity): string {
    // Use appropriate URI based on entity type
    if (entity.type === "Heuristic" || entity.id.startsWith("OH-")) {
      return ctxUri("heuristic", entity.id);
    }
    if (entity.type === "Directive" || /^(CIP|PHI|COG|ADV)-/.test(entity.id)) {
      return ctxUri("directive", entity.id);
    }
    if (entity.type === "SubstrateIssue") {
      return ctxUri("issue", entity.id);
    }
    return resourceUri(entity.id);
  }

  private findNearestEntity(
    position: number,
    entities: ExtractedEntity[],
    direction: "before" | "after",
  ): ExtractedEntity | null {
    let nearest: ExtractedEntity | null = null;
    let minDistance = Infinity;

    for (const entity of entities) {
      if (entity.startPosition === undefined) continue;

      const distance =
        direction === "before"
          ? position - entity.startPosition
          : entity.startPosition - position;

      if (distance > 0 && distance < minDistance) {
        minDistance = distance;
        nearest = entity;
      }
    }

    return nearest;
  }

  private extractIdFromUri(uri: string): string {
    // Extract ID from ctx:resource/ID or http://ctx.ai/ontology/resource/ID
    const match = uri.match(
      /(?:ctx:|(?:http:\/\/ctx\.ai\/ontology\/))\w+\/(.+)$/,
    );
    return match ? match[1] : uri;
  }

  private extractTypeFromUri(uri: string): string | null {
    // Extract type from ctx:Type or http://ctx.ai/ontology/Type
    const match = uri.match(/(?:ctx:|(?:http:\/\/ctx\.ai\/ontology\/))(\w+)$/);
    return match ? match[1] : null;
  }

  /**
   * Export extraction results as N-Triples
   */
  exportAsNTriples(result: ExtractionResult): string {
    return result.triples.map(formatAsNTriples).join("\n");
  }

  /**
   * Get statistics about the triplifier
   */
  getStats(): {
    entitiesExtracted: number;
    relationshipsExtracted: number;
    triplesGenerated: number;
  } {
    // This would track cumulative stats across all processDocument calls
    // For now, return zeros (would need instance variables to track)
    return {
      entitiesExtracted: 0,
      relationshipsExtracted: 0,
      triplesGenerated: 0,
    };
  }
}

export default TriplifierEngine;
