---
title: Cross-Domain Edge Pipeline & SSOT Violations
type: brief
status: critical
date: 2026-02-01
tags: [pipeline, SSOT, configuration, negligence]
---

# Brief: Cross-Domain Edge Pipeline & SSOT Violations

## Problem Statement

While implementing cross-domain edge generation between knowledge and lexicon nodes, **multiple architectural violations occurred** that demonstrate systematic negligence in respecting established project principles.

## Critical Issues Identified

### 1. SSOT Principle Violations

**Files violating amalfa.settings.json SSOT:**
- `src/pipeline/cross-domain/01-generate-edges.ts`
- `src/pipeline/cross-domain/02-ingest.ts`

**Violations:**
```typescript
// ❌ WRONG: Hard-coded paths
const DB_PATH = ".amalfa/resonance.db";
const OUTPUT_PATH = ".amalfa/cross-domain-edges.jsonl";

// ✅ CORRECT: SSOT-compliant
const dbPath = await getDbPath();
const outputPath = join(dbPath, "..", "cross-domain-edges.jsonl");
```

### 2. FAFCAS Protocol Ignorance

**Agent negligence:**
- Implemented full cosine similarity despite extensive FAFCAS documentation
- Failed to check if vectors were unit-normalized as FAFCAS requires
- **Root cause:** Database vectors have norm ~5600, not 1.0 (not FAFCAS-compliant)
- **Wasted computation:** Used sqrt/division instead of dot product optimization

### 3. Memory Management Anti-Patterns

**Ocean-boiling approach:**
- Loaded 1,659 nodes × 1536 dimensions = **10MB** into memory simultaneously
- Used O(N×M) nested loops instead of database-optimized vector search
- Ignored existing `vec_dot()` function and VectorEngine infrastructure

## Lessons Learned

### Agent Negligence Patterns

1. **Failure to RTFM**: Extensive playbook documentation exists but was ignored
2. **Assumptions over Investigation**: Assumed FAFCAS meant normalized when vectors clearly weren't
3. **NIH Syndrome**: Implemented custom similarity instead of using existing infrastructure
4. **SSOT Disregard**: Hard-coded configuration instead of using established utilities

### Documentation Gaps Exposed

While the agent was negligent, some gaps in documentation enabled the errors:

1. **FAFCAS Playbook Missing**: No section on "What to do when vectors aren't normalized"
2. **No Streaming Patterns Guide**: When to load vs stream not documented
3. **No SSOT Enforcement**: No linting rules preventing hard-coded paths

## Immediate Actions Required

### 1. Fix SSOT Violations ✅ COMPLETE
- Updated both pipeline files to use `getDbPath()`
- Removed all hard-coded configuration paths

### 2. Create Documentation Updates

**A. Update FAFCAS Playbook**
Add section: "Handling Non-Compliant Vectors"
```markdown
### When Vectors Aren't FAFCAS-Compliant
If vectors have norm ≠ 1.0:
1. Use full cosine similarity (not dot product)
2. Consider re-ingesting with proper normalization
3. Never assume unit length without verification
```

**B. Create Streaming Patterns Playbook**
```markdown
# Memory Management Decision Tree
- < 1000 nodes: Load into memory
- > 1000 nodes: Use database vector search
- > 10,000 nodes: Batch processing with streaming
```

### 3. Architectural Review Required

**Questions for investigation:**
1. **Why aren't our vectors FAFCAS-normalized?** Is this intentional or a bug?
2. **Should we normalize all vectors in database?** Migration strategy needed?
3. **Vector search optimization**: Use existing `VectorEngine.findSimilar()` instead of custom code

## Prevention Measures

1. **Mandatory RTFM**: Always search existing documentation before implementing
2. **SSOT Linting**: Add pre-commit hooks preventing hard-coded paths
3. **Architecture First**: Check existing infrastructure before building new
4. **Test Assumptions**: Verify vector properties (norms, dimensions) before assuming protocols

## Status

- ✅ SSOT violations fixed
- ✅ Documentation gaps identified
- ⏳ Playbook updates pending
- ⏳ Cross-domain pipeline needs FAFCAS-compliant rewrite

This incident demonstrates the critical importance of respecting established architectural principles and thoroughly investigating existing infrastructure before implementation.