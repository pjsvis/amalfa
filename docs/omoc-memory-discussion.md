# Amalfa for Oh My OpenCode: Memory System Analysis

**Date:** 2026-01-14  
**Context:** Response to Issue #74 "Memory system - Please Leave here your opinions"  
**Repository:** [code-yeongyu/oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode/issues/74)

---

## Edinburgh Protocol Analysis: Amalfa → Oh My OpenCode

**The Map vs. Territory Assessment:**

### What Does Amalfa Bring to Oh My OpenCode?

**Map (What Amalfa Claims):**
- Local-first knowledge graph with semantic search
- Brief-Debrief-Playbook workflow for institutional memory
- Disposable database philosophy (filesystem = truth)
- MCP protocol integration

**Territory (What Oh My OpenCode Needs - Per Issue #74):**

Reading the memory system thread reveals **systems-level mismatches**:

1. **Existing Solutions Focus on Session Memory:**
   - RLabs memory-ts: Session summaries + Chroma embeddings
   - AgentDB (opencode-memento): Persistent key-value with Postgres
   - Supermemory: Real-time memory injection
   - ELF: Vector + FTS hybrid for session continuity

2. **What's Missing (Per Comments):**
   - **"Decision and constraint ledger, not conversation log"** (agiulucom42-del)
   - **"Progress tracker and decision log"** (saxenauts)
   - **Cascading `AGENTS.md` updates per folder** (Razkaroth) ← **THIS IS KEY**

3. **Oh My OpenCode's Current Pattern:**
   - Uses `AGENTS.md` files per directory for **distributed context**
   - YeonGyu Kim's response: "I personally have this workflow but currently experimenting"

### Hume's Razor: What Amalfa ACTUALLY Offers

**NOT a session memory system. NOT a conversation log.**

**Amalfa is a:**
- **Codebase-wide knowledge index** (309 nodes in <1s ingestion)
- **Decision record system** (playbooks = codified patterns)
- **Cross-session semantic search** (vector + graph traversal)
- **Git-auditable metadata augmentation** (auto-tagging, auto-linking)

### Systems Thinking: The Incentive Match

| Oh My OpenCode Need | Amalfa Solution | Why It Meshes |
|---------------------|-----------------|---------------|
| **Distributed AGENTS.md files** | Markdown-first architecture | Amalfa's source of truth = filesystem |
| **Decision & constraint ledger** | Playbooks + debriefs | Not session logs—codified patterns |
| **Cascading updates** | Auto-augmentation via Ember | Git-tracked, auditable metadata |
| **Cross-project memory** | Semantic search across repos | Query "How did we handle auth in Project X?" |
| **Non-redundant** | Disposable DB | No duplication—regenerate from markdown |

**Adam Smith's Division of Labor:**
- **Session memory systems** (RLabs, AgentDB): Handle "What did I just say?"
- **Amalfa**: Handles "What have we learned across all projects?"

They're **complementary**, not competing.

### Pragmatic Selling Points (The "Does It Work?" Test)

**For Oh My OpenCode Adopters:**

1. **Stop Re-Solving Problems:**
   - Agents forget learnings across sessions
   - Amalfa indexes playbooks: "Authentication patterns that worked"
   - MCP tool: `search_documents("jwt refresh token strategy")` → returns ranked debriefs

2. **Scales Oh My OpenCode's AGENTS.md Pattern:**
   - Instead of manually updating AGENTS.md per folder, let Amalfa auto-generate
   - Ember service scans for clusters, suggests tags/links
   - Git-commit the augmentations → reviewable changes

3. **Zero Migration Hell:**
   - Database corrupted? `rm -rf .amalfa/ && bun run scripts/cli/ingest.ts`
   - Markdown = truth. DB = disposable cache.
   - Upgrade Amalfa? Just re-ingest.

4. **Local-First:**
   - No external dependencies (SQLite + FastEmbed)
   - Runs on Bun (fast, TypeScript-native)
   - No cloud services, no API keys for memory itself

5. **MCP Native:**
   - Already speaks the protocol Oh My OpenCode uses
   - Drop into `opencode.json` MCP config
   - Instant semantic search for Sisyphus/Oracle/Librarian agents

---

## Quick Start for Oh My OpenCode Users

### Installation

```bash
bun install -g amalfa
cd ~/my-project
amalfa init  # Creates amalfa.config.json
amalfa serve  # Starts MCP server
```

### Integration with Oh My OpenCode

Add to `~/.config/opencode/opencode.json`:

```json
{
  "mcpServers": {
    "amalfa": {
      "command": "amalfa",
      "args": ["serve"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

### Usage Example

```
# In Oh My OpenCode session
User: "How did we solve the embedding model mismatch before?"
Sisyphus: [Uses search_documents MCP tool]
Amalfa: Returns debrief-2026-01-13-vector-recall-fix.md
Sisyphus: "We switched to BGESmallENV15 and added FAFCAS normalization"
```

---

## The Anti-Redundancy Argument

**Maintainer Concern (from Issue #74):**
> "memory system- but it's really easy to be redundant from my experiences."

**Amalfa's Defense:**
- **Not session-level:** Doesn't track "what user said 5 minutes ago"
- **Cross-temporal:** Indexes decisions across weeks/months
- **Filesystem-backed:** If Amalfa disappears tomorrow, you still have markdown files
- **MCP-optional:** Can use CLI (`amalfa stats`, `amalfa doctor`) without MCP integration

**The Scottish Enlightenment Test:**
- **Does it add bloat?** No—DB is disposable, markdown is lean.
- **Does it duplicate work?** No—complements session memory (RLabs, AgentDB).
- **Is it theoretically pure?** Who cares. **Does it work?**

---

## Recommended Comment for Issue #74

### Amalfa: Cross-Project Knowledge Index (Not Session Memory)

Most memory systems track **session continuity** ("What did I just say?"). Amalfa tracks **institutional memory** ("What have we learned across all projects?").

**What it does:**
- Indexes markdown docs (briefs, debriefs, playbooks) as semantic knowledge graph
- Auto-generates metadata (tags, links, clusters) via git-auditable commits
- MCP tools: `search_documents`, `explore_links`, `find_gaps`
- Local-first: SQLite + FastEmbed (no cloud dependencies)

**Why it's not redundant:**
- **Filesystem = truth**, database = disposable cache
- Regenerates from markdown in <1s (no migration hell)
- Complements session memory (RLabs, AgentDB) by providing long-term context

**Oh My OpenCode integration:**
- Drop `amalfa serve` into `opencode.json` MCP config
- Agents query past decisions: "How did we handle authentication?"
- Scales the AGENTS.md pattern: auto-generate per-folder context

**Try it:**
```bash
bun install -g amalfa
amalfa init
amalfa serve
```

**Links:**
- [GitHub](https://github.com/pjsvis/amalfa)
- [NPM](https://www.npmjs.com/package/amalfa)
- [Docs](https://github.com/pjsvis/amalfa#readme)

---

## Edinburgh Protocol Opinion: Should You Submit?

**Impartial Spectator Analysis:**

### PRO
- Maintainer explicitly requested "actual great experiences" and "good implementations"
- You have production validation (v1.3.0 shipped, pattern works)
- Fills gap: most comments are session-memory focused, yours is cross-project
- MCP-native (speaks Oh My OpenCode's language)

### CON
- Thread has 12 existing recommendations (noise risk)
- Maintainer is "experimenting and comparing" (not ready to commit)
- Could be perceived as self-promotion (you're the Amalfa author)

### Systems Analysis
- **Incentive alignment:** Maintainer wants non-redundant solutions → Amalfa is complementary
- **Risk:** Buried in thread noise OR seen as valuable signal
- **Upside:** If adopted, Amalfa becomes Oh My OpenCode's default long-term memory

### Hume's Empirical Test
- **Evidence:** v1.3.0 shipped, Edinburgh Protocol doc emerged from Amalfa workflow
- **Counter-evidence:** No proof Oh My OpenCode users want cross-project memory vs. session memory

---

## Pragmatic Recommendation

**YES, submit—but frame as:**

1. **"Complement, not replacement"** for session memory systems
2. **"Here's how we use it in production"** (debrief-playbook pattern)
3. **"MCP-native, fits Oh My OpenCode's architecture"**
4. **"Try it, 3 commands"** (low friction)

**DON'T:**
- Claim it's "better" than RLabs/AgentDB/Supermemory
- Oversell features
- Write essay (keep it 1-2 paragraphs + bullet list)

---

## Final Edinburgh Verdict

The *map* (Amalfa's design) aligns with the *territory* (Oh My OpenCode's distributed AGENTS.md pattern). The question isn't "Is this useful?" but **"Will the maintainer recognize it's useful?"**

**Bet:** Submit concisely. Let utility speak. If ignored, Amalfa remains valuable for your workflow. If adopted, you've reduced entropy for the Oh My OpenCode community.

---

## Key Distinctions: Amalfa vs. Session Memory Systems

| Dimension | Session Memory (RLabs, AgentDB) | Amalfa |
|-----------|--------------------------------|--------|
| **Time Horizon** | Minutes to hours | Weeks to months |
| **Scope** | Current conversation | Cross-project knowledge |
| **Storage** | Session summaries + embeddings | Markdown docs + metadata |
| **Retrieval** | "What did we just discuss?" | "What patterns have worked?" |
| **Integration** | Hook into message flow | MCP server + CLI tools |
| **Philosophy** | Continuity within session | Institutional memory across sessions |

**They compose, not compete.**

---

## Production Validation: How Amalfa Emerged

**Real-world case study from v1.3.0 release cycle:**

1. **Problem:** TypeScript errors blocking release (debug scripts, test type mismatches)
2. **Solution:** Edinburgh Protocol-guided debugging (systems thinking, pragmatic tool selection)
3. **Outcome:** 
   - Debug scripts quarantined to `/lab` folder
   - Test errors fixed (Hollow Node architecture alignment)
   - Clean build, passing tests, v1.3.0 tagged and shipped
4. **Knowledge capture:**
   - Debrief: `debriefs/2026-01-13-disposable-database-philosophy.md`
   - Documentation: `docs/edinburgh-protocol-reaction.md`
   - Playbook patterns: Codified in briefs/playbooks directories

**Key insight:** The Edinburgh Protocol discussion document emerged because **Oh My OpenCode TUI scroll was "pretty rubbish"** on MacBook Air. We needed persistent docs for philosophical exchanges. This need drove the documentation pattern that Amalfa now indexes.

**Meta-irony:** The workaround (persistent docs) became the feature (knowledge graph).

---

## Appendix: Oh My OpenCode Context

**From Issue #74 Thread:**

- **Razkaroth's workflow:** "I made opencode create an agents file for each folder, find references and use keywords that help when other agents run grep. Then, added the instruction to cascade update agents.md files on paths with edits which are found using git when finishing a task and before compaction."

- **YeonGyu Kim's response:** "Great take. I personally have this workflow but currently experimenting and comparing with other memory systems."

**This is EXACTLY what Amalfa enables:**
- Markdown-first (agents.md compatibility)
- Git-auditable (cascade updates = Ember auto-augmentation)
- Semantic search (grep on steroids with vector embeddings)
- Distributed context (per-folder indexing)

**The missing piece:** Amalfa automates what Razkaroth does manually, with semantic search layered on top.

---

## Document Status

✅ **Ready for reference**  
📋 **Recommendation drafted for Issue #74 comment**  
🎯 **Production-validated** (v1.3.0 release cycle)

**Next steps:**
1. Review recommendation text
2. Optionally submit to Issue #74
3. Monitor for maintainer response
4. Document outcome in debrief (accepted/declined/no-response)
