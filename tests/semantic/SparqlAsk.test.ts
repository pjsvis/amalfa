import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { SparqlConnector } from "../../src/semantic/SparqlConnector";
import { unlinkSync, existsSync } from "node:fs";

describe("SparqlConnector ASK queries", () => {
  let db: Database;
  let connector: SparqlConnector;
  const DB_PATH = "test-sparql-ask.db";

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

    // Insert some data
    db.run("INSERT INTO nodes (id, type, title) VALUES (?, ?, ?)", ["Resource1", "resource", "My Resource"]);
    db.run("INSERT INTO edges (source, target, type) VALUES (?, ?, ?)", ["Resource1", "Resource2", "RELATED_TO"]);

    connector = new SparqlConnector(db);
  });

  afterAll(() => {
    db.close();
    if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
    if (existsSync(`${DB_PATH}-shm`)) unlinkSync(`${DB_PATH}-shm`);
    if (existsSync(`${DB_PATH}-wal`)) unlinkSync(`${DB_PATH}-wal`);
  });

  test("ASK with variables should work", async () => {
    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      ASK {
        ?s a ctx:Resource .
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings[0]?._ask?.value).toBe("true");
  });

  test("ASK with constants (no variables) - REPRODUCTION OF ISSUE", async () => {
    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      ASK {
        <http://ctx.ai/ontology/resource/Resource1> a ctx:Resource .
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings[0]?._ask?.value).toBe("true");
  });

  test("ASK with constants (edge pattern) - REPRODUCTION OF ISSUE", async () => {
    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      ASK {
        <http://ctx.ai/ontology/resource/Resource1> ctx:relatesTo <http://ctx.ai/ontology/resource/Resource2> .
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings[0]?._ask?.value).toBe("true");
  });

  test("ASK with non-existent constants", async () => {
    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      ASK {
        <http://ctx.ai/ontology/resource/NonExistent> a ctx:Resource .
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings[0]?._ask?.value).toBe("false");
  });

  test("SELECT with FILTER EXISTS", async () => {
    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?s WHERE {
        ?s a ctx:Resource .
        FILTER EXISTS {
          ?s ctx:relatesTo <http://ctx.ai/ontology/resource/Resource2> .
        }
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings.length).toBe(1);
    expect(bindings[0]?.s?.value).toBe("Resource1");
  });

  test("SELECT with shared variables (JOIN)", async () => {
    // Insert more data for join test
    db.run("INSERT INTO nodes (id, type, title) VALUES (?, ?, ?)", ["Resource2", "resource", "Other Resource"]);
    db.run("INSERT INTO edges (source, target, type) VALUES (?, ?, ?)", ["Resource1", "Resource2", "FOLLOWS"]);

    const query = `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?s ?o1 ?o2 WHERE {
        ?s ctx:relatesTo ?o1 .
        ?s ctx:follows ?o2 .
      }
    `;
    const result = await connector.query(query);
    const bindings = result.results.bindings;
    expect(bindings.length).toBe(1);
    expect(bindings[0]?.s?.value).toBe("Resource1");
    expect(bindings[0]?.o1?.value).toBe("Resource2");
    expect(bindings[0]?.o2?.value).toBe("Resource2");
  });
});
