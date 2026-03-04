# RDF Implementation Plan: Semantic Graph Layer for Amalfa

**Status:** IN PROGRESS
**Created:** 2025-01-30
**Updated:** 2025-01-30
**Related Briefs:** `brief-sparql-sqlite.md`, `brief-sparql-sqlite-01.md` through `brief-sparql-sqlite-10.md`

> **Phase 1 Complete** ✅ - Foundation layer implemented and tested

---

## Executive Summary

This plan implements a **Semantic Graph Layer** using RDF/SPARQL to complement the existing property graph (SQLite Nodes/Edges). The goal is to enable **comparative analysis** between:

| Method | Query Type | Strength |
|--------|------------|----------|
| **Current (Property Graph)** | SQL, Vector Similarity | Fast, simple, probabilistic matching |
| **RDF Layer** | SPARQL, Ontological | Deterministic reasoning, logical inference |

---

## Current State Analysis

### Existing Pipeline (`AmalfaIngestor`)

```
Markdown Files → Node Extraction → Edge Weaving → SQLite Storage
                     ↓                    ↓
               [type, label]      [TAGGED_AS, CITES, LINKS_TO]
```

**Current Edge Types:**
- `TAGGED_AS` - Explicit `[tag: Concept]` syntax
- `EXEMPLIFIES` - Legacy `tag-slug` format
- `CITES` - WikiLinks `[[Target]]`
- `LINKS_TO` - Markdown links `[text](path.md)`

### Proposed RDF Mapping

```
SQLite Node → ctx:resource/[id]
SQLite Edge → ctx:ontology/[predicate] (normalized)
Edge.type   → Formal predicate URI
```

---

## Implementation Phases

### Phase 1: Foundation (The Connector) ✅ COMPLETE
**Goal:** Establish SPARQL-to-SQLite bridge

- [x] **1.1** Create `src/semantic/RdfContext.ts`
  - Define ontology prefixes (`ctx:`, `rdf:`, `rdfs:`)
  - URI templating functions
  - Namespace management

- [x] **1.2** Create `src/semantic/TripleMapper.ts`
  - Map SQLite `Node` → RDF Subject
  - Map SQLite `Edge` → RDF Triple (S-P-O)
  - Handle literal values (definitions, measurements)

- [x] **1.3** Create `src/semantic/SparqlConnector.ts`
  - SPARQL parser (SELECT, ASK, CONSTRUCT, DESCRIBE)
  - Implement `query(sparql: string)` method
  - SPARQL → SQL translation layer (custom SqlBuilder)

- [x] **1.4** Create test fixtures
  - `scripts/semantic/test-rdf-layer.ts` - Unit tests
  - `scripts/semantic/benchmark-rdf-vs-sql.ts` - Performance comparison
  - `src/semantic/index.ts` - Module exports

**Success Metric:** ✅ ACHIEVED - SPARQL queries return valid results from SQLite.

**Implementation Notes:**
- Used custom SPARQL parser instead of Comunica for simpler integration
- Supports SELECT, ASK, CONSTRUCT, DESCRIBE query types
- FILTER (comparison and existence), OPTIONAL clauses supported
- Direct SQL translation via SqlBuilder class

---

### Phase 2: The Triplifier (Ingestion Layer)
**Goal:** Generate RDF triples during ingestion

- [ ] **2.1** Create `src/semantic/TriplifierEngine.ts`
  - LLM-based entity extraction
  - Ontology-driven predicate selection
  - Output N-Triples format

- [ ] **2.2** Implement ontology schema
  ```
  ctx:Heuristic      - Operational heuristics
  ctx:Directive      - Core directives (CDA)
  ctx:SubstrateIssue - Risk categories
  ctx:mitigates      - Heuristic → Issue
  ctx:implements     - Heuristic → Directive
  ctx:guided_by      - Dependency relationship
  ctx:constrained_by - Tension relationship
  ```

- [ ] **2.3** Extend `AmalfaIngestor` with RDF mode
  - Add `--rdf` CLI flag
  - Dual-write: SQLite + RDF triples
  - Preserve idempotency

