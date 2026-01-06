## Task: AMALFA - A Memory Layer For Agents

**Objective:** Extract the PolyVis MCP (Model Context Protocol) server implementation into a standalone, reusable, and distributable package called **AMALFA** that can be installed via Bun/NPM and integrated into any knowledge graph project.

### Vision
Transform the PolyVis-specific MCP server into a generic "memory layer" that allows AI agents (Claude Desktop, Cursor, Windsurf, etc.) to query structured knowledge graphs via:
- **Vector search** (semantic similarity)
- **Graph traversal** (relationships, paths, communities)
- **Content retrieval** (reading source documents)
- **Directory exploration** (listing available resources)

---

## Key Actions Checklist

- [ ] **Analyze Current Implementation** - Document dependencies, PolyVis-specific logic, and architectural patterns
- [ ] **Design Generic Interface** - Define configuration schema for consumers (DB path, vector model, etc.)
- [ ] **Create New Repository** - Initialize AMALFA as standalone project with proper structure
- [ ] **Extract Core Logic** - Port MCP server code with abstraction layers for database/vector engine
- [ ] **Package Configuration** - Setup for NPM/Bun registry with proper exports and binaries
- [ ] **Documentation** - README, API docs, integration examples
- [ ] **Verification** - Test installation and integration in clean environment
- [ ] **Migration Guide** - Document how to migrate PolyVis to use published AMALFA package

---

## Detailed Requirements

### 1. Current State Analysis

**PolyVis MCP Server Location:** `src/mcp/index.ts`

**Core Dependencies:**
- `@modelcontextprotocol/sdk` (v1.25.0) - MCP protocol implementation
- Custom: `VectorEngine`, `ResonanceDB`, `ServiceLifecycle`, `Logger`, `EnvironmentVerifier`
- Runtime: Bun-specific APIs (`Bun.file`, `import.meta.dir`)

**Current Features:**
1. **search_documents** - Vector semantic search (FAFCAS protocol)
2. **read_node_content** - Hollow node pattern (filesystem-backed)
3. **explore_links** - Graph edge traversal
4. **list_directory_structure** - Static directory listing
5. **inject_tags** - File annotation (Gardener agent)

**PolyVis-Specific Patterns:**
- Hollow Nodes: Content stored in filesystem, DB has metadata + embeddings
- Per-request connections: Fresh DB connection per MCP call
- Schema v5: `nodes` table with `meta` JSON column containing `source` path
- ServiceLifecycle integration: PID/log file management
- Hardcoded paths: `public/resonance.db`, specific directory structure

---

### 2. Proposed AMALFA Architecture

#### Core Design Principles
1. **Zero Config for Simple Cases** - Work with sensible defaults
2. **Markdown-First** - Purpose-built for indexing markdown documentation in repos
3. **Single Schema Pattern** - PolyVis hollow-nodes pattern (simple, proven)
4. **Runtime Agnostic** - Support both Bun and Node.js
5. **Modern Embeddings** - BGE-Small-EN-v1.5 as default (not legacy all-MiniLM)

#### Configuration Schema
```typescript
// amalfa.config.ts (or JSON)
export default {
  // Database
  database: {
    path: ".amalfa/resonance.db", // Safe location, won't be accidentally deleted
    // No schema option - always hollow-nodes pattern
  },
  
  // Vector Search
  vector: {
    model: "BGESmallENV15", // Default: BGE Small v1.5 (modern, fast)
    dimensions: 384,
    enabled: true,
  },
  
  // Graph
  graph: {
    nodeTable: "nodes",
    edgeTable: "edges",
    enabled: true,
  },
  
  // Content Resolution (always filesystem via hollow-nodes)
  content: {
    rootPath: "./",
    metaField: "meta", // JSON field containing source path
  },
  
  // Server
  server: {
    name: "amalfa-mcp",
    version: "1.0.0",
    transport: "stdio", // Only stdio - HTTP/SSE not needed for MCP
  },
  
  // Tools (enable/disable specific capabilities)
  tools: {
    search: true,
    read: true,
    traverse: true,
    list: true,
    annotate: false, // File writing capability
  },
  
  // Source directories - specify which markdown folders to index
  sources: [
    { path: "docs", name: "Docs" },
    { path: "playbooks", name: "Playbook" },
    { path: "briefs", name: "Brief" },
    { path: "debriefs", name: "Debrief" },
  ],
}
```

