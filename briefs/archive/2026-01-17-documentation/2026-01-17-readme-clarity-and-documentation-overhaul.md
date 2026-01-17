---
date: 2026-01-17
tags: [documentation, readme, clarity, user-experience, benefits]
agent: claude
environment: local
---

# Brief: README Clarity and Documentation Overhaul

## Problem Statement

The current README suffers from several issues that obscure Amalfa's actual value proposition:

1. **Benefits Buried:** The README focuses heavily on technical implementation details rather than the user-facing benefits of the MCP server
2. **Confused Messaging:** Mixed messages about what Amalfa actually provides to AI agents
3. **Outdated Patterns:** References to legacy patterns that may no longer be current
4. **Database Management Unclear:** "Nuke-and-pave" philosophy is mentioned but not clearly articulated as a feature vs. a limitation
5. **Tech-First vs. Benefit-First:** Architecture and implementation dominate over "why should I use this?"

## Lessons Learned (Context)

From recent work, we've discovered:
- **Uncorrected legacy patterns:** Old architectural decisions referenced without context
- **Out-of-date documentation:** README doesn't reflect current state of the project
- **Jumbled messaging:** Benefits, architecture, and technical details mixed without clear hierarchy

## Objectives

Create a README that:

1. **Leads with benefits** - Answer "What does Amalfa give my AI agent?" in the first 30 seconds
2. **Clarifies database philosophy** - Position nuke-and-pave as a feature (simplicity, no migrations) not a limitation
3. **Removes outdated patterns** - Audit and update/remove legacy architectural references
4. **Separates concerns** - Benefits → Quick Start → Architecture (in that order)
5. **Emphasizes MCP value** - Make it crystal clear what tools/capabilities agents get

## Current State Analysis

### What's Good
- Disposable database concept is explained
- Installation instructions are clear (Bun-first)
- Technical stack is documented
- Playbook references are present

### What's Confusing
- **Line 19-26:** Lists features but doesn't explain *why* these matter to users
- **Lines 33-42:** "The Problem" section is good but could be stronger
- **Lines 129-135:** Sub-agents section is vague ("orchestrates specialized sub-agents")
- **Lines 172-180:** "Hollow Nodes" and "FAFCAS" are implementation details, not benefits
- **Maintenance section (83-86):** References `amalfa doctor` and `amalfa init` but doesn't explain the philosophy clearly

### What's Missing
- Clear MCP tool listing (what can agents actually *do*?)
- Concrete examples of queries agents can run
- Before/after scenarios (what changes when agents use Amalfa?)
- Performance benefits (4.6x faster mentioned in debriefs-playbook but not README)

## Proposed Changes

### 1. Restructure Opening (Lines 1-31)

**New Flow:**
```
# AMALFA - A Memory Layer For Agents

## What It Does (The Benefit)
Gives AI agents persistent memory and semantic search across sessions.

**Without Amalfa:**
- Agent forgets context between conversations
- Repeats same research every session
- No institutional memory

**With Amalfa:**
- Agents query past work: "What did we learn about auth?"
- Semantic search across all documentation
- Persistent memory via structured reflection (briefs/debriefs/playbooks)

## How It Works (The Simple Version)
1. You write markdown documentation (source of truth)
2. Amalfa indexes it into a searchable knowledge graph
3. AI agents access it via Model Context Protocol (MCP)
4. Database is disposable - regenerate anytime from markdown

[Technical details moved to later section]
```

### 2. Add MCP Tools Section (New)

After "What It Does", add concrete examples:

```markdown
## What Agents Can Do

Via MCP, agents can:
- **search_documents(query)** - Semantic search across all markdown
- **explore_links(nodeId)** - Traverse document relationships
- **get_node_content(nodeId)** - Retrieve specific documents
- **query_by_tags(tags)** - Filter by metadata
- **graph_neighbors(nodeId)** - Find related documents

**Example Session:**
Agent: "What did we learn about database migrations?"
→ search_documents("database migrations lessons")
→ Returns ranked debriefs with learnings
→ Agent applies past patterns to new work
```

### 3. Clarify Database Philosophy (Lines 45-82)

Reframe "disposable database" as a strength:

