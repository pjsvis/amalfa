# Knowledge Graph Proposal: High-Value Token Extraction for hiac

**Goal**: Extract semantic units from the codebase to build a navigable knowledge graph.

---

## 1. What Are "High-Value Tokens"?

In the context of navigating code for AI development and human understanding, **high-value tokens** are:

- **Atomic units**: Functions, methods, classes, types, interfaces
- **Relationships**: calls, inherits-from, imports, dependencies, instantiations
- **Semantic context**: docstrings, type signatures, parameter descriptions, error types
- **Configuration**: models, roles, providers, CLI options, flags
- **Data models**: briefs, playbooks, system prompts, hooks

**Not high-value**: Variable names, comments about code structure, trivial whitespace, generated boilerplate.

---

## 2. Proposed Graph Schema

### Nodes (Vertices)

```
Node Types:
├── File (source code files)
├── Module (TypeScript module boundary)
├── Class (OOP classes)
├── Function (async functions, methods, generators)
├── Type (interfaces, types, enums)
├── Constant (module-level exports)
├── Provider (Ollama, Cloud, CLI wrappers)
├── Role (YAML roles)
├── Hook (verification hooks)
└── Config (config keys, defaults)

Properties:
├── name (identifier)
├── kind (file/module/class/function/type/etc.)
├── path (filesystem path)
├── startLine, endLine (location)
├── docstring (if present)
├── parameters (arg names + types)
├── returnType (if method)
├── parent (for class members)
└── metadata (e.g., provider class name)
```

### Edges (Relationships)

```
Edge Types:
├── imports (module A imports module B)
├── defined-in (class/method defined in file/module)
├── calls (A calls B)
├── returns-from (A returns value created by B)
├── parameter-type (function param type is a class/type)
├── uses (A uses config/constant from B)
├── extends (A extends B)
├── implements (A implements B)
├── instantiates (A creates new instance of B)
├── config-by (config key is used by function/class)
├── route-to (provider routes to another provider)
└── contains (module A contains file B)
```

### Edge Properties

```
Attributes:
├── directed (default) - some edges are bidirectional
├── confidence (0-1) - e.g., for approximate calls (deprecated/usages)
└── annotation (optional notes)
```

---

## 3. Extraction Layers

### Layer 1: File Structure (baseline)

**Input**: File system walk
**Output**: Files, modules, classes, types

**What we get**:
```
src/
├── providers/
│   ├── ollama.ts (File)
│   │   └── OllamaProvider (Class)
│   │       ├── isAvailable (Function)
│   │       ├── listModels (Function)
│   │       └── stream (Function)
│   └── cloud.ts (File)
└── utils/
    └── config.ts (File)
        └── loadConfig (Function)
```

**Tools**: LSP symbols, AST-grep, or manual source parsing

---

### Layer 2: Type & Signature Extraction (structural)

**Input**: TypeScript source + `tsconfig.json`
**Output**: Node types with full signatures

**What we extract**:
```typescript
// From src/providers/ollama.ts:18-105
{
  name: "OllamaProvider",
  kind: "class",
  path: "src/providers/ollama.ts",
  startLine: 18,
  endLine: 105,
  docstring: null, // or "Local Ollama streaming provider",
  methods: [
    {
      name: "isAvailable",
      kind: "function",
      startLine: 25,
      endLine: 34,
      returnType: "Promise<boolean>",
      parameters: []
    },
    {
      name: "stream",
      kind: "function",
      startLine: 51,
      endLine: 104,
      returnType: "AsyncIterable<string>",
      parameters: [
        { name: "messages", type: "Message[]" },
        { name: "model", type: "string" },
        { name: "options", type: "StreamOptions?" }
      ]
    }
  ],
  implements: ["Provider"]
}
```

**Tools**:
- `tsc --listFiles` + `tsc --project` for type info
- `lsp_symbols` for types/functions/classes
- `lsp_goto_definition` + `lsp_find_references` for call graph

---

### Layer 3: Call Graph & Data Flow (runtime behavior)

**Input**: Function signatures + call sites
**Output**: Calls, dependencies, instantiations

