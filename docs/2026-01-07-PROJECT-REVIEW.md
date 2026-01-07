# AMALFA Project Review
**Date:** 2026-01-07  
**Version:** 1.0.16 → 1.0.17 (pending)

---

## Executive Summary

AMALFA v1.0 is **published and functional** on npm. The core MCP server works, vector search is operational, and the basic infrastructure is solid. Recent work focused on **operations and polish** rather than new features.

**Current State:** Production-ready for early adopters, with documented limitations.

**Next Phase:** Auto-augmentation (Phase 1) - the differentiating feature that makes AMALFA valuable beyond a basic search tool.

---

## Where We Are

### ✅ What's Working (v1.0.16)

**Core Infrastructure:**
- ✅ MCP server with stdio transport
- ✅ Vector search (FastEmbed, 384-dim, FAFCAS protocol)
- ✅ SQLite database with hollow node pattern
- ✅ Markdown ingestion pipeline
- ✅ Pre-flight validation (syntax, frontmatter)
- ✅ CLI with 10+ commands (init, serve, stats, doctor, servers, daemon, vector)
- ✅ Service management (vector daemon, file watcher, MCP server)
- ✅ Full documentation (README, MCP setup, quick start)
- ✅ Published to npm with 46 files, 73.9 kB

**Recent Improvements (Jan 7, 2026):**
- ✅ Fixed MCP search bug (hollow node null safety)
- ✅ Config unification documented
- ✅ Directory reorganization (.amalfa/logs/, .amalfa/runtime/)
- ✅ Cross-platform notifications (macOS, Linux)
- ✅ ZombieDefense false positive fixes
- ✅ ServiceLifecycle PID file bug fixed
- ✅ Development workflow playbook updated

**Three Major Debriefs in 24 Hours:**
1. MCP server fix and documentation
2. Config unification (3 systems documented)
3. .amalfa directory reorganization

This indicates **rapid iteration** with proper reflection and documentation.

### ⚠️ What's NOT Working Yet

