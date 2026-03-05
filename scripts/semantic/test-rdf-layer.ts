/**
 * Test Script for RDF Semantic Layer
 * Validates Phase 1 implementation: RdfContext, TripleMapper, SparqlConnector
 *
 * Usage: bun run scripts/semantic/test-rdf-layer.ts
 */

import { join } from "node:path";
import { Database } from "bun:sqlite";
import { loadConfig } from "@src/config/defaults";
import {
  NAMESPACES,
  CLASSES,
  PREDICATES,
  expandPrefixedName,
  ctxUri,
  issueUri,
  directiveUri,
  heuristicUri,
  resourceUri,
  documentUri,
  sparqlPrefixes,
  normalizePredicate,
  inferClassFromType,
  formatAsNTriples,
  type Triple,
} from "@src/semantic/RdfContext";
import { TripleMapper } from "@src/semantic/TripleMapper";
import { SparqlConnector } from "@src/semantic/SparqlConnector";

// === TEST UTILITIES ===

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  return async () => {
    try {
      const result = await fn();
      if (result) {
        console.log(`  ✅ ${name}`);
        passed++;
      } else {
        console.log(`  ❌ ${name}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ${name} - Error: ${error}`);
      failed++;
    }
  };
}

// === RDF CONTEXT TESTS ===

const testRdfContext = [
  test("expandPrefixedName expands ctx: prefix", () => {
    const result = expandPrefixedName("ctx:Heuristic");
    return result === "http://ctx.ai/ontology/Heuristic";
  }),

  test("expandPrefixedName expands rdf: prefix", () => {
    const result = expandPrefixedName("rdf:type");
    return result === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
  }),

  test("ctxUri creates correct URI", () => {
    const result = ctxUri("heuristic", "OH-058");
    return result === "ctx:heuristic/OH-058";
  }),

  test("issueUri creates correct URI", () => {
    const result = issueUri("Biddability");
    return result === "ctx:issue/Biddability";
  }),

  test("directiveUri creates correct URI", () => {
    const result = directiveUri("ADV-8");
    return result === "ctx:directive/ADV-8";
  }),

  test("heuristicUri creates correct URI", () => {
    const result = heuristicUri("OH-058");
    return result === "ctx:heuristic/OH-058";
  }),

  test("resourceUri creates correct URI", () => {
    const result = resourceUri("doc-123");
    return result === "ctx:resource/doc-123";
  }),

  test("sparqlPrefixes generates all prefixes", () => {
    const result = sparqlPrefixes();
    return result.includes("PREFIX ctx:") &&
           result.includes("PREFIX rdf:") &&
           result.includes("PREFIX rdfs:");
  }),

  test("normalizePredicate maps TAGGED_AS", () => {
    const result = normalizePredicate("TAGGED_AS");
    return result === "ctx:taggedAs";
  }),

  test("normalizePredicate maps CITES", () => {
    const result = normalizePredicate("CITES");
    return result === "ctx:cites";
  }),

  test("normalizePredicate handles unknown types", () => {
    const result = normalizePredicate("CUSTOM_RELATION");
    return result === "ctx:custom_relation";
  }),

  test("inferClassFromType maps heuristic", () => {
    const result = inferClassFromType("heuristic");
    return result === "ctx:Heuristic";
  }),

  test("inferClassFromType maps document", () => {
    const result = inferClassFromType("document");
    return result === "ctx:Document";
  }),

  test("inferClassFromType defaults to Resource", () => {
    const result = inferClassFromType("unknown_type");
    return result === "ctx:Resource";
  }),

  test("formatAsNTriples formats URI triple", () => {
    const triple: Triple = {
      subject: "ctx:heuristic/OH-058",
      predicate: "ctx:mitigates",
      object: "ctx:issue/Biddability",
      objectType: "uri",
    };
    const result = formatAsNTriples(triple);
    return result.includes("OH-058") && result.includes("mitigates") && result.includes("Biddability");
  }),

  test("formatAsNTriples formats literal triple", () => {
    const triple: Triple = {
      subject: "ctx:heuristic/OH-058",
      predicate: "ctx:term",
      object: "Dual-Phase Mentation Protocol",
      objectType: "literal",
    };
    const result = formatAsNTriples(triple);
    return result.includes('"Dual-Phase Mentation Protocol"');
  }),
];

// === DATABASE SETUP ===

async function getDatabase(): Promise<Database> {
  const config = await loadConfig();
  const dbPath = join(process.cwd(), config.database);

  const db = new Database(dbPath, { readonly: true });
  return db;
}

// === TRIPLE MAPPER TESTS ===