**What we extract**:
```
OllamaProvider.stream() → CloudProvider.stream()
  ← CloudProvider is imported from factory.ts:3
  ← is defined in src/providers/cloud.ts:51
  ← called by index.ts:202 (runOneshot)
```

**Call detection strategies**:

| Strategy | Confidence | Tools |
|----------|-----------|-------|
| **Literal imports** (exact paths) | High | AST-grep: `import { A } from "b"` |
| **Variable-based** (imports in scope) | Medium | Symbol table + scoping analysis |
| **Lambda captures** (arrow functions) | Low | AST-regex pattern matching |
| **Wildcard imports** | High | AST-grep: `import * as A from "b"` |
| **Dynamic imports** | Variable | Hard to detect safely; ignore or mark low confidence |

**Data flow edges**:
```
loadConfig() → writes to → ~/.hiac/config.yaml
HydratedContext.systemPrompt → stored in → messages[] (chat.ts)
OllamaProvider.isAvailable() → checks → http://localhost:11434/api/tags
```

---

### Layer 4: Domain Entities (semantic value)

**Input**: Domain-specific code patterns
**Output**: Provider, Role, Hook nodes

**What we extract**:

**Providers** (from `*Provider` classes):
```
OllamaProvider  → routes local models
CloudProvider   → routes cloud models via OpenRouter
ClaudeCLIProvider → wraps Claude CLI
GeminiCLIProvider → wraps Gemini CLI
KiloCLIProvider → wraps Kilo CLI (stub)
```

**Roles** (from `.hiac/roles.yaml`):
```
coder → model: kimi-k2.5:cloud, system: "You are..."
reviewer → model: llama3:8b, system: "You are..."
```

**Hooks** (from hook command parsing):
```
verifyWithRetry() → bounded by MAX_RETRIES=3
executeHook() → runs: sh -c "command"
```

**Configuration**:
```
folders.briefs, folders.playbooks, folders.debriefs → loaded in index.ts:250
DEFAULT_BASE_URL, OPENROUTER_BASE_URL → config constants
```

---

### Layer 5: Cross-Cutting Patterns (quality/metrics)

**Input**: Code patterns across files
**Output**: Metrics, duplication, security issues

**What we extract**:
```
Duplicate code:
  - fileExists() defined in both context.ts and roles.ts

Hardcoded values:
  - /Users/petersmith/.bun/bin/claude (4 locations)
  - DEFAULT_BASE_URL = "http://localhost:11434"
  - OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

Streaming bugs:
  - CloudProvider: No cross-chunk buffering (buffered in OllamaProvider)
  - CLI providers: Yields accumulated text (not deltas)

Security:
  - No denylist on file selection → .env could be sent to cloud
  - No API key validation (CloudProvider checks env, but only on instantiation)

Test coverage:
  - No tests for chat, oneshot, hooks, cloud, cli-providers
  - 17 tests exist (all passing)
```

---

## 4. Implementation Strategy

### Phase 1: Baseline Graph (1 day)

**Goal**: All files, modules, classes, types, with basic signatures.

**Approach**:
1. Use `lsp_symbols` with `scope="workspace"` to get all symbols
2. Run `tsc --noEmit` once to validate type signatures
3. Store in JSON format:
```json
{
  "nodes": [
    {"name": "OllamaProvider", "kind": "class", "path": "src/providers/ollama.ts", ...},
    {"name": "CloudProvider", "kind": "class", "path": "src/providers/cloud.ts", ...}
  ],
  "edges": []
}
```

**Data store**: Could use Neo4j, Arrow IPC, JSON, or simple SQLite.

---

### Phase 2: Call Graph (2-3 days)

**Goal**: Import edges, direct call edges.

**Approach**:
1. **Literal imports**: AST-grep `import { $A } from "b"`. Build edges: A → b
2. **Wildcard imports**: AST-grep `import * as $A from "b"`. Build edges: b → A
3. **Function calls**: AST-grep for `funcName(...)` inside known function scopes.

