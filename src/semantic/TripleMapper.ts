/**
 * TripleMapper.ts
 * Maps SQLite Nodes and Edges to RDF Triples
 *
 * This module transforms the relational property graph (SQLite) into
 * semantic triples (RDF) for SPARQL querying. It operates as a virtual
 * view over the existing schema without requiring database changes.
 */

import type { Database } from "bun:sqlite";
import {
  expandPrefixedName,
  formatAsNTriples,
  inferClassFromType,
  NAMESPACES,
  normalizePredicate,
  resourceUri,
  type Triple,
  type TripleWithProvenance,
} from "./RdfContext";

export interface NodeRow {
  id: string;
  type: string;
  title: string | null;
  domain: string | null;
  layer: string | null;
  hash: string | null;
  meta: string | null;
  date: string | null;
}

export interface EdgeRow {
  source: string;
  target: string;
  type: string;
  confidence: number | null;
  veracity: number | null;
  context_source: string | null;
}

/**
 * TripleMapper transforms SQLite rows into RDF triples.
 * It creates a virtual RDF view over the property graph.
 */
export class TripleMapper {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Map a single Node to RDF triples
   * Generates type and label triples for each node
   */
  mapNode(node: NodeRow): Triple[] {
    const triples: Triple[] = [];
    const subjectUri = resourceUri(node.id);

    // 1. Type triple: node a ctx:Type
    const classUri = inferClassFromType(node.type);
    triples.push({
      subject: subjectUri,
      predicate: "rdf:type",
      object: classUri,
      objectType: "uri",
    });

    // 2. Label triple (if exists)
    if (node.title) {
      triples.push({
        subject: subjectUri,
        predicate: "rdfs:label",
        object: node.title,
        objectType: "literal",
      });
    }

    // 3. Domain triple (as category)
    if (node.domain) {
      triples.push({
        subject: subjectUri,
        predicate: "ctx:hasDomain",
        object: node.domain,
        objectType: "literal",
      });
    }

    // 4. Layer triple
    if (node.layer) {
      triples.push({
        subject: subjectUri,
        predicate: "ctx:hasLayer",
        object: node.layer,
        objectType: "literal",
      });
    }

    // 5. Date triple (temporal anchor)
    if (node.date) {
      triples.push({
        subject: subjectUri,
        predicate: "ctx:hasDate",
        object: node.date,
        objectType: "literal",
        datatype: "http://www.w3.org/2001/XMLSchema#dateTime",
      });
    }

    return triples;
  }

  /**
   * Map a single Edge to an RDF triple
   * Normalizes edge type to semantic predicate
   */
  mapEdge(edge: EdgeRow): TripleWithProvenance {
    const subjectUri = resourceUri(edge.source);
    const objectUri = resourceUri(edge.target);
    const predicateUri = normalizePredicate(edge.type);

    return {
      subject: subjectUri,
      predicate: predicateUri,
      object: objectUri,
      objectType: "uri",
      confidence: edge.confidence ?? undefined,
      veracity: edge.veracity ?? undefined,
      sourceDocument: edge.context_source ?? undefined,
    };
  }

  /**
   * Extract all triples from the database
   * Returns both node triples (type, label) and edge triples
   */
  extractAllTriples(): TripleWithProvenance[] {
    const triples: TripleWithProvenance[] = [];

    // Extract node triples
    const nodes = this.db
      .query(
        `SELECT id, type, title, domain, layer, hash, meta, date
         FROM nodes`,
      )
      .all() as NodeRow[];

    for (const node of nodes) {
      const nodeTriples = this.mapNode(node);
      triples.push(...nodeTriples);
    }

    // Extract edge triples
    const edges = this.db
      .query(
        `SELECT source, target, type, confidence, veracity, context_source
         FROM edges`,
      )
      .all() as EdgeRow[];

    for (const edge of edges) {
      triples.push(this.mapEdge(edge));
    }

    return triples;
  }

