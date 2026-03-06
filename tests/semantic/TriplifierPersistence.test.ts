import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { TriplifierEngine } from "../../src/semantic/TriplifierEngine";
import { unlinkSync, existsSync } from "node:fs";

describe("TriplifierEngine persistence", () => {
  let db: Database;
  let engine: TriplifierEngine;
  const DB_PATH = "test-triplifier-persistence.db";

  beforeAll(() => {
    if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
    db = new Database(DB_PATH);
    
    // Setup schema
    db.run(`
      CREATE TABLE nodes (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        domain TEXT,
        layer TEXT,
        embedding BLOB,
        hash TEXT,
        meta TEXT,
        date TEXT
      )
    `);
    
    db.run(`
      CREATE TABLE edges (
        source TEXT NOT NULL,
        target TEXT NOT NULL,
        type TEXT NOT NULL,
        confidence REAL DEFAULT 1,
        veracity REAL DEFAULT 1,
        context_source TEXT,
        PRIMARY KEY(source, target, type)
      )
    `);

    engine = new TriplifierEngine(db);
  });

  afterAll(() => {
    db.close();
    if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
    if (existsSync(`${DB_PATH}-shm`)) unlinkSync(`${DB_PATH}-shm`);
    if (existsSync(`${DB_PATH}-wal`)) unlinkSync(`${DB_PATH}-wal`);
  });

  test("persistTriples should correctly infer node types and normalize edges", async () => {
    const extractionResult = {
      entities: [],
      relationships: [],
      triples: [
        {
          subject: "ctx:resource/Res1",
          predicate: "rdf:type",
          object: "ctx:Heuristic",
          objectType: "uri" as const,
          confidence: 1.0
        },
        {
          subject: "ctx:resource/Res1",
          predicate: "rdfs:label",
          object: "My Heuristic",
          objectType: "literal" as const,
          confidence: 1.0
        },
        {
          subject: "ctx:resource/Res1",
          predicate: "ctx:mitigates",
          object: "ctx:resource/Issue1",
          objectType: "uri" as const,
          confidence: 0.8,
          sourceDocument: "doc1"
        }
      ],
      metadata: {
        sourceId: "doc1",
        extractionTime: 123,
        modelUsed: "test-model"
      }
    };

    await engine.persistTriples(extractionResult);

    const node = db.query("SELECT * FROM nodes WHERE id = ?").get("Res1") as any;
    expect(node).toBeDefined();
    expect(node.type).toBe("Heuristic");
    expect(node.title).toBe("My Heuristic");

    const edge = db.query("SELECT * FROM edges WHERE source = ?").get("Res1") as any;
    expect(edge).toBeDefined();
    expect(edge.type).toBe("MITIGATES");
    expect(edge.confidence).toBe(0.8);
  });

  test("persistTriples should update existing nodes and edges (UPSERT)", async () => {
    // 1. Initial insert
    await engine.persistTriples({
      entities: [],
      relationships: [],
      triples: [
        {
          subject: "ctx:resource/Res2",
          predicate: "rdf:type",
          object: "ctx:Resource",
          objectType: "uri" as const,
        }
      ],
      metadata: { sourceId: "doc1", extractionTime: 0, modelUsed: "" }
    });

    // 2. Update with better info
    await engine.persistTriples({
      entities: [],
      relationships: [],
      triples: [
        {
          subject: "ctx:resource/Res2",
          predicate: "rdf:type",
          object: "ctx:Directive",
          objectType: "uri" as const,
        },
        {
          subject: "ctx:resource/Res2",
          predicate: "ctx:label",
          object: "Updated Title",
          objectType: "literal" as const,
        }
      ],
      metadata: { sourceId: "doc1", extractionTime: 0, modelUsed: "" }
    });

    const node = db.query("SELECT * FROM nodes WHERE id = ?").get("Res2") as any;
    expect(node.type).toBe("Directive");
    expect(node.title).toBe("Updated Title");
  });
});