#### Package Structure
```
amalfa/
├── src/
│   ├── server.ts           # Main MCP server logic
│   ├── config.ts           # Configuration loader/validator
│   ├── database.ts         # Direct SQLite implementation
│   ├── vector.ts           # FastEmbed + FAFCAS
│   ├── content.ts          # Filesystem content resolver
│   ├── tools/              # MCP tool implementations
│   │   ├── search.ts
│   │   ├── read.ts
│   │   ├── traverse.ts
│   │   ├── list.ts
│   │   └── annotate.ts
│   └── cli.ts              # CLI entry point
├── bin/
│   └── amalfa              # Executable script
├── tests/
├── examples/
│   ├── basic/              # Minimal setup
│   ├── multi-source/       # Multiple doc folders
│   └── custom-model/       # Different embedding model
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

#### Project Structure (Consumer Side)
```
my-project/
├── docs/                   # Source markdown files
├── playbooks/
├── briefs/
├── .amalfa/               # AMALFA data directory (gitignored)
│   ├── resonance.db       # SQLite database
│   ├── cache/             # FastEmbed model cache
│   └── logs/              # Operation logs (optional)
├── amalfa.config.ts       # Configuration file
└── .gitignore             # Should include .amalfa/
```

---

### 3. Abstraction Strategy

#### Database Pattern (Simplified - No Adapters v1.0)
```typescript
// Direct SQLite implementation - no adapter layer for v1.0
// Always uses hollow-nodes pattern:
// - nodes table: id, meta (JSON with source path), vector (blob)
// - edges table: source, target, type
// - Content stored in filesystem, DB has metadata + embeddings
```

#### Content Resolution (Always Filesystem)
```typescript
// src/content.ts
export class ContentResolver {
  async resolve(nodeId: string): Promise<string | null> {
    // 1. Query DB: SELECT meta FROM nodes WHERE id = ?
    // 2. Extract source path from meta.source
    // 3. Read file from filesystem (Bun.file or fs.readFile)
    return content;
  }
}
```

#### Vector Engine (FastEmbed + FAFCAS)
```typescript
// src/vector.ts
export class VectorEngine {
  private embedder: FlagEmbedding; // From fastembed
  private model = EmbeddingModel.BGESmallENV15; // Default modern model
  
  async search(query: string, limit: number): Promise<SearchResult[]> {
    // 1. Generate query embedding (L2 normalized via FAFCAS)
    // 2. Pure dot product search in SQLite
    // 3. Return top N results with scores
  }
}
```

---

### 4. Package Distribution

#### NPM/Bun Package Configuration
```json
{
  "name": "amalfa",
  "version": "1.0.0",
  "description": "A Memory Layer For Agents - MCP server for knowledge graphs",
  "keywords": ["mcp", "knowledge-graph", "ai-agents", "vector-search", "sqlite"],
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "amalfa": "dist/cli.js"
  },
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./config": "./dist/config.js"
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "bun build src/cli.ts --outdir dist --target node",
    "prepublish": "bun run build"
  },
  "peerDependencies": {
    "@modelcontextprotocol/sdk": "^1.25.0"
  },
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "fastembed": "^2.0.0"
  }
}
```

#### Installation Patterns
```bash
# For end users
bun add amalfa
# or
npm install amalfa

# For MCP client configuration
bun run amalfa setup > mcp_config.json
```

#### Usage Patterns
```typescript
// Option 1: CLI (for MCP clients)
// $ amalfa serve --config ./amalfa.config.ts

// Option 2: Programmatic
import { createServer } from "amalfa";

const server = await createServer({
  database: { path: "./my-knowledge.db" },
  vector: { model: "all-MiniLM-L6-v2" },
});