**Phase 1: Auto-Augmentation (Planned, Not Implemented):**
- ❌ Entity extraction from markdown
- ❌ Auto-linking (wiki-style [[links]])
- ❌ Tag extraction and indexing
- ❌ Git-based auditing for augmentations
- ❌ Automated file watcher updates (daemon exists but doesn't augment yet)

**Phase 2: Latent Space Organization (Designed, Not Built):**
- ❌ Document clustering (HDBSCAN)
- ❌ Cluster label generation
- ❌ Confidence-based tagging
- ❌ Topic modeling (BERTopic)
- ❌ Self-organizing taxonomy

**Phase 3: Graph Intelligence (Designed, Not Built):**
- ❌ K-nearest neighbor recommendations
- ❌ Suggested reading lists
- ❌ Temporal sequence tracking
- ❌ Backlink maintenance
- ❌ Graph traversal tools (edges exist in schema but unused)

**Phase 4: Learning from Feedback (Future Vision):**
- ❌ Track human edits to augmentations
- ❌ Adjust confidence thresholds
- ❌ Improve extraction heuristics
- ❌ Weekly knowledge digest
- ❌ Multi-agent coordination

### 🤔 Current Limitations

**Database:**
- 95 nodes, **0 edges** (graph features unused)
- Embeddings work, but no clustering/tagging
- No auto-augmentation happening

**Search:**
- Vector search returns `[Hollow Node: /path/to/file.md]` instead of content previews
- This is intentional (hollow node pattern) but reduces search usefulness
- Could read first 200 chars from filesystem during search (trade-off: I/O overhead)

**User Experience:**
- Setup requires multiple manual steps
- No auto-discovery of markdown sources
- File watcher daemon exists but doesn't auto-augment yet (just re-ingests)

**Documentation vs Reality:**
- README claims "Auto-augmentation" and "Latent space tagging" as features
- These are actually **vision/roadmap**, not current functionality
- Could be misleading to new users

---

## Where We Want To Go

### Immediate Priorities (v1.0.17+)

**1. Publish Current Work**
- Bump to v1.0.17
- Document .amalfa directory reorganization as breaking change
- Update CHANGELOG.md

**2. Clarify Roadmap vs Reality**
- Update README.md to be explicit about "Vision" vs "Current Features"
- Move auto-augmentation/latent-space descriptions to "Roadmap" section
- Add "What Works Today" section at the top

**3. Basic Edge Creation (Quick Win)**
- File watcher could detect markdown links `[text](./other-file.md)` during ingestion
- Create edges in database for these explicit links
- This makes "0 edges" → "meaningful graph" without ML
- Enables graph traversal tools immediately

### Phase 1: Auto-Augmentation (Next Major Work)

**Goal:** Make AMALFA differentiated from basic vector search tools.

**Priority 1: Tag Extraction (Low-hanging Fruit)**
```typescript
// During ingestion:
// 1. Extract frontmatter tags (already parsed)
// 2. Extract heading-based tags (## Authentication → tag: "authentication")
// 3. Extract entity tags (code blocks, URLs, file paths)
// 4. Store in tags table with source="auto" and confidence score
```

**Priority 2: Auto-Linking (Medium Complexity)**
```typescript
// During ingestion:
// 1. Find all node titles in content (case-insensitive)
// 2. Create edges with type="implicit-reference"
// 3. Git commit the augmented file with [[links]]
// 4. User can review/revert via git
```

**Priority 3: Git-Based Auditing (Infrastructure)**
```typescript
// For any auto-augmentation:
// 1. Stage changes
// 2. Commit with message: "amalfa: auto-augmented tags for {file}"
// 3. Include metadata: confidence scores, extraction method
// 4. User can `git log` to see all augmentations
// 5. User can `git revert` specific augmentations
```

**Why Phase 1 Matters:**
- Without auto-augmentation, AMALFA is just a vector search tool
- The value proposition is "agents maintain memory automatically"
- Phase 1 delivers on this promise
- It's the **minimum viable differentiation**

### Phase 2: Latent Space Organization (Future)

**Goal:** Self-organizing knowledge base.

**Approach:**
1. Use existing embeddings (already have 384-dim vectors for 95 nodes)
2. Cluster with HDBSCAN (density-based, no k parameter needed)
3. Generate labels using LLM (summarize cluster contents)
4. Add tags with confidence scores (0.0-1.0)
5. Track tag stability over time (do clusters change as knowledge grows?)

**Example Output:**
```
docs/AUTH.md
  - tags: ["latent:auth-patterns", "latent:security", "latent:jwt"]
  - confidence: [0.87, 0.92, 0.78]
  - cluster: 3 (size: 8 docs)
```

**Challenges:**
- Need LLM for label generation (could use local Ollama)
- Clustering requires tuning (min_cluster_size, min_samples)
- Need UI to review/edit cluster labels

### Phase 3: Graph Intelligence (Future)

**Goal:** Navigate knowledge via relationships.

**K-Nearest Neighbors:**
```typescript
// For any node, find semantically similar nodes
const similar = await db.knn(node_id, k=5);
// Returns: [{node_id, title, similarity}, ...]
```

**Suggested Reading:**
```typescript
// When agent starts new task, suggest relevant prior work
const context = await db.suggestReading(brief_content, limit=3);
// Returns: debriefs, playbooks that are semantically close
```

**Temporal Sequences:**
```typescript
// Track evolution of a topic over time
const timeline = await db.temporalPath("authentication");
// Returns: briefs → debriefs → playbooks in chronological order
```

**Backlinks:**
```typescript
// Automatic "What links here?" for any node
const backlinks = await db.backlinks(node_id);
// Enables wiki-style browsing
```

### Phase 4: Learning from Feedback (Future Vision)

**Goal:** Improve augmentation quality over time.

**Approach:**
1. Track when users edit auto-generated tags
2. Track when users delete auto-generated links
3. Track when users add manual tags
4. Use this feedback to adjust confidence thresholds
5. Retrain extraction heuristics

**Example:**
```
Auto-generated tag "authentication" (confidence: 0.65)
→ User keeps it
→ Increase confidence threshold from 0.6 to 0.65

Auto-generated link [[JWT]] → User deletes it
→ Decrease confidence for acronym links
```

---

## Decision Points

### 1. README Clarity

**Issue:** README claims auto-augmentation works today, but it's actually roadmap.

**Options:**
- **A)** Update README to clearly separate "What Works" vs "Vision"
- **B)** Rapidly implement basic auto-augmentation so claims are true
- **C)** Leave as-is, consider it aspirational