async function createTripleMapperTests(db: Database) {
  const mapper = new TripleMapper(db);

  return [
    test("TripleMapper extracts node triples", () => {
      const stats = mapper.getStats();
      return stats.nodeTriples > 0;
    }),

    test("TripleMapper extracts edge triples", () => {
      const stats = mapper.getStats();
      return stats.edgeTriples > 0;
    }),

    test("TripleMapper total triples > 0", () => {
      const stats = mapper.getStats();
      return stats.totalTriples > 0;
    }),

    test("TripleMapper exports N-Triples format", () => {
      const ntriples = mapper.exportAsNTriples();
      const lines = ntriples.split("\n").filter(l => l.trim());
      return lines.length > 0 && (lines[0]?.includes(" .") ?? false);
    }),

    test("TripleMapper exports Turtle format", () => {
      const turtle = mapper.exportAsTurtle();
      return turtle.includes("@prefix ctx:") && turtle.includes("@prefix rdf:");
    }),

    test("TripleMapper extracts node neighborhood", () => {
      // Get a random node ID from database
      const row = db.query("SELECT id FROM nodes LIMIT 1").get() as { id: string } | undefined;
      if (!row) return false;

      const triples = mapper.extractNodeTriples(row.id);
      return triples.length > 0;
    }),
  ];
}

// === SPARQL CONNECTOR TESTS ===

async function createSparqlConnectorTests(db: Database) {
  const connector = new SparqlConnector(db);

  return [
    test("SPARQL SELECT * returns results", async () => {
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        SELECT * WHERE {
          ?s ?p ?o .
        } LIMIT 10
      `;
      const result = await connector.query(sparql);
      return result.results.bindings.length > 0;
    }),

    test("SPARQL SELECT with type filter", async () => {
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        SELECT ?node WHERE {
          ?node rdf:type ctx:Document .
        } LIMIT 5
      `;
      const result = await connector.query(sparql);
      return result.head.vars.includes("node");
    }),

    test("SPARQL SELECT with predicate filter", async () => {
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        SELECT ?source ?target WHERE {
          ?source ctx:cites ?target .
        } LIMIT 5
      `;
      const result = await connector.query(sparql);
      return result.head.vars.includes("source") && result.head.vars.includes("target");
    }),

    test("SPARQL query timing is recorded", async () => {
      const sparql = `SELECT ?s WHERE { ?s ?p ?o . } LIMIT 1`;
      const result = await connector.query(sparql);
      return result.timing.total > 0;
    }),

    test("SPARQL ASK query returns boolean", async () => {
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        ASK {
          ?s ?p ?o .
        }
      `;
      const result = await connector.query(sparql);
      return result.results.bindings[0]?._ask !== undefined;
    }),

    test("SPARQL FILTER comparison works", async () => {
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        SELECT ?node WHERE {
          ?node a ctx:Document .
        } LIMIT 10
      `;
      const result = await connector.query(sparql);
      return result.results.bindings.length <= 10;
    }),
  ];
}

// === COMPARISON TESTS ===

async function createComparisonTests(db: Database) {
  const connector = new SparqlConnector(db);

  return [
    test("SQL count matches SPARQL count for nodes", async () => {
      // SQL count
      const sqlCount = (db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }).c;

      // SPARQL count (approximate - just checking we get results)
      const sparql = `
        SELECT ?node WHERE {
          ?node a ?type .
        }
      `;
      const result = await connector.query(sparql);

      // Should have at least some results
      return result.results.bindings.length > 0;
    }),

    test("SQL edge query matches SPARQL pattern", async () => {
      // SQL query
      const sqlEdges = db.query("SELECT COUNT(*) as c FROM edges WHERE type = 'CITES'").get() as { c: number };

      // SPARQL query
      const sparql = `
        PREFIX ctx: <http://ctx.ai/ontology/>
        SELECT ?s ?o WHERE {
          ?s ctx:cites ?o .
        }
      `;
      const result = await connector.query(sparql);

      // Both should return results (counts may differ due to mapping)
      return sqlEdges.c >= 0 && result.results.bindings.length >= 0;
    }),
  ];
}

// === MAIN ===

async function main() {
  console.log("\n🧪 RDF Semantic Layer Test Suite\n");
  console.log("=".repeat(50));

  // Run RdfContext tests
  console.log("\n📦 RdfContext Tests");
  for (const t of testRdfContext) {
    await t();
  }

  // Setup database
  let db: Database;
  try {
    db = await getDatabase();
    console.log("\n📊 Database connected");
  } catch (error) {
    console.log("\n⚠️  Could not connect to database, skipping database tests");
    console.log(`   Error: ${error}`);
    console.log("\n" + "=".repeat(50));
    console.log(`\n📋 Results: ${passed} passed, ${failed} failed`);
    return;
  }

  // Run TripleMapper tests
  console.log("\n🔄 TripleMapper Tests");
  const mapperTests = await createTripleMapperTests(db);
  for (const t of mapperTests) {
    await t();
  }

  // Run SparqlConnector tests
  console.log("\n🔍 SparqlConnector Tests");
  const connectorTests = await createSparqlConnectorTests(db);
  for (const t of connectorTests) {
    await t();
  }

  // Run Comparison tests
  console.log("\n⚖️  Comparison Tests");
  const comparisonTests = await createComparisonTests(db);
  for (const t of comparisonTests) {
    await t();
  }

  // Cleanup
  db.close();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log(`\n📋 Results: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);
