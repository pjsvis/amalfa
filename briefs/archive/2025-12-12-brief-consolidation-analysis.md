# Brief Consolidation Analysis - 2025-12-12

**Trigger:** Found multiple undated briefs with overlapping proposals  
**Action:** Date-prefixed all briefs, now analyzing for consolidation

---

## Dated Briefs Summary

### **All Root Briefs** (Now dated!)
```
2025-12-11-ingestion-observability.md
2025-12-12-appraisal-mgrep-astgrep.md
2025-12-12-codebase-regularization.md
2025-12-12-css-strategy-audit.md
2025-12-12-docs-consolidation.md
2025-12-12-experience-graph-linking.md
2025-12-12-polyvis-semantic-linking.md
2025-12-12-semantic-linking-upgrade.md
2025-12-12-super-grep-echoes.md
2025-12-12-ui-fixes-analysis.md
2025-12-12-undocumented-confusion.md
```

---

## Identified Clusters

### **Cluster 1: Semantic Linking** (NEEDS CONSOLIDATION)

**Files:**
1. `2025-12-12-polyvis-semantic-linking.md` - "SieveNet" architecture
2. `2025-12-12-semantic-linking-upgrade.md` - "Tiered Linking" with mgrep

**Problem:** Two different proposals for same goal!

**Analysis:**

| Aspect | polyvis-semantic-linking | semantic-linking-upgrade |
|--------|--------------------------|--------------------------|
| **Architecture** | "SieveNet" (Sieve + Gardener) | "Tiered Linking" (3 tiers) |
| **Phase 1** | Aho-Corasick + ANN | Explicit tags + keywords |
| **Phase 2** | Pruning + Clustering | Semantic via mgrep |
| **Tools** | Aho-Corasick, graphology | mgrep, ripgrep |
| **Status** | "Approved for Implementation" | Draft/proposal |

**Recommendation:** **CONSOLIDATE**
- Keep: SieveNet architecture (more comprehensive)
- Merge: Tiered linking concepts  
- Archive: semantic-linking-upgrade (subsumed)

---

### **Cluster 2: Graph/Experience** (OK)

**Files:**
1. `2025-12-12-experience-graph-linking.md`

**Status:** Single file, no conflicts ✅

---

### **Cluster 3: Code Quality** (OK)

**Files:**
1. `2025-12-11-ingestion-observability.md`
2. `2025-12-12-codebase-regularization.md`

**Status:** Different concerns, no consolidation needed ✅

---

### **Cluster 4: Today's Work** (OK - Executed)

**Files:**
1. `2025-12-12-css-strategy-audit.md` ✅ Done
2. `2025-12-12-docs-consolidation.md` ✅ Done
3. `2025-12-12-super-grep-echoes.md` ✅ Done
4. `2025-12-12-ui-fixes-analysis.md` ✅ Done
5. `2025-12-12-undocumented-confusion.md` ✅ Done

**Status:** All executed → Archive after debrief complete ✅

---

## Consolidation Actions

### **Priority 1: Semantic Linking**

**Action:** Merge proposals into single brief

**New file:** `2025-12-12-semantic-linking-consolidated.md`

**Contents:**
```markdown
# SieveNet Architecture (Consolidated)

## Phase 1: Sieve (from polyvis-semantic-linking)
- Aho-Corasick for hard links
- ANN for initial soft links

## Phase 2: Gardener (from polyvis-semantic-linking)
- Pruning weak edges
- Clustering (Louvain)

## Integration with Tiered System (from semantic-linking-upgrade)
- Tier 1: Explicit tags (confidence: 1.0)
- Tier 2: Keyword matches (confidence: 0.5-0.8)
- Tier 3: Semantic via mgrep (confidence: 0.3-0.6)

## Tool Stack
- Aho-Corasick (hard links)
- ripgrep (keyword scanning)
- mgrep (semantic matching)
- graphology (clustering)
```

**Archive:**
- Move `2025-12-12-semantic-linking-upgrade.md` to `briefs/archive/`
- Note in `2025-12-12-polyvis-semantic-linking.md` that it's consolidated

---

### **Priority 2: Executed Briefs**

**Action:** Archive completed work

**Move to briefs/archive/:**
```
2025-12-12-css-strategy-audit.md (paired with debrief)
2025-12-12-docs-consolidation.md (paired with debrief)
2025-12-12-ui-fixes-analysis.md (paired with debrief)
```

**Keep active:**
```
2025-12-12-super-grep-echoes.md (ongoing - registry phase)
2025-12-12-undocumented-confusion.md (P1-P3 work remaining)
```

---

## Naming Convention Applied

### **Before:**
```
brief-codebase-regularization.md
polyvis-semantic-linking.md
appraisal-mgrep-astgrep.md
```

### **After:**
```
2025-12-12-codebase-regularization.md
2025-12-12-polyvis-semantic-linking.md
2025-12-12-appraisal-mgrep-astgrep.md
```

**Impact:** Chronological sorting, clear timeline

---

## Why This Matters

### **Before Dating:**
- ❌ No way to track evolution
- ❌ Multiple proposals → confusion
- ❌ "Which one is current?"
- ❌ Can't prune obsolete ideas

### **After Dating:**
- ✅ Chronological progression clear
- ✅ Latest thinking visible
- ✅ Can consolidate/deprecate
- ✅ Clean active brief list

---

## Recommendations

### **Immediate:**
1. [ ] Consolidate semantic linking briefs
2. [ ] Archive executed briefs (paired with debriefs)
3. [ ] Update brief-README with archive policy

### **Policy:**
- ✅ All briefs must have dates (even aspirational)
- ✅ One brief per topic (consolidate duplicates)
- ✅ Archive when: executed OR superseded
- ✅ Keep active: in-progress OR next-up

---

## Files to Consolidate

### **Semantic Linking** (Priority)
```
Source 1: 2025-12-12-polyvis-semantic-linking.md (SieveNet)
Source 2: 2025-12-12-semantic-linking-upgrade.md (Tiered)
Output: 2025-12-12-semantic-linking-consolidated.md
```

### **Archive Candidates** (Executed)
```
2025-12-12-css-strategy-audit.md → archive/
2025-12-12-docs-consolidation.md → archive/
2025-12-12-ui-fixes-analysis.md → archive/
```

---

## Next Steps

**User decision needed:**
1. Consolidate semantic linking? (Yes recommended)
2. Archive executed briefs? (Yes recommended)
3. Update brief naming policy in README? (Yes recommended)

**Then:** Clean active brief list reflects current/next work only!

---

**Status:** Analysis complete, awaiting user decision on consolidation
