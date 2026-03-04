/**
 * Benchmark: RDF/SPARQL vs SQL Query Performance
 *
 * Compares query execution time and result consistency between:
 * - Direct SQL queries (existing approach)
 * - SPARQL queries via TripleMapper (new semantic layer)
 *
 * Usage: bun run scripts/semantic/benchmark-rdf-vs-sql.ts
 */

import { join } from "node:path";
import { Database } from "bun:sqlite";
import { loadConfig } from "@src/config/defaults";
import { SparqlConnector } from "@src/semantic/SparqlConnector";
import { TripleMapper } from "@src/semantic/TripleMapper";

// === BENCHMARK CONFIGURATION ===

const ITERATIONS = 10;
const WARMUP_ITERATIONS = 3;

interface BenchmarkResult {
  name: string;
  sqlTime: number;
  sparqlTime: number;
  sqlCount: number;
  sparqlCount: number;
  ratio: number;
  match: boolean;
}

// === QUERY DEFINITIONS ===

const QUERIES = [
  {
    name: "Find all documents",
    sql: `SELECT id, title FROM nodes WHERE type = 'document' LIMIT 100`,
    sparql: `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?node ?label WHERE {
        ?node a ctx:Document .
        OPTIONAL { ?node rdfs:label ?label }
      } LIMIT 100
    `,
  },
  {
    name: "Find nodes with specific edge type",
    sql: `SELECT source, target FROM edges WHERE type = 'CITES' LIMIT 100`,
    sparql: `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?source ?target WHERE {
        ?source ctx:cites ?target .
      } LIMIT 100
    `,
  },
  {
    name: "Count nodes by type",
    sql: `SELECT type, COUNT(*) as count FROM nodes GROUP BY type`,
    sparql: `
      SELECT ?type (COUNT(?node) as ?count) WHERE {
        ?node a ?type .
      } GROUP BY ?type
    `,
  },
  {
    name: "Find outgoing edges",
    sql: `SELECT target, type FROM edges WHERE source = (SELECT id FROM nodes LIMIT 1)`,
    sparql: `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?target ?predicate WHERE {
        ?source ?predicate ?target .
      } LIMIT 100
    `,
  },
  {
    name: "Node with label match",
    sql: `SELECT id, title FROM nodes WHERE title LIKE '%pipeline%' LIMIT 50`,
    sparql: `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?node ?label WHERE {
        ?node rdfs:label ?label .
        FILTER (CONTAINS(?label, "pipeline"))
      } LIMIT 50
    `,
  },
  {
    name: "Edge traversal (2-hop)",
    sql: `
      SELECT e1.source, e1.target as mid, e2.target as end
      FROM edges e1
      JOIN edges e2 ON e1.target = e2.source
      LIMIT 100
    `,
    sparql: `
      PREFIX ctx: <http://ctx.ai/ontology/>
      SELECT ?start ?mid ?end WHERE {
        ?start ?p1 ?mid .
        ?mid ?p2 ?end .
      } LIMIT 100
    `,
  },
];

// === BENCHMARK FUNCTIONS ===

async function benchmarkSql(db: Database, sql: string, iterations: number): Promise<number> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    try {
      db.query(sql).all();
    } catch (e) {
      // Query might fail, that's OK for benchmarking
    }
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      db.query(sql).all();
    } catch (e) {
      // Query might fail
    }
    const end = performance.now();
    times.push(end - start);
  }

  // Return median
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] ?? 0;
}

async function benchmarkSparql(
  connector: SparqlConnector,
  sparql: string,
  iterations: number
): Promise<number> {
  const times: number[] = [];

  // Warmup
  for (let i = 0; i < WARMUP_ITERATIONS; i++) {
    try {
      await connector.query(sparql);
    } catch (e) {
      // Query might fail
    }
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await connector.query(sparql);
    } catch (e) {
      // Query might fail
    }
    const end = performance.now();
    times.push(end - start);
  }

  // Return median
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)] ?? 0;
}

function getSqlCount(db: Database, sql: string): number {
  try {
    const results = db.query(sql).all();
    return results.length;
  } catch {
    return 0;
  }
}

async function getSparqlCount(connector: SparqlConnector, sparql: string): Promise<number> {
  try {
    const result = await connector.query(sparql);
    return result.results.bindings.length;
  } catch {
    return 0;
  }
}

// === MAIN BENCHMARK ===