- [ ] **2.4** Create provenance tracking
  - Every triple links to source document
  - `ctx:isDerivedFrom` predicate
  - Enable retrospective queries

**Success Metric:** Ingest 10 test documents, verify SPARQL query returns same nodes as SQL query.

---

### Phase 3: Comparison Framework
**Goal:** Benchmark RDF vs Property Graph

- [ ] **3.1** Create `src/semantic/QueryComparator.ts`
  ```typescript
  interface ComparisonResult {
    sqlResult: Node[];
    sparqlResult: Triple[];
    overlap: number;
    precision: number;
    recall: number;
    timingSql: number;
    timingSparql: number;
  }
  ```

- [ ] **3.2** Define benchmark queries
  | Query Name | SQL Approach | SPARQL Approach |
  |------------|--------------|-----------------|
  | Find by tag | `WHERE type = 'X'` | `?s a ctx:X` |
  | Traverse edges | Recursive CTE | Property path |
  | Gap analysis | LEFT JOIN + IS NULL | `FILTER NOT EXISTS` |
  | Centrality | Custom algorithm | SPARQL aggregates |

- [ ] **3.3** Create benchmark script
  - `scripts/benchmarks/benchmark-rdf-vs-sql.ts`
  - Run 10 iterations per query type
  - Output comparison table

- [ ] **3.4** Document findings
  - Performance comparison
  - Expressiveness comparison
  - Use-case recommendations

**Success Metric:** Benchmark report showing clear trade-offs between approaches.

---

### Phase 4: Gap Analysis (Semantic Integrity)
**Goal:** Identify orphan nodes and dead-letter directives

- [ ] **4.1** Implement "Under-Governed Heuristics" query
  ```sparql
  SELECT ?h ?term
  WHERE {
    ?h a ctx:Heuristic ; ctx:term ?term .
    FILTER NOT EXISTS { ?h ctx:implements ?d . ?d a ctx:Directive }
  }
  ```

- [ ] **4.2** Implement "Dead-Letter Directives" query
  ```sparql
  SELECT ?d ?title
  WHERE {
    ?d a ctx:Directive ; ctx:title ?title .
    FILTER NOT EXISTS { ?h ctx:implements ?d }
  }
  ```

- [ ] **4.3** Create visualization output
  - Export orphan nodes to JSON
  - Color-code in Sigma.js integration
  - Red = Orphan, Green = Governed, Blue = Aspirational

- [ ] **4.4** Add bridging triples UI
  - Suggest missing edges
  - One-click remediation
  - Audit log of changes

**Success Metric:** Zero false positives in gap detection (validated against manual review).

---

### Phase 5: Domain Extension (Arbitrary Corpora)
**Goal:** Apply RDF methodology to external documents

- [ ] **5.1** Design domain sleeve architecture
  ```typescript
  interface DomainSleeve {
    name: string;
    nodeTypes: string[];      // Contract, Clause, Party
    predicates: string[];     // obligates, governed_by
    mandatoryPredicates: string[]; // Every node must have
  }
  ```

- [ ] **5.2** Create legal domain sleeve
  - Node types: Contract, Clause, Obligation, Party
  - Predicates: `obligates`, `terminates`, `amends`

- [ ] **5.3** Create technical domain sleeve
  - Node types: Component, API, Dependency, Vulnerability
  - Predicates: `depends_on`, `breaks`, `fixes`

- [ ] **5.4** Implement cross-domain queries
  - Link external corpus to CDA directives
  - Example: `ctx:Vulnerability ctx:mitigates ctx:Biddability`

**Success Metric:** Ingest 100-page legal document, answer "What obligations does Party A have?" via SPARQL.

---

### Phase 6: Pre-Mortem Hardening
**Goal:** Identify and resolve logic cycles, contradictions

- [ ] **6.1** Implement cycle detection
  - SPARQL property path: `?s ctx:guided_by+ ?s`
  - Flag recursive dependencies

- [ ] **6.2** Implement contradiction detection
  ```sparql
  SELECT ?s ?p ?o1 ?o2
  WHERE {
    ?s ?p ?o1 ; ?p ?o2 .
    FILTER (?o1 != ?o2)
    FILTER EXISTS { ?p a ctx:FunctionalProperty }
  }
  ```

