/**
 * RDF Semantic Layer Demo & Test
 * Exercises and displays the RDF outputs from the SQLite database
 *
 * Usage: bun run scripts/semantic/demo-rdf-outputs.ts
 */

import { join } from "node:path";
import { Database } from "bun:sqlite";
import { loadConfig } from "@src/config/defaults";
import { SparqlConnector } from "@src/semantic/SparqlConnector";
import { TripleMapper } from "@src/semantic/TripleMapper";
import {
  formatAsNTriples,
  sparqlPrefixes,
  ctxUri,
  issueUri,
  directiveUri,
  heuristicUri,
} from "@src/semantic/RdfContext";

async function main() {
  console.log("\n🧪 RDF SEMANTIC LAYER DEMO\n");
  console.log("=".repeat(70));

  // Connect to database
  const config = await loadConfig();
  const dbPath = join(process.cwd(), config.database);
  const db = new Database(dbPath, { readonly: true });
  const mapper = new TripleMapper(db);
  const connector = new SparqlConnector(db);

  // ========================================
  // SECTION 1: Raw SQLite Data
  // ========================================
  console.log("\n📦 SECTION 1: RAW SQLITE DATA\n");

  const nodeCount = (
    db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
  ).c;
  const edgeCount = (
    db.query("SELECT COUNT(*) as c FROM edges").get() as { c: number }
  ).c;

  console.log(`Database: ${dbPath}`);
  console.log(`Nodes: ${nodeCount}`);
  console.log(`Edges: ${edgeCount}`);

  // Show sample nodes
  console.log("\n📄 Sample Nodes:");
  const sampleNodes = db.query(`
    SELECT id, type, title, domain
    FROM nodes
    WHERE title IS NOT NULL
    LIMIT 5
  `).all() as Array<{ id: string; type: string; title: string; domain: string }>;

  for (const node of sampleNodes) {
    console.log(`  [${node.type}] ${node.id}: "${node.title}" (${node.domain || "no domain"})`);
  }

  // Show sample edges
  console.log("\n🔗 Sample Edges:");
  const sampleEdges = db.query(`
    SELECT source, target, type
    FROM edges
    LIMIT 5
  `).all() as Array<{ source: string; target: string; type: string }>;

  for (const edge of sampleEdges) {
    console.log(`  ${edge.source} --[${edge.type}]--> ${edge.target}`);
  }

  // ========================================
  // SECTION 2: RDF Triple Mapping
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("\n🔄 SECTION 2: RDF TRIPLE MAPPING\n");

  const stats = mapper.getStats();
  console.log(`Estimated Node Triples: ${stats.nodeTriples}`);
  console.log(`Edge Triples: ${stats.edgeTriples}`);
  console.log(`Total Triples: ${stats.totalTriples}`);
  console.log(`Unique Predicates: ${stats.uniquePredicates}`);

  // Show sample triples
  console.log("\n📝 Sample Triples (first 15):");
  const allTriples = mapper.extractAllTriples();
  const sampleTriples = allTriples.slice(0, 15);

  for (const triple of sampleTriples) {
    const obj = triple.objectType === "literal"
      ? `"${triple.object.substring(0, 30)}${triple.object.length > 30 ? "..." : ""}"`
      : triple.object;
    console.log(`  ${triple.subject}`);
    console.log(`    ${triple.predicate}`);
    console.log(`    ${obj}`);
    console.log();
  }

  // ========================================
  // SECTION 3: N-Triples Format
  // ========================================
  console.log("=".repeat(70));
  console.log("\n📄 SECTION 3: N-TRIPLES FORMAT\n");

  const ntriples = mapper.exportAsNTriples();
  const ntriplesLines = ntriples.split("\n").filter((l) => l.trim());

  console.log(`Total N-Triples lines: ${ntriplesLines.length}`);
  console.log("\nFirst 10 N-Triples:");
  for (const line of ntriplesLines.slice(0, 10)) {
    console.log(`  ${line}`);
  }

  // ========================================
  // SECTION 4: Turtle Format
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("\n🐢 SECTION 4: TURTLE FORMAT (first 30 lines)\n");

  const turtle = mapper.exportAsTurtle();
  const turtleLines = turtle.split("\n").slice(0, 30);

  for (const line of turtleLines) {
    console.log(`  ${line}`);
  }

  // ========================================
  // SECTION 5: SPARQL Queries
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("\n🔍 SECTION 5: SPARQL QUERY TESTS\n");

  // Query 1: Simple triple pattern
  console.log("Query 1: Simple Triple Pattern");
  const sparql1 = `
    SELECT ?s ?p ?o
    WHERE { ?s ?p ?o . }
    LIMIT 5
  `;
  console.log(`  SPARQL: ${sparql1.trim().replace(/\s+/g, " ")}`);
  const result1 = await connector.query(sparql1);
  console.log(`  Results: ${result1.results.bindings.length}`);
  for (const b of result1.results.bindings) {
    console.log(`    ?s = ${b.s?.value}, ?p = ${b.p?.value}, ?o = ${b.o?.value}`);
  }
  console.log(`  Timing: ${result1.timing.total.toFixed(2)}ms`);

  // Query 2: Node type query
  console.log("\nQuery 2: Find Documents by Type");
  const sparql2 = `
    SELECT ?node ?label
    WHERE {
      ?node <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://ctx.ai/ontology/Document> .
      OPTIONAL { ?node <http://www.w3.org/2000/01/rdf-schema#label> ?label }
    }
    LIMIT 5
  `;
  console.log(`  SPARQL: Find all nodes of type Document`);
  const result2 = await connector.query(sparql2);
  console.log(`  Results: ${result2.results.bindings.length}`);
  for (const b of result2.results.bindings) {
    console.log(`    ?node = ${b.node?.value}, ?label = ${b.label?.value || "(no label)"}`);
  }
  console.log(`  Timing: ${result2.timing.total.toFixed(2)}ms`);

  // Query 3: Edge traversal
  console.log("\nQuery 3: Edge Traversal (CITES relationship)");
  const sparql3 = `
    SELECT ?source ?target
    WHERE {
      ?source <http://ctx.ai/ontology/cites> ?target .
    }
    LIMIT 5
  `;
  console.log(`  SPARQL: Find all CITES relationships`);
  const result3 = await connector.query(sparql3);
  console.log(`  Results: ${result3.results.bindings.length}`);
  for (const b of result3.results.bindings) {
    console.log(`    ${b.source?.value} --> ${b.target?.value}`);
  }
  console.log(`  Timing: ${result3.timing.total.toFixed(2)}ms`);

  // Query 4: Count by type
  console.log("\nQuery 4: Count Nodes by Type (using SQL for accuracy)");
  const typeCounts = db.query(`
    SELECT type, COUNT(*) as count
    FROM nodes
    GROUP BY type
    ORDER BY count DESC
  `).all() as Array<{ type: string; count: number }>;
  console.log("  Node counts by type:");
  for (const row of typeCounts) {
    console.log(`    ${row.type}: ${row.count}`);
  }

  // Query 5: Edge type distribution
  console.log("\nQuery 5: Edge Type Distribution (using SQL)");
  const edgeTypes = db.query(`
    SELECT type, COUNT(*) as count
    FROM edges
    GROUP BY type
    ORDER BY count DESC
  `).all() as Array<{ type: string; count: number }>;
  console.log("  Edge counts by type:");
  for (const row of edgeTypes) {
    console.log(`    ${row.type}: ${row.count}`);
  }

  // ========================================
  // SECTION 6: URI Resolution Demo
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("\n🏷️  SECTION 6: URI RESOLUTION DEMO\n");

  console.log("Sample URI generation:");
  console.log(`  ctxUri("heuristic", "OH-058") = ${ctxUri("heuristic", "OH-058")}`);
  console.log(`  issueUri("Biddability") = ${issueUri("Biddability")}`);
  console.log(`  directiveUri("ADV-8") = ${directiveUri("ADV-8")}`);
  console.log(`  heuristicUri("OH-103") = ${heuristicUri("OH-103")}`);

  console.log("\nSPARQL PREFIX declarations:");
  console.log(sparqlPrefixes());

  // ========================================
  // SECTION 7: Comparison Summary
  // ========================================
  console.log("\n" + "=".repeat(70));
  console.log("\n📊 SECTION 7: SQL vs SPARQL COMPARISON\n");

  console.log("| Aspect | SQL Approach | SPARQL Approach |");
  console.log("|--------|--------------|-----------------|");
  console.log("| Find by ID | `SELECT * FROM nodes WHERE id = ?` | `SELECT ?n WHERE { ?n a ?type }` |");
  console.log("| Find by type | `SELECT * FROM nodes WHERE type = ?` | `SELECT ?n WHERE { ?n a ctx:Type }` |");
  console.log("| Traverse edge | `SELECT * FROM edges WHERE source = ?` | `SELECT ?o WHERE { ?s ctx:predicate ?o }` |");
  console.log("| Join tables | `JOIN` syntax | Triple pattern matching |");

  // ========================================
  // Cleanup
  // ========================================
  db.close();

  console.log("\n" + "=".repeat(70));
  console.log("\n✅ RDF Demo Complete\n");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