async function main() {
  console.log("\n🏁 RDF vs SQL Benchmark\n");
  console.log(`Iterations: ${ITERATIONS} (plus ${WARMUP_ITERATIONS} warmup)`);
  console.log("=".repeat(70));

  // Setup
  const config = await loadConfig();
  const dbPath = join(process.cwd(), config.database);
  const db = new Database(dbPath, { readonly: true });
  const connector = new SparqlConnector(db);
  const mapper = new TripleMapper(db);

  // Database stats
  const stats = mapper.getStats();
  console.log(`\n📊 Database Statistics:`);
  console.log(`   Nodes: ${stats.uniqueSubjects}`);
  console.log(`   Edges: ${stats.edgeTriples}`);
  console.log(`   Estimated Triples: ${stats.totalTriples}`);
  console.log(`   Unique Predicates: ${stats.uniquePredicates}`);
  console.log("\n" + "=".repeat(70));

  const results: BenchmarkResult[] = [];

  // Run benchmarks
  for (const query of QUERIES) {
    console.log(`\n🔍 ${query.name}`);

    // SQL benchmark
    process.stdout.write("   SQL... ");
    const sqlTime = await benchmarkSql(db, query.sql, ITERATIONS);
    const sqlCount = getSqlCount(db, query.sql);
    console.log(`${sqlTime.toFixed(2)}ms (${sqlCount} results)`);

    // SPARQL benchmark
    process.stdout.write("   SPARQL... ");
    const sparqlTime = await benchmarkSparql(connector, query.sparql, ITERATIONS);
    const sparqlCount = await getSparqlCount(connector, query.sparql);
    console.log(`${sparqlTime.toFixed(2)}ms (${sparqlCount} results)`);

    // Calculate ratio
    const ratio = sqlTime > 0 ? sparqlTime / sqlTime : 0;
    const match = sqlCount === sparqlCount;

    results.push({
      name: query.name,
      sqlTime,
      sparqlTime,
      sqlCount,
      sparqlCount,
      ratio,
      match,
    });

    // Show ratio
    if (ratio <= 1) {
      console.log(`   ✅ SPARQL is ${ratio.toFixed(2)}x faster`);
    } else {
      console.log(`   ⚠️  SPARQL is ${ratio.toFixed(2)}x slower`);
    }

    if (!match) {
      console.log(`   ⚠️  Result count mismatch: SQL=${sqlCount}, SPARQL=${sparqlCount}`);
    }
  }

  // Summary table
  console.log("\n" + "=".repeat(70));
  console.log("\n📋 SUMMARY TABLE\n");
  console.log("| Query | SQL (ms) | SPARQL (ms) | Ratio | Count Match |");
  console.log("|-------|----------|-------------|-------|-------------|");

  for (const r of results) {
    const matchIcon = r.match ? "✅" : "⚠️";
    console.log(`| ${r.name.substring(0, 25).padEnd(25)} | ${r.sqlTime.toFixed(2).padStart(8)} | ${r.sparqlTime.toFixed(2).padStart(11)} | ${r.ratio.toFixed(2).padStart(5)} | ${matchIcon.padStart(11)} |`);
  }

  // Overall statistics
  const avgRatio = results.reduce((sum, r) => sum + r.ratio, 0) / results.length;
  const maxRatio = Math.max(...results.map(r => r.ratio));
  const minRatio = Math.min(...results.map(r => r.ratio));
  const matchRate = results.filter(r => r.match).length / results.length * 100;

  console.log("\n📊 OVERALL STATISTICS:");
  console.log(`   Average Ratio: ${avgRatio.toFixed(2)}x`);
  console.log(`   Max Ratio: ${maxRatio.toFixed(2)}x`);
  console.log(`   Min Ratio: ${minRatio.toFixed(2)}x`);
  console.log(`   Result Match Rate: ${matchRate.toFixed(1)}%`);

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS:");
  if (avgRatio < 1.5) {
    console.log("   ✅ SPARQL overhead is acceptable for semantic query benefits");
  } else if (avgRatio < 3) {
    console.log("   ⚠️  SPARQL has moderate overhead - consider caching for frequent queries");
  } else {
    console.log("   ❌ SPARQL has significant overhead - optimize translation layer");
  }

  if (matchRate < 100) {
    console.log("   ⚠️  Result count mismatches detected - review query translation logic");
  }

  // Cleanup
  db.close();

  console.log("\n✅ Benchmark complete\n");
}

main().catch(console.error);
