---
date: 2026-02-15
tags: [feature, planning, architecture, graph-db, vector-search, sub-agent]
agent: local-ai
environment: local
---

## Task: Build Knowledge Graph Navigation System for amalfa

**Objective:** Extract high-value semantic tokens from the amalfa codebase and build a hybrid vector-graph database to enable AI-assisted code navigation through Amalfa.

### Subtasks

- [ ] **Phase 1: Baseline Graph Extraction**
  - Extract nodes: Files, Modules, Classes, Functions, Types
  - Build graph schema with 12 node types and 12 edge types
  - Generate embeddings for function summaries, class docstrings, provider descriptions
  - Store in existing hybrid vector-graph SQLite database

- [ ] **Phase 2: Call Graph Construction**
  - Detect literal imports and wildcard imports using AST-grep
  - Build import edges between modules
  - Detect direct function calls using AST-grep patterns
  - Label edge confidence (High/Medium/Low)

- [ ] **Phase 3: Domain Entity Recognition**
  - Identify all Provider classes (Ollama, Cloud, Claude, Gemini, Kilo)
  - Parse `.amalfa/roles.yaml` for Role nodes
  - Extract Hook definitions from `--hook` flag parsing
  - Map configuration keys to config nodes

- [ ] **Phase 4: Call Graph Enhancement**
  - Implement cross-chunk buffering for SSE streaming (CloudProvider)
  - Fix streaming delta-yields for CLI providers
  - Track data flow edges (e.g., config → config files, messages → stream)
  - Add dependency edges (depends-on, blocking)

- [ ] **Phase 5: Code Quality Metrics**
  - Detect duplicate functions (hash-based)
  - Identify hardcoded values (regex patterns)
  - Surface security issues (file selection denylist violations)
  - Calculate test coverage gaps

- [ ] **Phase 6: Sub-Agent Design**
  - Create "Code Graph Navigator" sub-agent using gemini-2.5-flash
  - Design decompose_query → vector_search → graph_query → synthesize pipeline
  - Implement tools: `decompose_query`, `vector_search`, `graph_query`, `synthesize`
  - Create prompt template with graph schema + vector search instructions

- [ ] **Phase 7: Testing & Validation**
  - Test with real questions: "Show me all providers", "Trace call chain from index to chat"
  - Verify embedding quality (semantic similarity checks)
  - Validate graph query performance (sub-100ms responses)
  - Run on full codebase (2472 LOC)

### Technical Stack

- **Extraction**: LSP symbols, AST-grep, TypeScript API
- **Database**: Existing hybrid vector-graph SQLite (no new database)
- **Embeddings**: Existing Amalfa embedding API
- **Sub-agent**: gemini-2.5-flash via OpenRouter
- **Query Language**: TDQ (if needed for graph navigation)

### Key Decisions

- **Hybrid approach**: Vector DB for semantic similarity, Graph DB for structural precision
- **Single sub-agent first**: CodeGraphNavigator with modular tool design (split only if throughput > 50 QPS)
- **Incremental extraction**: Only re-extract on code changes (CI integration recommended)
- **Embedding focus**: Functions, classes, providers, roles only (not every line)

### Integration with td (Task Management)

- Each major query becomes one td issue
- Sub-agent logs reasoning: `td log "decomposed into semantic + graph queries"`
- Handoffs capture uncertainty: `td handoff --uncertain "Need architecture consultant"`
- Analytics track performance: query types, latency, success rates

### Frontmatter Tags Best Practices

**Task Type:**
- `feature` - New feature implementation
- `planning` - Planning and design phase
- `architecture` - Architectural design and decisions

**Domain:**
- `graph-db` - Graph database work
- `vector-search` - Vector embedding and similarity search
- `sub-agent` - Sub-agent orchestration and coordination

**Verification:**
- `architecture` - Validate architecture decisions before implementation

### Expected Deliverables

1. **Graph Database Schema** (Neo4j Cypher or SQLite JSONB)
   - 12 node types with full properties
   - 12 edge types with confidence labels

2. **Extraction Script** (TypeScript)
   - Run once to populate database
   - Incremental update on code changes

3. **Sub-Agent Implementation**
   - CodeGraphNavigator with 4 tools
   - Prompt template with schema + examples

4. **Documentation**
   - Graph schema documentation
   - Query patterns and examples
   - Sub-agent usage guide

5. **Test Results**
   - 10-15 navigation queries with annotated answers
   - Performance benchmarks (latency, accuracy)

### Success Criteria

- **Completeness**: All 12 node types extracted with signatures
- **Accuracy**: 85%+ of literal imports detected correctly
- **Performance**: Vector search < 50ms, Graph query < 100ms
- **Usability**: Sub-agent answers 10 real questions correctly
- **Maintainability**: Extraction script runs in < 5 minutes on full codebase

### Success Metrics

- **Coverage**: 95% of functions have embeddings
- **Precision**: 90% of detected calls are accurate
- **Recall**: 80% of actual call graph edges found
- **Query Success**: 85% of semantic queries find relevant nodes
- **Sub-Agent Latency**: < 20s per navigation query