```markdown
## Core Philosophy: Markdown as Source of Truth

**The Inversion:**
Traditional systems: Database is truth, files are exports
Amalfa: Files are truth, database is cache

**Why This Matters:**
✅ **Zero migration hell** - Upgrade by re-ingesting
✅ **Model flexibility** - Change embedding models without data loss
✅ **Corruption immunity** - Delete .amalfa/ and rebuild in seconds
✅ **Git-native** - Version control your knowledge, not your indexes
✅ **Deterministic** - Same markdown → same database state

**Maintenance:**
- `amalfa init` - Regenerate from markdown (safe, fast)
- `amalfa doctor` - Health check (but rarely needed)
- No migrations, no backups, no complex maintenance
```

### 4. Simplify Architecture Section (Lines 140-180)

Move technical details to separate doc, keep only:
- Technology stack (Bun, SQLite, FastEmbed, MCP)
- High-level data flow (markdown → ingestion → search → MCP)
- Link to `docs/ARCHITECTURE.md` for deep dive

Remove from main README:
- FAFCAS protocol details → architecture doc
- Hollow nodes implementation → architecture doc
- Micro-daemon mesh → services doc

### 5. Strengthen "The Problem" Section (Lines 33-42)

Add concrete examples:

```markdown
## The Problem

**Scenario:** You're debugging auth flow for the 3rd time.

**Without Amalfa:**
- Agent searches codebase from scratch
- Rediscovers same issues
- Repeats same solutions
- Context resets every conversation

**With Amalfa:**
Agent queries: "past auth debugging sessions"
→ Finds debrief from 2 weeks ago
→ "We learned the token refresh fails in Safari due to cookie scope"
→ Applies fix immediately

**Result:** 10-minute fix instead of 2-hour investigation.
```

### 6. Clarify Services/Daemons (Lines 129-137)

Either remove or simplify:
- File watcher: "Automatically re-indexes changed markdown"
- Vector daemon: "Optional HTTP API for embeddings"
- Reranker: "Improves search precision"
- Sonar: "Reasoning agent (experimental)"

Don't need architecture details in README - move to docs/SERVICES.md

### 7. Add Performance Claims (New Section)

Based on playbooks:
```markdown
## Performance

- **4.6x faster verification** vs traditional grep
- **95% search precision** vs 70% with pattern matching
- **Sub-second queries** on 1000+ document corpus
- **Local-first** - no API calls, no cloud dependencies
```

## Implementation Checklist

1. **Audit current README** - Identify all legacy pattern references
2. **Create new structure** - Benefits → Quick Start → Usage → Architecture (brief) → Links
3. **Write benefits-first intro** - Answer "why Amalfa?" in first 100 words
4. **Add MCP tools section** - Concrete examples of agent capabilities
5. **Reframe database philosophy** - Disposable as feature, not bug
6. **Extract technical details** - Move FAFCAS, hollow nodes to docs/ARCHITECTURE.md
7. **Add performance section** - Real metrics from usage
8. **Simplify services section** - High-level only, link to docs/SERVICES.md
9. **Add concrete examples** - Before/after scenarios
10. **Update related docs** - Ensure WARP.md, USER-MANUAL.md align

## Supporting Documents to Create/Update

1. **docs/ARCHITECTURE.md** - Deep dive on FAFCAS, hollow nodes, internals
2. **docs/SERVICES.md** - Daemon mesh, service lifecycle, management
3. **docs/MCP-TOOLS.md** - Complete MCP tool reference with examples
4. **docs/BENEFITS.md** - Extended benefits and use cases
5. **WARP.md** - Update to match new README structure

## Success Criteria

- [ ] New user understands "what Amalfa does" in 30 seconds
- [ ] Benefits mentioned before technical implementation
- [ ] MCP tools clearly listed with examples
- [ ] Database philosophy positioned as strength
- [ ] No outdated/legacy pattern references
- [ ] Technical details moved to appropriate docs
- [ ] Architecture section is high-level overview only
- [ ] Performance claims included with metrics
- [ ] Quick start is unchanged (already good)
- [ ] All references verified as current

## Anti-Patterns to Avoid

- ❌ Leading with implementation details ("hollow nodes", "FAFCAS")
- ❌ Assuming reader knows what MCP provides
- ❌ Listing features without explaining benefits
- ❌ Mixing benefits and architecture in same section
- ❌ Keeping outdated pattern references "just in case"
- ❌ Writing for developers instead of users

## References

- Current README: `/Users/petersmith/Dev/GitHub/amalfa/README.md`
- Debriefs playbook: `playbooks/debriefs-playbook.md`
- WARP guidance: `WARP.md`
- Vision doc: `docs/VISION-AGENT-LEARNING.md`