await server.start(); // stdio by default
```

---

### 5. Migration Strategy for PolyVis

**Phase 1: Extract to new repo** (keep PolyVis MCP working)
- Create AMALFA repo with extracted code
- Test in isolation
- Publish to NPM/JSR

**Phase 2: Migrate PolyVis to use AMALFA**
- Install AMALFA as dependency
- Create `amalfa.config.ts` matching current behavior
- Remove `src/mcp/` directory
- Update `package.json` script: `"mcp": "amalfa serve --config amalfa.config.ts"`
- Verify functionality parity

**Phase 3: Enhance AMALFA** (post-extraction)
- Add more schema patterns
- Support HTTP/SSE transport
- Plugin system for custom tools
- Observability (metrics, tracing)

---

### 6. Open Questions & Design Decisions

#### Package Name: AMALFA
**Opinion:** Strong YES - it's memorable, available, and meaningful
**Reasoning:**
- **Available on NPM** ✅ (verified)
- **Memorable:** Short, pronounceable, not generic
- **Meaningful:** "A Memory Layer For Agents" - clear purpose
- **No conflicts:** Not a common word, unlikely namespace collisions
- **Brandable:** Easy to talk about, good for docs/blog posts

**Alternative considered:** `mcp-memory`, `knowledge-mcp`, `agent-context`
- Too generic, likely taken or will cause confusion
- AMALFA is distinctive without being obscure

**Concerns addressed:**
- "Is it too clever?" → No, it's a backronym that actually works
- "Will people remember it?" → More memorable than generic names
- "Pronunciation?" → ah-MAL-fah (clear, easy)

**Decision: Use AMALFA** 🚀

---

#### Database Location: `.amalfa/` Directory
**Opinion:** YES - dedicated directory, not project root
**Reasoning:**
- **Safety:** Prevents accidental deletion (less visible than `resonance.db` in root)
- **Organization:** All AMALFA artifacts in one place (DB, cache, logs)
- **Gitignore friendly:** Single pattern `.amalfa/` covers everything
- **Convention:** Follows pattern of `.git/`, `.next/`, `.cache/`, etc.
- **Clean root:** Keeps project root tidy (no scattered DB files, PID files, logs)

**Directory Structure:**
```
.amalfa/
├── resonance.db        # SQLite database (nodes, edges, vectors)
├── cache/              # FastEmbed model cache (if local override)
└── logs/               # Operation logs (optional, for debugging)
```

**Migration from PolyVis:**
- PolyVis uses `public/resonance.db` (web-accessible)
- AMALFA uses `.amalfa/resonance.db` (project-local, hidden)
- Different use case: PolyVis serves DB to browser, AMALFA is CLI-only

**First-run behavior:**
- If `.amalfa/` doesn't exist, create it automatically
- Add to `.gitignore` if not present (or warn user to do so)
- macOS: Show notification when index complete ✅

**Decision: Use `.amalfa/` directory convention**

---

#### HTTP/SSE Transport
**Opinion:** NO - stdio only for v1.0
**Reasoning:**
- **MCP Protocol:** Designed for stdio (local client ↔ server communication)
- **Use Case:** Claude Desktop, Cursor, etc. all use stdio for MCP
- **Complexity:** HTTP/SSE adds auth, CORS, deployment overhead
- **Security:** stdio is inherently local (no network exposure)
- **Simple:** One transport = less testing, docs, edge cases

**When would HTTP/SSE make sense?**
- Remote MCP server (team shared knowledge base)
- Browser-based MCP clients (if they emerge)
- Multi-user scenarios

**For v1.0:** These are NOT the target use case. AMALFA is for:
- Individual developer's local markdown knowledge base
- Project-specific documentation indexing
- Agent memory augmentation on same machine

**Decision: stdio only, reconsider HTTP in v2.0 if demand exists**

---

#### Runtime Support
**Opinion:** Start Bun-first, add Node.js compatibility in v1.1
**Reasoning:** 
- Bun has better TypeScript support (no build step needed)
- PolyVis already uses Bun APIs (`Bun.file`, fast SQLite)
- Node.js support requires replacing Bun-specific code with runtime-agnostic alternatives

**Action:** Use conditional exports and feature detection:
```typescript
const readFile = typeof Bun !== "undefined" 
  ? (path: string) => Bun.file(path).text()
  : (path: string) => fs.promises.readFile(path, "utf-8");
```

#### Schema Pattern
**Decision:** Single pattern only - hollow nodes (PolyVis pattern)
**Reasoning:**
- AMALFA is purpose-built for markdown documentation indexing
- Hollow nodes = content in filesystem, DB has metadata + embeddings
- Simple, proven, no need for multiple schema patterns in v1.0
- Users building different systems can fork/adapt the pattern
- **No auto-detection needed** - it's always hollow nodes

#### Vector Model Distribution
**Decision:** Use FastEmbed's built-in download mechanism (with caveats)
**Reasoning:**
- BGE-Small-EN-v1.5 model is ~80MB
- FastEmbed already handles download to `~/.cache/fastembed/` on first use
- NPM package stays lean (~1MB)
- **No custom download logic needed** - leverage fastembed's infrastructure

**Platform Risk Acknowledged:**
- FastEmbed has known issues on Windows (C++ build tools) and some macOS/Linux (ONNX paths)
- **Windows Reality:** AI developers on Windows use WSL2 (Linux environment)
- **v1.0 Strategy:** 
  - Primary support: macOS, Linux, WSL2
  - Document extensively, provide `amalfa doctor` diagnostic tool
  - Native Windows: "experimental" status, document C++ build tool requirement
- **v1.1 Fallback:** Add pure-JS embeddings option (`@xenova/transformers`) for edge cases
- **Alternative:** Remote API embeddings (OpenAI, Cohere) as escape hatch

#### Tool Granularity
**Opinion:** Keep 5 core tools vs. expand to 20+ specialized tools
**Reasoning:**
- Fewer tools = simpler for agents to understand
- Generic tools (`search`, `read`) are more flexible than specialized ones
- **Proposal:** Ship with 5 core tools, document extension pattern for custom tools

#### TypeScript Configuration
**Opinion:** Distribute as compiled JS + .d.ts vs. source TS requiring consumer build
**Reasoning:**
- Compiled: Works everywhere, no build step for consumers
- Source: Allows tree-shaking, requires compatible tsconfig
- **Proposal:** Compiled for main distribution, source available in repo for advanced users

---

### 7. Documentation Requirements

#### README.md Structure
1. **Quick Start** - 5-minute setup for basic usage
2. **Installation** - NPM/Bun commands
3. **Configuration** - Schema reference with examples
4. **Integration** - Claude Desktop, Cursor, Windsurf setup
5. **Architecture** - Design principles, adapter pattern
6. **Examples** - Common use cases
7. **API Reference** - Tool descriptions, parameters
8. **Contributing** - How to add adapters/tools

#### Integration Guides
- **Claude Desktop:** JSON config for `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cursor:** `.cursor/mcp.json` setup
- **Windsurf:** Integration instructions (TBD - check if supports MCP)
- **Generic MCP Client:** stdio transport setup (standard MCP protocol)

