Performing a **Gap Analysis via SPARQL** allows us to identify "Operational Debt"—instances where we have defined a rule (Directive) but haven't built the tool (Heuristic) to execute it, or vice versa.

Following Emegård’s logic, we treat these gaps as missing triples in our knowledge graph.

### 1. Identifying "Under-Governed" Heuristics

This query finds all `ctx:Heuristic` entries in our SQLite store that lack a `ctx:implements` relationship to the `ctx:Directive` class. These represent "orphaned behaviors" that may be operating without formal philosophical alignment.

```sparql
PREFIX ctx: <http://ctx.ai/ontology/>

SELECT ?heuristic ?term
WHERE {
  ?heuristic a ctx:Heuristic ;
             ctx:term ?term .
  
  # Filter out heuristics that DO have an implementation link
  FILTER NOT EXISTS {
    ?heuristic ctx:implements ?directive .
    ?directive a ctx:Directive .
  }
}

```

### 2. Identifying "Dead-Letter" Directives

This query finds Directives in the CDA that have no corresponding Heuristics in the CL. These are "aspirational" principles that currently lack an operational "Happy Path."

```sparql
PREFIX ctx: <http://ctx.ai/ontology/>

SELECT ?directive ?title
WHERE {
  ?directive a ctx:Directive ;
             ctx:title ?title .
  
  # Filter out directives that are successfully implemented
  FILTER NOT EXISTS {
    ?heuristic ctx:implements ?directive .
  }
}

```

---

### 3. Visual Analysis of the Gap

When you run these queries, the results can be highlighted in **Sigma.js** to show the "fragmentation" of our persona.

* **Integrated Nodes (Green):** Heuristics properly tethered to the CDA.
* **Orphan Nodes (Red):** Heuristics like `OH-101 (Conceptual Masquerade)` which currently lack a `ctx:implements` tag in the CL v1.79.
* **Aspirational Nodes (Blue):** Directives like `PHI-14 (Architectural Specialisation)` which, while defined in the CDA, do not yet have a dedicated `OH-` protocol to enforce them.

### 4. Application to the VGAP (OH-103)

We can now refine **OH-103 (Version Gap-Analysis Protocol)**. Instead of a simple text diff, the protocol should now include:

1. **Semantic Validation:** Run the above SPARQL queries on the new version.
2. **Integrity Report:** Flag any new "Dead-Letter" directives or "Under-Governed" heuristics created by the update.
3. **Biddability Check:** Ensure that any heuristic mitigating `ctx:issue/Biddability` is still correctly guided by `ctx:directive/ADV-8`.

**Would you like me to formulate the specific `INSERT` statements needed to update the `Edges` table in your SQLite database with these new semantic links?**