**Recommendation:** **A** - Clarity prevents user frustration. Then **B** for v1.1.

### 2. Edge Creation Strategy

**Issue:** 0 edges in database, graph features unused.

**Options:**
- **A)** Parse markdown links during ingestion, create edges immediately (simple)
- **B)** Wait for ML-based link detection (complex, future)
- **C)** Hybrid: explicit links now, implicit links later

**Recommendation:** **C** - Quick win (explicit links) enables graph features today.

### 3. Search Result Preview

**Issue:** Hollow nodes mean search shows `[Hollow Node: path]` instead of content.

**Options:**
- **A)** Read first 200 chars from filesystem during search (adds I/O)
- **B)** Keep current behavior, optimize for speed
- **C)** Cache previews in database (adds storage, defeats hollow node pattern)

**Recommendation:** **A** - User experience > marginal performance. 200 chars is ~3 lines.

### 4. Auto-Augmentation Scope (v1.1)

**Issue:** Phase 1 has 5 items, which is too much for one release.

**Options:**
- **A)** Ship all 5 items in v1.1 (entity extraction, linking, tags, git audit, watcher)
- **B)** Ship 2-3 items in v1.1, rest in v1.2
- **C)** Ship tag extraction only (MVP)

**Recommendation:** **B** - Tag extraction + explicit link edges in v1.1. Git audit in v1.2.

---

## Metrics & Success Criteria

### Current Metrics (v1.0.16)

- **Nodes:** 95
- **Edges:** 0 ⚠️
- **Embeddings:** 95 (384-dim)
- **Database Size:** 0.79 MB
- **Package Size:** 73.9 kB
- **Downloads:** Unknown (just published)
- **Issues:** 0 (repo is private)

### Target Metrics (v1.1)

- **Nodes:** 100+ (more docs)
- **Edges:** 50+ (explicit markdown links)
- **Auto-tags per node:** 3-5 average
- **Tag confidence:** >0.7 on average
- **Git commits:** Every augmentation audited
- **File watcher:** Re-ingests on change (current) + augments (new)

### Success Criteria (v1.1)

1. ✅ User runs `amalfa init` → tags are auto-extracted
2. ✅ User views database → edges exist for markdown links
3. ✅ User runs `git log` → sees augmentation commits
4. ✅ User modifies doc → file watcher re-ingests + re-augments
5. ✅ README accurately describes features vs vision

---

## Resource Requirements

### v1.0.17 (Current Work)
- **Time:** 1 hour (bump version, publish, document)
- **Dependencies:** None (just npm publish)

### v1.1 (Tag Extraction + Link Edges)
- **Time:** 4-8 hours
  - Tag extraction: 2-3 hours
  - Link edge creation: 1-2 hours
  - Testing: 1-2 hours
  - Documentation: 1 hour
- **Dependencies:** None (use existing parsing logic)

### v1.2 (Git Auditing + Auto-Linking)
- **Time:** 8-12 hours
  - Git integration: 3-4 hours
  - Auto-linking logic: 3-4 hours
  - Conflict resolution: 2-3 hours
  - Testing: 2-3 hours
- **Dependencies:** Need to decide on git strategy (simple-git? exec?)

### Phase 2 (Latent Space)
- **Time:** 16-24 hours
  - HDBSCAN integration: 4-6 hours
  - LLM label generation: 4-6 hours
  - Confidence scoring: 2-3 hours
  - UI/review tools: 4-6 hours
  - Testing: 2-3 hours