**Edge confidence labeling**:
- **High**: Exact path matches, direct calls in same file
- **Medium**: Resolved import references (requires symbol resolution)
- **Low**: Approximate matches (string literals)

**Tools**:
- `ast_grep_search` for literal imports/calls
- Custom LSP-based symbol resolution (optional)
- `lsp_find_references` for verification

---

### Phase 3: Domain Entities (1 day)

**Goal**: Provider nodes, Role nodes, Hook nodes.

**Approach**:
1. **Providers**: Glob for `*Provider.ts` files, parse class names
2. **Roles**: Read `.hiac/roles.yaml`, parse YAML
3. **Hooks**: Parse `--hook <cmd>` usage patterns, extract hook names
4. **Configuration**: Scan `src/utils/config.ts` for config keys

**Tool**: `ast_grep_search` with patterns like `class *Provider` and `const DEFAULT_`

---

### Phase 4: Patterns & Metrics (1 day)

**Goal**: Identify code quality patterns, security issues, duplication.

**Approach**:
1. Duplicate detection: Hash each function body; group by hash; mark similar
2. Hardcoded values: Regex search for common patterns
3. Security issues: Denylist patterns (`.env`, `api_key`, `secret`)
4. Test coverage: Union of tested functions vs total functions

**Tools**:
- `ast_grep_search` for patterns
- Custom code hashing (simplified, not full AST diff)

---

## 5. Query Patterns (what you can ask)

Once the graph is built, you can ask:

**Navigation queries**:
```
"Show me all providers that call stream()"
"Find all places where config.folders is used"
"Show the call chain for loadConfig()"
"What functions use OllamaProvider?"
```

**Code quality queries**:
```
"What are the most complex functions (by cyclomatic complexity)?"
"Show me files with multiple hardcoding issues"
"Find deprecated functions (no references in the codebase)"
```

**Security queries**:
```
"Which functions accept arbitrary file paths?"
"Show all places where credentials might be logged"
"What configuration keys are not validated?"
```

**Learning queries**:
```
"How is the CLI option parsing flow structured?"
"Show the stream processing pipeline"
"What are the main types of providers?"
```

---

## 6. Recommended Tech Stack

### Extraction Layer (run once):
- **Tooling**: TypeScript API (built-in), LSP client (for symbols), AST-grep (for literal patterns)
- **Database**: Neo4j (for rich graph queries) OR SQLite (simpler, faster to prototype)
- **Script**: TypeScript/TSX, run as pre-commit hook or CI job

### Query Layer:
- **Bun** (CLI parsing, input validation)
- **Cypher** (Neo4j queries) OR **SQL** (SQLite queries)
- **Nice-gremlin** (if using Neo4j + gremlin for recursive queries)
- **Optional**: HTTP API for humans to query graph

---

## 7. Benefits

**For AI assistants (future use)**:
- Instant grounding: find exact function implementations, types, call chains
- Context injection: pull in relevant imports, parents, dependencies when user asks about a concept
- Pattern recognition: detect architectural patterns (e.g., "all providers have X method")

**For humans**:
- Faster code understanding: navigate to related code with a single query
- Cross-file debugging: see why `isAvailable()` returns false — trace through call chain
- Feature exploration: "show me all places where system prompts are used"
- Onboarding: "what are the main entry points to chat/oneshot modes?"

**For the repository**:
- Living documentation: graph reflects current code, not stale markdown
- Quality metrics: tracking architectural drift over time
- Security auditing: automated detection of unsafe patterns

---

## 8. Next Steps (if approved)

1. **Prototype Phase**: Build baseline graph for just one module (e.g., `src/providers/`) to validate approach
2. **Tooling Development**: Write extractor script using LSP + AST-grep
3. **Database Selection**: Try Neo4j first, or start with SQLite for MVP
4. **Test Queries**: Verify graph answers real navigation questions
5. **Scale**: Run extraction on full codebase, optimize for speed/cost

**Estimated effort**: 5-7 days for full extraction + query layer.

**Risk**: Maintenance — graph becomes stale unless updated regularly (CI integration recommended).

---

*Prepared by: Sisyphus (hiac codebase analysis agent)*