#### Example Configurations
- **Basic** - Single docs folder, default model
- **Multi-Source** - Multiple folders (docs, playbooks, briefs)
- **Custom Model** - Override to AllMiniLM or other fastembed model
- **Read-Only** - Disable annotation tool (file writes)
- **Daemon Mode** - Use remote embedding service for speed

---

### 8. Success Criteria

**Must Have (v1.0):**
- [ ] Package installable via `bun add amalfa` / `npm install amalfa`
- [ ] CLI command `amalfa serve` starts MCP server
- [ ] CLI command `amalfa doctor` checks dependencies and platform compatibility
- [ ] Supports hollow-nodes pattern (PolyVis-style)
- [ ] Vector search working with FAFCAS protocol
- [ ] Graph traversal (edges) working
- [ ] Content reading (filesystem) working
- [ ] Configuration via `amalfa.config.ts` or CLI args
- [ ] Works with Claude Desktop out-of-box (macOS tested)
- [ ] macOS notification support for index completion (native)
- [ ] Comprehensive README with troubleshooting section
- [ ] Platform compatibility matrix documented (macOS/Linux/WSL2 primary, Windows experimental)
- [ ] `.amalfa/` directory convention documented and added to default `.gitignore`
- [ ] PolyVis successfully migrated to use AMALFA package

**Nice to Have (v1.1+):**
- [ ] Node.js runtime support (not just Bun)
- [ ] Pure-JS embeddings fallback (`@xenova/transformers`) for problematic platforms
- [ ] Remote embeddings API support (OpenAI, Cohere, Mistral) as alternative
- [ ] Plugin system for custom tools
- [ ] Cross-platform notifications (Linux notify-send, Windows toast)
- [ ] Observability (structured logging, metrics)
- [ ] Docker container for easy deployment (pre-configured FastEmbed)
- [ ] Published to JSR (Deno registry) in addition to NPM
- [ ] Graph community detection (Louvain clusters)
- [ ] Incremental indexing (only changed files)

---

### 9. Risk Assessment

**High Risk:**
- **Runtime compatibility** - Bun-specific APIs may not work in Node.js
  - *Mitigation:* Abstract file I/O (Bun.file vs fs.promises), test in both
  
- **MCP spec changes** - Protocol is still evolving (v1.25.0)
  - *Mitigation:* Pin SDK version, document upgrade path in README

**Medium Risk:**
- **FastEmbed platform issues** - Known issues on native Windows
  - **Windows:** Requires Microsoft Visual C++ 14.0+ build tools
  - **macOS/Linux:** Rare ONNX runtime path issues (needs `ONNX_PATH` env var)
  - **Reality Check:** Most AI developers on Windows use WSL2 (Linux env = no issues)
  - *Mitigation:* 
    - Primary support: macOS, Linux, WSL2 (covers 95%+ of target users)
    - Native Windows: "experimental" with clear documentation
    - Pre-flight check: `amalfa doctor` to verify dependencies
    - Fallback options: Remote embeddings API (OpenAI, Cohere) for edge cases
    - Future: Pure-JS alternative (`@xenova/transformers`) for v1.1 if needed
  
- **Package adoption** - May be too PolyVis-specific for general use
  - *Mitigation:* Clear docs on use case (markdown knowledge bases), examples

**Low Risk:**
- **Package name availability** - "amalfa" is AVAILABLE on NPM ✅
  - No mitigation needed - claim it early!

