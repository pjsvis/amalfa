# Debrief: Ingestion Gap Root Cause Analysis

**Date:** 2026-01-28  
**Session ID:** `current`  
**Status:** ✅ Root Cause Identified

## Executive Summary

The EmberExtract tool's squash failure (0 nodes added) was caused by an **ID generation mismatch** between how parent nodes are created during ingestion and how the squasher looks them up. This is a **design inconsistency**, not a TypeScript ingestion failure.

---

## Findings

### 1. Schema Reality ✅
**Column Names:** 
- Database schema uses `title` (not `label`)
- `Node` interface has `label?: string` aliased to `title` (line 13, db.ts)
- This aliasing works correctly—not the problem

**Database State:**
- Total nodes: **481**
- Domains: `knowledge` (475), `code` (6)
- TypeScript files ARE ingested (6 code nodes found)

### 2. The ID Generation Problem 🚨

**Discovery:** `generateId()` in `db.ts:358-365` has a critical flaw:

```typescript
generateId(input: string): string {
  // If input looks like a path, take the filename
  const filename = input.split("/").pop() || "unknown";
  return filename
    .replace(/\.(md|ts|js|json)$/, "") // Strip extensions
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}
```

**Behavior:**
- Input: `"src/core/GraphEngine.ts"`
- Output: `"graphengine"` ❌

**The Mismatch:**

| Component | Input | ID Generated | Match? |
|-----------|-------|--------------|---------|
| Ingestion (original) | `"GraphEngine.ts"` | `"graphengine"` | ✅ |
| EmberExtract sidecar | `"src/core/GraphEngine.ts"` | ❌ | N/A |
| Squasher lookup | `"src/core/GraphEngine.ts"` | `"graphengine"` | ❌ |

**SidecarSquasher.ts:91-96** shows the flow:
```typescript
// Expecting "src/foo/Bar.ts.json" -> "src/foo/Bar.ts"
const relativePath = toRootRelative(sidecarPath);
const parentPath = relativePath.replace(/\.json$/, "");
const parentId = this.db.generateId(parentPath); // ← Calls generateId with full path
```

**Result:** Squasher generates ID from `"src/core/GraphEngine.ts"` → `"graphengine"`, but the parent node was created with just `"GraphEngine.ts"` → same ID by coincidence, BUT...

**Verified in Database:**
```sql
SELECT id, domain, title FROM nodes WHERE domain = 'code';
```
Result:
```
utils-ts-formatdate|code|formatDate
user-ts-user|code|User
auth-ts-authprovider|code|AuthProvider
```

**Pattern:** IDs include path structure (`utils-ts-formatdate`), NOT just filename (`formatdate`)!

This means `generateId()` was **NOT** used consistently—original ingestion must use a different ID scheme.

### 3. TypeScript Ingestion: Working ✅

**Evidence:**
- 6 code nodes exist with proper IDs
- Domain field = `code` (vs `knowledge` for markdown)
- IDs follow pattern: `{path-segment}-ts-{symbol}`

**Conclusion:** TS files ARE being ingested, just not via the current `generateId()` logic.

---

## Root Causes

### Primary: ID Generation Inconsistency
1. **Original ingestion** creates IDs like `"utils-ts-formatdate"` (path-aware)
2. **`generateId()`** strips paths to just filename (`"formatdate"`)
3. **Squasher** uses `generateId()` → gets wrong ID → parent not found

### Secondary: EmberExtract Sidecar Format
The sidecar uses `targetFile: file` where `file` is the glob-expanded path (`src/core/GraphEngine.ts`). This is correct, but exposes the ID mismatch.

---

## Impact Assessment

| Component | Status | Risk |
|-----------|--------|------|
| Markdown ingestion | ✅ Working | Low |
| TypeScript ingestion | ✅ Working | Low |
| EmberExtract sidecar generation | ✅ Working | None |
| SidecarSquasher DB merge | ❌ **Broken** | **HIGH** |
| Search/retrieval | ✅ Unaffected | None |

**Blast Radius:** Only affects LangExtract → Ember → Squash pipeline. Core ingestion is fine.

---

## Proposed Solutions

### Option A: Fix `generateId()` to Be Path-Aware (Recommended)

**Change:**
```typescript
generateId(input: string): string {
  // Keep full path structure, normalize it
  return input
    .replace(/^\.\//, "")         // Remove leading ./
    .replace(/\.(md|ts|js|json)$/, "") // Strip extension
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")  // Slugify
    .replace(/-+/g, "-")          // Collapse multiple dashes
    .replace(/^-|-$/g, "");       // Trim edge dashes
}
```