- [ ] **6.3** Add constraint edges
  - `ctx:constrained_by` predicate
  - Example: `OH-101` constrained_by `COG-12`

- [ ] **6.4** Create integrity report
  - Cycle count
  - Contradiction count
  - Orphan count
  - Overall health score

**Success Metric:** Integrity report runs in < 5 seconds on 10,000 node graph.

---

## Technical Specifications

### Dependencies (Add to `package.json`)

```json
{
  "dependencies": {
    "@comunica/query-sparql": "^3.0.0",
    "n3": "^1.17.0",
    "rdf-data-model": "^2.0.0"
  }
}
```

### Database Schema Extensions

No schema changes required. RDF layer operates as **virtual view** over existing tables:

```sql
-- Existing (unchanged)
SELECT id, type, title FROM nodes;
SELECT source, target, type FROM edges;

-- Virtual RDF mapping
-- Subject = nodes.id
-- Predicate = edges.type (normalized)
-- Object = edges.target
```

### File Structure

```
src/
├── semantic/
│   ├── RdfContext.ts       # Ontology definitions
│   ├── TripleMapper.ts     # SQLite → RDF conversion
│   ├── SparqlConnector.ts  # Query execution
│   ├── TriplifierEngine.ts # LLM-based extraction
│   ├── QueryComparator.ts  # Benchmark utilities
│   └── DomainSleeve.ts     # Domain-specific configs
├── pipeline/
│   └── AmalfaIngestor.ts   # Extended with --rdf flag
└── resonance/
    └── db.ts               # Unchanged
```

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Query Parity | 100% | Every SQL query has SPARQL equivalent |
| Performance | < 2x slowdown | SPARQL within 2x of SQL speed |
| Gap Detection | 0 false positives | Manual validation |
| Provenance | 100% | Every triple linked to source |
| Idempotency | Preserved | Re-ingestion produces identical graph |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SPARQL complexity | Provide SQL fallback mode |
| Performance regression | Cache frequently-used queries |
| Ontology drift | Version control ontology files |
| LLM hallucination in triplification | Require human review of new predicates |

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 2 days | None |
| Phase 2 | 3 days | Phase 1 |
| Phase 3 | 2 days | Phase 2 |
| Phase 4 | 1 day | Phase 2 |
| Phase 5 | 3 days | Phase 2, 4 |
| Phase 6 | 1 day | Phase 4 |

**Total: ~12 days** (can be parallelized)

---

## Next Steps

1. **Review this plan** - Approve or request modifications
2. **Start Phase 1** - Create `RdfContext.ts` and `TripleMapper.ts`
3. **Establish test fixtures** - Copy production database for safe experimentation
4. **Begin comparative benchmarking** - Measure baseline performance

---

## Appendix: Sample SPARQL Queries

### A. Find All Mitigations for Biddability
```sparql
PREFIX ctx: <http://ctx.ai/ontology/>
SELECT ?h ?term ?definition
WHERE {
  ?h a ctx:Heuristic ;
     ctx:term ?term ;
     ctx:mitigates ctx:issue/Biddability .
  OPTIONAL { ?h ctx:definition ?definition }
}
```

### B. Governance Chain (Path Query)
```sparql
PREFIX ctx: <http://ctx.ai/ontology/>
SELECT ?directive (COUNT(?h) as ?heuristicCount)
WHERE {
  ?h a ctx:Heuristic ;
     ctx:implements ?directive .
  ?directive a ctx:Directive .
}
GROUP BY ?directive
ORDER BY DESC(?heuristicCount)
```

### C. Orphan Detection
```sparql
PREFIX ctx: <http://ctx.ai/ontology/>
SELECT ?node ?label
WHERE {
  ?node a ?type ;
        ctx:label ?label .
  FILTER NOT EXISTS { ?node ctx:implements|ctx:guided_by ?any }
  FILTER (?type IN (ctx:Heuristic, ctx:Protocol))
}
```