  /**
   * Extract triples for a specific node and its neighborhood
   * Useful for focused queries and visualization
   */
  extractNodeTriples(nodeId: string): TripleWithProvenance[] {
    const triples: TripleWithProvenance[] = [];

    // Get the node itself
    const node = this.db
      .query(
        `SELECT id, type, title, domain, layer, hash, meta, date
         FROM nodes WHERE id = ?`,
      )
      .get(nodeId) as NodeRow | undefined;

    if (node) {
      triples.push(...this.mapNode(node));
    }

    // Get outgoing edges
    const outgoing = this.db
      .query(
        `SELECT source, target, type, confidence, veracity, context_source
         FROM edges WHERE source = ?`,
      )
      .all(nodeId) as EdgeRow[];

    for (const edge of outgoing) {
      triples.push(this.mapEdge(edge));
    }

    // Get incoming edges
    const incoming = this.db
      .query(
        `SELECT source, target, type, confidence, veracity, context_source
         FROM edges WHERE target = ?`,
      )
      .all(nodeId) as EdgeRow[];

    for (const edge of incoming) {
      triples.push(this.mapEdge(edge));
    }

    return triples;
  }

  /**
   * Export all triples as N-Triples format
   * Suitable for loading into other RDF systems
   */
  exportAsNTriples(): string {
    const triples = this.extractAllTriples();
    return triples.map(formatAsNTriples).join("\n");
  }