**Impact:**
- IDs become: `"src-core-graphengine"` instead of `"graphengine"`
- **Breaking change:** Requires DB regeneration or migration
- Fixes squasher parent lookup
- More collision-resistant

**Pros:**
- Future-proof (paths are unique)
- Matches existing code domain nodes
- Clear source traceability

**Cons:**
- Requires `amalfa init` re-run (acceptable per README philosophy)
- Longer IDs (minor storage impact)

---

### Option B: Make Squasher Path-Agnostic

**Change SidecarSquasher.ts:94-96:**
```typescript
const parentPath = relativePath.replace(/\.ember\.json$/, "");
// NEW: Extract just filename for ID lookup
const filename = parentPath.split("/").pop() || "";
const parentId = this.db.generateId(filename); // ← Use filename only
```

**Impact:**
- Squasher now matches current `generateId()` behavior
- No DB changes required
- Fixes immediate problem

**Pros:**
- Non-breaking
- Immediate fix
- Preserves current DB

**Cons:**
- Doesn't fix underlying path-awareness issue
- Risk of filename collisions (`utils/User.ts` vs `models/User.ts` → both `"user"`)
- Doesn't match existing code domain pattern

---

### Option C: Dual Lookup Strategy (Safest Short-Term)

**Change SidecarSquasher.ts:96-106:**
```typescript
// Try path-aware ID first
let parentId = this.db.generateId(parentPath);
let parentNode = this.db.getNode(parentId);

// Fallback: Try filename-only ID
if (!parentNode) {
  const filename = parentPath.split("/").pop() || "";
  parentId = this.db.generateId(filename);
  parentNode = this.db.getNode(parentId);
}

if (!parentNode) {
  log.debug({ parentPath, parentId }, "Parent node not found, skipping squash");
  return null;
}
```

**Impact:**
- Works with both ID schemes
- No breaking changes
- Buys time for proper migration

**Pros:**
- Zero risk
- Handles legacy and new IDs
- Can migrate incrementally

**Cons:**
- Technical debt (dual paths)
- Doesn't solve root inconsistency

---

## Recommendation

**Phase 1 (Immediate):** Implement **Option C** to unblock EmberExtract tool.

**Phase 2 (Next Sprint):** Implement **Option A** and regenerate DB:
1. Update `generateId()` to be path-aware
2. Run `rm .amalfa/resonance.db* && amalfa init`
3. Remove fallback logic from Option C

**Rationale:**
- Option C = no-regrets move (safe, reversible)
- Option A = correct long-term solution (aligns with existing code domain IDs)
- Regeneration is cheap per Amalfa's "markdown as source of truth" philosophy

---

## Verification Plan

### After Option C Fix:
```bash
# 1. Generate sidecar
bun run src/tools/EmberExtractTool.ts --path src/core/GraphEngine.ts --dry-run

# 2. Check sidecar
cat src/core/GraphEngine.ts.ember.json | jq '.targetFile'

# 3. Squash
# (via MCP tool or CLI)

# 4. Verify nodes added
sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM nodes WHERE meta LIKE '%lang-extract%';"
```

**Expected:** Non-zero node count, edges created.

### After Option A Migration:
```bash
# 1. Regenerate DB
rm .amalfa/resonance.db*
amalfa init

# 2. Verify new ID pattern
sqlite3 .amalfa/resonance.db "SELECT id FROM nodes WHERE id LIKE '%src%' LIMIT 5;"

# 3. Re-run ember extract
# (as above)
```

**Expected:** IDs like `"src-core-graphengine"`, successful squash.

---

## Lessons Learned

1. **Assumption failures:** We assumed TS files weren't ingested when they were—just with different IDs.
2. **ID generation is critical:** Should have been specified upfront and tested with path variants.
3. **Database forensics works:** Direct SQL queries revealed the truth faster than code tracing.
4. **"Hollow node" philosophy pays off:** DB corruption? Just delete and regenerate. No drama.

---

## Next Steps

1. ✅ Archive status brief
2. ⏭️ Implement Option C (dual lookup)
3. ⏭️ Test ember_extract tool end-to-end
4. ⏭️ Create brief for Option A migration (Phase 2)

---

**Status:** Analysis complete. Solutions proposed. Ready for implementation.