---

### 10. Proposed Timeline

**Week 1: Extraction & Abstraction**
- Day 1-2: Create repo, extract core MCP logic
- Day 3-4: Design and implement adapter interfaces
- Day 5: Configuration system and validation

**Week 2: Packaging & Testing**
- Day 1-2: Package configuration, build pipeline
- Day 3-4: Integration testing (fresh installs)
- Day 5: Documentation (README, examples)

**Week 3: Migration & Polish**
- Day 1-2: Migrate PolyVis to use AMALFA package
- Day 3-4: Real-world testing with Claude Desktop
- Day 5: Publish to NPM, announce

---

## NPM Publication Process

### Step 1: Reserve the Package Name

**Email Privacy Strategy:**

**Problem:** NPM publishes your email address publicly in package metadata

**Solutions used by developers:**

1. **GitHub-provided no-reply email (RECOMMENDED):**
   ```
   <username>@users.noreply.github.com
   ```
   - GitHub provides this for every user
   - Find yours: GitHub Settings → Emails → "Keep my email private"
   - Format: `<github-id>+<username>@users.noreply.github.com`
   - Example: `123456+pjsvis@users.noreply.github.com`
   - Works for NPM, git commits, everything
   - Zero spam, privacy preserved

2. **Dedicated project email (Alternative):**
   - Use `pjstarifa@gmail.com` if you're okay with it being public
   - Create filters/labels for NPM-related mail
   - Gmail is common for open source (easy for users to contact)

3. **ProtonMail alias (If staying with Proton):**
   - Proton Plus allows custom aliases
   - Create `amalfa@pm.me` or similar
   - Forwards to your main Proton account
   - Don't use `pjsvis@protonmail.com` directly

**Opinion: Use GitHub no-reply email**
- Already privacy-focused (GitHub standard)
- No new account needed
- Works across git + NPM seamlessly
- Most open source devs do this

**Setup:**
```bash
# 1. Get your GitHub no-reply email
# Go to: https://github.com/settings/emails
# Enable "Keep my email addresses private"
# Copy your no-reply address: <id>+<username>@users.noreply.github.com

# 2. Configure git
git config --global user.email "<id>+<username>@users.noreply.github.com"

# 3. Use same email for NPM
npm adduser
# Email: <id>+<username>@users.noreply.github.com
```

