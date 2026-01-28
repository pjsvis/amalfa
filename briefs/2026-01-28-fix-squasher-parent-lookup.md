# Brief: Fix EmberExtract Squasher Parent Lookup

**Priority:** High  
**Status:** Pending  
**Estimated Effort:** 30 minutes  
**Depends On:** None

## Problem Statement

The `SidecarSquasher` fails to find parent nodes when processing EmberExtract sidecars because of an ID generation mismatch:

- **Sidecars** use full paths: `"src/core/GraphEngine.ts"`
- **generateId()** strips paths to filenames: `"graphengine"`
- **Existing code domain nodes** use path-aware IDs: `"utils-ts-formatdate"`

Result: 0 nodes added during squash.

## Objectives

1. Make `SidecarSquasher` find parent nodes regardless of ID scheme
2. Maintain backward compatibility with existing database
3. Unblock EmberExtract tool immediately
4. Avoid breaking changes

## Solution: Dual Lookup Strategy

Implement a fallback lookup that tries both path-aware and filename-only IDs.

### Implementation

**File:** `src/core/SidecarSquasher.ts`

**Change lines 91-106:**

```typescript
// 2. Resolve Parent Node
// Expecting "src/foo/Bar.ts.ember.json" -> "src/foo/Bar.ts"
const relativePath = toRootRelative(sidecarPath);
const parentPath = relativePath.replace(/\.ember\.json$/, "");

// Try path-aware ID first (matches current code domain pattern)
let parentId = this.db.generateId(parentPath);
let parentNode = this.db.getNode(parentId);

// Fallback: Try filename-only ID (legacy compatibility)
if (!parentNode) {
  const filename = parentPath.split("/").pop() || "";
  const fallbackId = this.db.generateId(filename);
  parentNode = this.db.getNode(fallbackId);
  if (parentNode) {
    parentId = fallbackId; // Use the ID that worked
    log.debug(
      { parentPath, fallbackId },
      "Parent found via filename fallback"
    );
  }
}

// Verify parent exists
if (!parentNode) {
  log.debug(
    { parentPath, parentId },
    "Parent node not found, skipping squash"
  );
  return null;
}
```

## Verification

### Test Case 1: Existing Markdown Files
```bash
# Ensure existing markdown node lookup still works
sqlite3 .amalfa/resonance.db "SELECT id FROM nodes WHERE type = 'document' LIMIT 1;"
# Use that ID to create a test sidecar
# Run squasher
# Verify no regression
```

### Test Case 2: EmberExtract TypeScript Files
```bash
# Generate sidecar for src/core/GraphEngine.ts
# Run squasher
sqlite3 .amalfa/resonance.db "SELECT COUNT(*) FROM nodes WHERE meta LIKE '%lang-extract%';"
# Expected: > 0
```

### Test Case 3: Edge Cases
- Parent node doesn't exist at all → Should skip gracefully
- Sidecar has no graphData → Should skip (already handled)
- Filename collisions → Should pick first match (acceptable for now)

## Success Criteria

- ✅ Squasher finds parent nodes for EmberExtract sidecars
- ✅ No regression in markdown sidecar processing
- ✅ No breaking changes to database
- ✅ Proper logging of fallback usage

## Rollout Plan

1. Implement change in `SidecarSquasher.ts`
2. Run `bun test` (if tests exist for squasher)
3. Manual verification with test sidecar
4. Deploy
5. Monitor logs for fallback usage frequency

## Future Work

After this fix:
- **Phase 2:** Migrate to consistent path-aware ID generation (see `brief-consistent-id-generation.md`)
- **Phase 3:** Remove fallback logic once DB is migrated

## Notes

- This is a **tactical fix** to unblock EmberExtract
- The **strategic fix** is to standardize `generateId()` to always be path-aware
- Amalfa's "markdown as source of truth" makes DB regeneration cheap, so migration is low-risk

---

**Ready for implementation:** Yes  
**Breaking changes:** No  
**Requires DB migration:** No