  /**
   * Export triples as Turtle format (more readable)
   */
  exportAsTurtle(): string {
    const triples = this.extractAllTriples();

    // Group by subject for more compact representation
    const bySubject = new Map<string, TripleWithProvenance[]>();
    for (const triple of triples) {
      const existing = bySubject.get(triple.subject) || [];
      existing.push(triple);
      bySubject.set(triple.subject, existing);
    }

    const lines: string[] = [];

    // Add prefixes
    for (const [prefix, uri] of Object.entries(NAMESPACES)) {
      lines.push(`@prefix ${prefix}: <${uri}> .`);
    }
    lines.push("");

    // Add triples grouped by subject
    for (const [subject, subjectTriples] of bySubject) {
      const subjectUri = subject.startsWith("ctx:")
        ? subject
        : `<${expandPrefixedName(subject)}>`;

      lines.push(`${subjectUri}`);

      for (let i = 0; i < subjectTriples.length; i++) {
        const triple = subjectTriples[i];
        if (!triple) continue;

        const predicateUri = triple.predicate.startsWith("ctx:")
          ? triple.predicate
          : `<${expandPrefixedName(triple.predicate)}>`;

        let object: string;
        if (triple.objectType === "uri") {
          object = triple.object.startsWith("ctx:")
            ? triple.object
            : `<${expandPrefixedName(triple.object)}>`;
        } else {
          const escaped = triple.object
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"');
          object = `"${escaped}"`;
          if (triple.datatype) {
            object += `^^<${triple.datatype}>`;
          }
        }

        const separator = i === subjectTriples.length - 1 ? " ." : " ;";
        lines.push(`  ${predicateUri} ${object}${separator}`);
      }

      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Get triple count statistics
   */
  getStats(): {
    nodeTriples: number;
    edgeTriples: number;
    totalTriples: number;
    uniqueSubjects: number;
    uniquePredicates: number;
  } {
    const nodeCount = (
      this.db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
    ).c;

    const edgeCount = (
      this.db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number }
    ).c;

    // Each node generates at least 1 triple (type), up to 4+ (with label, domain, layer)
    // We estimate average 2 triples per node
    const nodeTriples = nodeCount * 2;

    const uniquePredicates = (
      this.db.query("SELECT COUNT(DISTINCT type) as c FROM edges").get() as {
        c: number;
      }
    ).c;

    return {
      nodeTriples,
      edgeTriples: edgeCount,
      totalTriples: nodeTriples + edgeCount,
      uniqueSubjects: nodeCount,
      uniquePredicates,
    };
  }

  /**
   * Find nodes that match a triple pattern
   * This is the core SPARQL-to-SQL translation helper
   */
  matchPattern(
    subject: string | null,
    predicate: string | null,
    object: string | null,
  ): TripleWithProvenance[] {
    const triples: TripleWithProvenance[] = [];

    // If we have a predicate, search edges
    if (predicate && predicate !== "rdf:type" && predicate !== "rdfs:label") {
      let sql =
        "SELECT source, target, type, confidence, veracity, context_source FROM edges WHERE 1=1";
      const params: (string | number)[] = [];

      if (subject) {
        sql += " AND source = ?";
        params.push(subject);
      }

      if (predicate) {
        // Map semantic predicate back to edge types
        const edgeTypes = this.predicateToEdgeTypes(predicate);
        if (edgeTypes.length === 1) {
          const type = edgeTypes[0];
          if (type) {
            sql += " AND type = ?";
            params.push(type);
          }
        } else if (edgeTypes.length > 1) {
          sql += ` AND type IN (${edgeTypes.map(() => "?").join(", ")})`;
          params.push(...edgeTypes);
        }
      }

      if (object) {
        sql += " AND target = ?";
        params.push(object);
      }

      const edges = this.db.query(sql).all(...params) as EdgeRow[];
      for (const edge of edges) {
        triples.push(this.mapEdge(edge));
      }
    }

    // Handle type triples
    if (predicate === "rdf:type" || !predicate) {
      let sql =
        "SELECT id, type, title, domain, layer, hash, meta, date FROM nodes WHERE 1=1";
      const params: (string | number)[] = [];

      if (subject) {
        sql += " AND id = ?";
        params.push(subject);
      }

      if (object) {
        // Map class URI to node type
        const nodeType = this.classToNodeType(object);
        if (nodeType) {
          sql += " AND type = ?";
          params.push(nodeType);
        }
      }

      const nodes = this.db.query(sql).all(...params) as NodeRow[];
      for (const node of nodes) {
        const nodeTriples = this.mapNode(node).filter((t) =>
          predicate ? t.predicate === predicate : true,
        );
        triples.push(...nodeTriples);
      }
    }

    return triples;
  }

  /**
   * Map semantic predicate back to SQLite edge types
   */
  private predicateToEdgeTypes(predicate: string): string[] {
    const normalized = predicate.replace(/^ctx:/, "").toUpperCase();

    // Direct match
    const direct = {
      IMPLEMENTS: ["IMPLEMENTS"],
      GUIDED_BY: ["GUIDED_BY"],
      MITIGATES: ["MITIGATES"],
      CONSTRAINED_BY: ["CONSTRAINED_BY"],
      CITES: ["CITES"],
      LINKSTO: ["LINKS_TO"],
      LINKS_TO: ["LINKS_TO"],
      TAGGEDAS: ["TAGGED_AS"],
      TAGGED_AS: ["TAGGED_AS"],
      RELATESTO: ["RELATED_TO"],
      RELATED_TO: ["RELATED_TO"],
      APPEARSIN: ["APPEARS_IN"],
      APPEARS_IN: ["APPEARS_IN"],
    };

    return direct[normalized as keyof typeof direct] || [normalized];
  }

  /**
   * Map RDF class URI to SQLite node type
   */
  private classToNodeType(classUri: string): string | null {
    const classMap: Record<string, string> = {
      "ctx:Heuristic": "heuristic",
      "ctx:Directive": "directive",
      "ctx:Concept": "concept",
      "ctx:Protocol": "protocol",
      "ctx:Document": "document",
      "ctx:SubstrateIssue": "issue",
      "ctx:Resource": "resource",
    };

    // Handle full URIs
    if (classUri.startsWith("http://ctx.ai/ontology/")) {
      const local = classUri.replace("http://ctx.ai/ontology/", "");
      return classMap[`ctx:${local}`] || local.toLowerCase();
    }

    return classMap[classUri] || null;
  }
}

export default TripleMapper;