- **Dependencies:**
  - Python bridge for HDBSCAN (or pure JS alternative)
  - LLM access (Ollama locally or API)

---

## Risks & Mitigations

### Risk 1: Feature Creep

**Risk:** Phase 1-4 roadmap is ambitious. Could get stuck building forever.

**Mitigation:**
- Ship incremental releases (v1.1, v1.2, v1.3)
- Each release delivers one user-visible improvement
- Don't wait for "perfect" auto-augmentation

### Risk 2: Git Audit Complexity

**Risk:** Auto-committing could conflict with user's git workflow.

**Mitigation:**
- Make it opt-in (`amalfa.config.json`: `"gitAudit": true`)
- Document git workflow clearly
- Provide `amalfa augment --dry-run` to preview changes
- Use separate branch for augmentations (optional)

### Risk 3: Latent Space Quality

**Risk:** LLM-generated cluster labels could be garbage.

**Mitigation:**
- Start with simple heuristics (most common words in cluster)
- Add LLM as optional enhancement
- Always show confidence scores
- Allow user to override labels

### Risk 4: User Expectations

**Risk:** Users expect auto-augmentation now (README suggests it works).

**Mitigation:**
- Update README immediately (v1.0.17)
- Be explicit: "Vision (not yet implemented)"
- Show clear roadmap with ETA

---

## Recommendations

### Immediate Actions (This Week)

1. **Publish v1.0.17**
   - Commit .amalfa directory reorganization work
   - Bump version in package.json
   - Update CHANGELOG.md
   - `npm publish`
   - Tag git release

2. **Update README.md**
   - Add "Current Features" section at top (what works today)
   - Move auto-augmentation to "Vision & Roadmap" section
   - Be explicit about Phase 1-4 status
   - Add ETA for v1.1 (2-3 weeks?)

3. **Create v1.1 Plan**
   - Write brief for tag extraction + link edges
   - Estimate: 4-8 hours
   - Set target: mid-January 2026

### Short-term (Next 2-4 Weeks)

1. **Implement Phase 1 (Basic Auto-Augmentation)**
   - v1.1: Tag extraction + explicit link edges
   - v1.2: Git auditing + auto-linking

2. **Gather User Feedback**
   - Share with early adopters
   - Document pain points
   - Prioritize based on real usage

3. **Write Technical Docs**
   - Auto-augmentation algorithm details
   - Confidence scoring methodology
   - Git workflow guide

### Medium-term (Next 1-2 Months)

1. **Phase 2: Latent Space Organization**
   - Start with simple clustering (no LLM)
   - Add LLM labels as enhancement
   - Iterate based on quality

2. **Improve Search UX**
   - Add content previews to search results
   - Show confidence scores for tags
   - Enable filtering by tag

3. **Multi-Project Support**
   - Allow AMALFA to index multiple repos
   - Cross-repo search and linking
   - Shared playbook library

---

## Conclusion

**AMALFA v1.0 is a strong foundation.** The core MCP server, vector search, and service infrastructure work reliably. Recent work shows good operational discipline (3 major improvements + debriefs in 24 hours).

**The gap is features vs vision.** README promises auto-augmentation, latent space organization, and graph intelligence. Reality is: vector search works, but the "smart" features don't exist yet.

**The path forward is clear:**
1. Publish v1.0.17 (polish)
2. Update README (clarity)
3. Build Phase 1 (differentiation)
4. Iterate based on feedback

**Priority: Ship Phase 1 in v1.1.** Tag extraction + link edges are the minimum viable differentiation. Without them, AMALFA is "just another vector search tool."

**Timeline:**
- v1.0.17: This week (operations)
- v1.1: Mid-January (tag extraction + link edges)
- v1.2: Late January (git auditing + auto-linking)
- v2.0: February-March (latent space organization)

**The vision is achievable.** Each phase is scoped to 1-2 weeks of focused work. The architecture supports it. We just need to build it incrementally.

---

**Next Session:** Decide between publishing v1.0.17 or starting Phase 1 work.