**What shows up publicly:**
- Package author field: Your name + no-reply email
- Users see: "Peter Smith <123456+pjsvis@users.noreply.github.com>"
- Clicking email does nothing (it's a black hole)
- Contact happens via GitHub Issues instead

---

**Create NPM Account:**
```bash
# If you don't have an NPM account
npm adduser
# Username: pjsvis (or similar)
# Email: <your-github-no-reply-email>
# Password: [use password manager]

# If you already have an account with old email
npm login
# Then update email in NPM account settings
```

**Reserve the name (without publishing):**
```bash
# Create minimal package.json
cd /path/to/amalfa
npm init --scope=public
# Set name: "amalfa"
# Set version: "0.0.0-reserved"
# Set description: "A Memory Layer For Agents - Coming Soon"

# Publish placeholder (reserves the name)
npm publish --access public
```

**Why reserve early:**
- Name is available NOW, might not be later
- Shows "amalfa" on NPM with "coming soon" description
- Prevents squatting while you build

**Placeholder package.json:**
```json
{
  "name": "amalfa",
  "version": "0.0.0-reserved",
  "description": "A Memory Layer For Agents - MCP server for knowledge graphs (Coming Soon)",
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/amalfa"
  },
  "keywords": ["mcp", "knowledge-graph", "ai-agents", "coming-soon"]
}
```

---

### Step 2: Publication Workflow (v1.0 Release)

**Pre-publish Checklist:**
```bash
# 1. Ensure tests pass
bun test

# 2. Build package
bun run build

# 3. Test installation locally
cd /tmp/test-install
bun add file:/path/to/amalfa
bun run amalfa doctor
bun run amalfa serve --help

# 4. Bump version to 1.0.0
npm version 1.0.0

# 5. Verify package contents
npm pack --dry-run
# Check: Only dist/, README, LICENSE are included (not src/, tests/)
```

**Publish to NPM:**
```bash
# Tag as latest
npm publish --access public

# Tag as specific version (if needed)
git tag v1.0.0
git push origin v1.0.0
```

**Post-publish verification:**
```bash
# Wait 2-3 minutes for NPM to propagate
npm view amalfa

# Test fresh install
cd /tmp/fresh-test
npm install amalfa
npx amalfa --version
```

---

### Step 3: Bun Registry (JSR)

**Bun also supports JSR (Jsr.io - Deno/Bun registry):**
```bash
# Optional: Publish to JSR for Bun-native distribution
npx jsr publish
```

**Benefits:**
- Native TypeScript support (no build step)
- Better for Bun/Deno users
- Can publish to both NPM and JSR

---

## Launch & Publicity Strategy

### Phase 1: Soft Launch (Week 1)

**Goal:** Get early adopters, gather feedback

**Channels:**
1. **GitHub Release:**
   - Tag v1.0.0 with detailed release notes
   - Include GIF demo of Claude Desktop integration
   - Link to comprehensive README

2. **Twitter/X Post:**
   ```
   🚀 Introducing AMALFA v1.0
   
   A Memory Layer For Agents - give your AI assistant access to your project's knowledge graph.
   
   🔍 Vector search your docs
   📊 Graph traversal
   🧠 Works with Claude Desktop, Cursor
   
   Built with: Bun + SQLite + FastEmbed + MCP
   
   npm install amalfa
   
   [Link to repo]
   #AI #MCP #KnowledgeGraph
   ```

3. **Dev.to Article:**
   - Title: "Building a Memory Layer for AI Agents: AMALFA v1.0"
   - Content: Problem statement, architecture, tutorial
   - Code examples with Claude Desktop setup
   - 5-10 min read

4. **Reddit:**
   - r/MachineLearning (careful - no self-promo, frame as "Show & Tell")
   - r/LocalLLaMA (perfect fit - local AI enthusiasts)
   - r/programming (broader audience, use "Show HN" framing)

---

### Phase 2: Hacker News (Week 2-3)

**Opinion: YES, but timing matters**

**Why Hacker News:**
- Target audience: technical developers, AI enthusiasts
- High-quality feedback (brutal but useful)
- Can drive significant traffic/adoption
- Good for recruiting contributors

**HN Strategy:**

**Post Type 1: "Show HN: AMALFA - Memory Layer for AI Agents"**
```
Title: Show HN: AMALFA – A Memory Layer for AI Agents (MCP Server)

Text:
I built AMALFA to solve a problem I had with Claude Desktop: 
it couldn't remember my project's documentation structure.

Instead of copying docs into context windows, AMALFA indexes 
markdown files into a SQLite + vector DB that Claude queries 
via Model Context Protocol (MCP).

Key features:
- Vector search (BGE embeddings, local-first)
- Graph traversal (relationships between docs)
- Hollow nodes (content in filesystem, fast updates)
- Zero config (just `npm install amalfa && amalfa serve`)

Built with Bun, SQLite, FastEmbed. Works with Claude Desktop, 
Cursor, Windsurf.

Repo: [link]
Demo video: [link]

Happy to answer questions!
```

**Best Time to Post:**
- Weekday (Tuesday-Thursday)
- 8-10am EST (catches US morning, EU afternoon)
- Avoid Fridays (low engagement)

**Post Type 2: "Ask HN: How do you give AI agents access to your docs?"**
- More discussion-focused
- Mention AMALFA as your solution
- Less "salesy", more community engagement

---

### Phase 3: Broader Outreach (Week 4+)

**1. Product Hunt:**
- Wait until v1.1 or significant traction
- Need polished landing page
- 3-5 testimonials/use cases
- Not urgent for developer tools

**2. Lobste.rs:**
- Tech-focused community (smaller than HN)
- Requires invite to post
- High-quality discussions

**3. AI/LLM Newsletters:**
- TLDR AI
- Ben's Bites
- Changelog
- Pitch as "open source tool for AI workflows"

**4. YouTube Demo:**
- 5-min walkthrough video
- Setup AMALFA with Claude Desktop
- Show real queries ("Find docs about vector search")
- Post to r/LocalLLaMA, Twitter

**5. Blog Post Series:**
- "Building AMALFA: Architecture Decisions"
- "Vector Search in 2026: BGE vs OpenAI Embeddings"
- "Making MCP Servers: A Practical Guide"
- Cross-post to Medium, Dev.to, Hashnode

---

### What NOT to Do

❌ **Avoid:**
- Spamming multiple subreddits same day
- Over-hyping ("revolutionary", "game-changer")
- Posting to HN multiple times (banned if caught)
- Ignoring feedback (even harsh criticism)
- Launch before v1.0 is solid (one shot at first impression)

✅ **Do:**
- Be transparent about limitations
- Respond to every comment (especially criticism)
- Share real use cases, not vaporware
- Include demo video/GIF (crucial for HN)
- Have GitHub Issues ready for bug reports

---

### Success Metrics

**Week 1:**
- [ ] 50+ GitHub stars
- [ ] 10+ NPM installs/day
- [ ] 3-5 constructive feedback threads

**Month 1:**
- [ ] 200+ GitHub stars
- [ ] 100+ NPM installs/day
- [ ] 1-2 community contributions (PRs)
- [ ] Featured in 1-2 newsletters

**Month 3:**
- [ ] 500+ GitHub stars
- [ ] 500+ NPM installs/day
- [ ] 5-10 community contributors
- [ ] 1-2 blog posts written by others about AMALFA

---

### Launch Timeline

**Day 1: Soft Launch**
- Publish to NPM
- GitHub release with notes
- Twitter announcement
- Reddit (r/LocalLLaMA)

**Day 3-5: Content**
- Dev.to tutorial published
- Demo video on YouTube
- Update README with real user feedback

**Day 7-10: Hacker News**
- "Show HN" post (choose best day/time)
- Monitor comments actively for 24 hours
- Incorporate feedback into v1.0.1 patch

**Week 2-3: Iteration**
- Address top 3 issues from HN/Reddit
- Publish v1.0.1 with fixes
- Thank contributors publicly

**Week 4: Broader Push**
- Pitch to newsletters
- Write architecture blog post
- Consider Product Hunt (if momentum exists)

---

## Development Strategy: Lift-and-Shift vs. Clean Extraction

### Proposed Approach: Lift-and-Shift First

**Opinion: SMART - Lower risk, faster validation**

**Strategy:**
1. Create new `amalfa` repo
2. Copy entire PolyVis codebase
3. Verify MCP server still works
4. Incrementally remove unneeded code
5. Package what remains

**Why this is better than clean extraction:**

✅ **Lower risk of breaking dependencies**
- MCP server imports from `@src/core/VectorEngine`, `@src/resonance/db`, etc.
- Easier to keep working imports than rewrite from scratch
- Can test at each removal step

✅ **Faster to working prototype**
- Week 1: Copy + verify it works
- Week 2: Remove UI, graph viz, web server
- Week 3: Package and test installation

✅ **Easier to see what's actually needed**
- Try removing something → breaks? Keep it.
- Rather than guessing what to extract upfront

✅ **Git history preserved (if desired)**
- Can keep relevant commit history
- Or start fresh with `git init`

---

### Lift-and-Shift Implementation Plan

#### Phase 1: Clone and Verify (Day 1-2)

```bash
# Create new repo
gh repo create amalfa --public --description "A Memory Layer For Agents"
cd ~/Documents/GitHub
git clone https://github.com/polyvis/amalfa.git

# Copy PolyVis (everything except .git)
cd ~/Documents/GitHub/polyvis
rsync -av --exclude='.git' --exclude='node_modules' \
  --exclude='.amalfa' --exclude='public/resonance.db' \
  . ~/Documents/GitHub/amalfa/

# Set up fresh git
cd ~/Documents/GitHub/amalfa
git init
git add .
git commit -m "Initial commit: Lift from PolyVis"
git remote add origin git@github.com:polyvis/amalfa.git
git push -u origin main

# Install deps and test MCP
bun install
bun run mcp serve
# Test with Claude Desktop - verify search works
```

**Checkpoint:** MCP server working ✅

---

#### Phase 2: Remove UI/Web Components (Day 3-5)

**Delete directories:**
```bash
# Web UI (not needed for MCP)
rm -rf public/
rm -rf src/js/
rm -rf src/css/

# Graph visualization (not needed)
rm -rf src/graph/

# Web server (not needed)
rm -rf src/server/

# Experiments (not needed)
rm -rf experiments/

# Examples (not needed)
rm -rf examples/
```

**Test after each removal:**
```bash
bun run mcp serve
# If breaks → figure out why, fix or restore
```

**Checkpoint:** MCP still works, codebase smaller ✅

---

#### Phase 3: Audit Dependencies (Day 6-7)

**Review package.json, remove unneeded:**
```json
// KEEP:
"@modelcontextprotocol/sdk": "^1.25.0",
"fastembed": "^2.0.0",
"pino": "^10.1.0",

// REMOVE (UI dependencies):
"alpinejs",
"@tailwindcss/cli",
"marked" (unless used by MCP),
"graphology-metrics" (if not used),
```

**Create new minimal package.json:**
- Name: `amalfa`
- Main: `dist/index.js`
- Bin: `dist/cli.js`
- Only MCP-related scripts

**Checkpoint:** Clean dependency tree ✅

---

#### Phase 4: Restructure for Package (Day 8-10)

**Before (PolyVis structure):**
```
src/
├── mcp/
├── core/
├── resonance/
├── utils/
└── [unused dirs]
```

**After (AMALFA structure):**
```
src/
├── server.ts        # MCP server (from mcp/index.ts)
├── database.ts      # ResonanceDB
├── vector.ts        # VectorEngine
├── content.ts       # Content resolver
├── config.ts        # Configuration loader
├── tools/           # MCP tools
│   ├── search.ts
│   ├── read.ts
│   └── traverse.ts
└── cli.ts           # CLI entry point
```

**Move and consolidate:**
```bash
# Extract what's needed
mv src/mcp/index.ts src/server.ts
mv src/core/VectorEngine.ts src/vector.ts
mv src/resonance/db.ts src/database.ts

# Update imports
# Change: import { VectorEngine } from "@src/core/VectorEngine"
# To: import { VectorEngine } from "./vector"
```

**Checkpoint:** Simplified structure, imports working ✅

---

#### Phase 5: Package Configuration (Day 11-12)

**Update package.json:**
```json
{
  "name": "amalfa",
  "version": "1.0.0",
  "description": "A Memory Layer For Agents - MCP server for knowledge graphs",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "amalfa": "dist/cli.js"
  },
  "scripts": {
    "build": "bun build src/cli.ts --outdir dist --target node",
    "dev": "bun run src/cli.ts serve",
    "test": "bun test"
  }
}
```

**Test installation:**
```bash
bun run build
cd /tmp/test-amalfa
bun add file:~/Documents/GitHub/amalfa
amalfa doctor
amalfa serve
```

**Checkpoint:** Package installs and runs ✅

---

### Alternative: Clean Extraction

**Opinion: Higher risk, not recommended for v1.0**

**Process:**
1. Create empty `amalfa` repo
2. Manually copy only MCP files
3. Rewrite imports, paths, configs
4. Debug inevitable breakages

**Why avoid this:**
- ❌ More likely to miss dependencies
- ❌ Harder to test incrementally
- ❌ More debugging time
- ❌ Might need PolyVis internals we didn't realize

**When it makes sense:**
- v2.0 after v1.0 is stable
- Architectural refactor
- When you know EXACTLY what's needed

---

### Comparison

| Aspect | Lift-and-Shift | Clean Extraction |
|--------|----------------|------------------|
| **Time to working** | 1-2 days | 1-2 weeks |
| **Risk of breakage** | Low | High |
| **Code cleanliness** | Messy initially, clean later | Clean from start |
| **Testing ease** | Easy (incremental) | Hard (all-or-nothing) |
| **Recommended for** | v1.0 | v2.0 refactor |

---

### Decision Matrix

**Choose Lift-and-Shift if:**
- ✅ You want v1.0 shipped quickly
- ✅ You're okay with iterative cleanup
- ✅ You value working software over perfect code
- ✅ You want to learn what's actually needed

**Choose Clean Extraction if:**
- ❌ You have 3+ weeks for v1.0
- ❌ You know exactly what's needed
- ❌ You want perfect architecture from day 1
- ❌ You enjoy debugging import hell

---

## Recommended Timeline (Lift-and-Shift)

**Week 1: Foundation**
- Day 1-2: Copy repo, verify MCP works
- Day 3-5: Remove UI/web/viz code
- Day 6-7: Audit dependencies

**Week 2: Package**
- Day 8-10: Restructure, simplify imports
- Day 11-12: Package config, test installation
- Day 13-14: Documentation, examples

**Week 3: Polish**
- Day 15-17: Integration testing (Claude Desktop, Cursor)
- Day 18-19: README, demo video
- Day 20-21: Publish to NPM, announce

**Total:** ~3 weeks to shipped v1.0

---

## Next Steps

1. **Decision Point:** Confirm package name ("amalfa" ✅ decided)
2. **NPM Setup:** ✅ Account created, package reserved
3. **Create GitHub Repo:** `amalfa` (public)
4. **Lift-and-Shift:** Copy PolyVis → AMALFA
5. **Verify MCP:** Test with Claude Desktop
6. **Incremental Cleanup:** Remove unneeded code
7. **Package Config:** Build, test, iterate
8. **Demo Video:** Script 3-5 min walkthrough
9. **Launch:** Publish v1.0.0, announce

---

**Status:**
- ✅ NPM account: `polyvis`
- ✅ Package reserved: `amalfa@0.0.0-reserved`
- ✅ Strategy: Lift-and-shift (approved)
- 🔜 Next: Create GitHub repo, copy codebase

---

## References

- PolyVis MCP Implementation: `src/mcp/index.ts`
- PolyVis Config: `polyvis.settings.json`
- MCP Protocol: https://modelcontextprotocol.io
- FAFCAS Playbook: `playbooks/embeddings-and-fafcas-protocol-playbook.md`
- Hollow Nodes Schema: `src/resonance/schema.ts` (version 5)
