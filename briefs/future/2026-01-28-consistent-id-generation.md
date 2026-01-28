# Brief: Consistent Path-Aware ID Generation

**Priority:** Medium  
**Status:** Future  
**Estimated Effort:** 1-2 hours  
**Depends On:** `brief-fix-squasher-parent-lookup.md` (Phase 1)

## Problem Statement

The current `generateId()` implementation in `ResonanceDB` has inconsistent behavior:

```typescript
generateId(input: string): string {
  // Strips path to filename only
  const filename = input.split("/").pop() || "unknown";
  return filename
    .replace(/\.(md|ts|js|json)$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}
```

**Issues:**
1. **Collision risk:** `src/models/User.ts` and `utils/User.ts` → both `"user"`
2. **Inconsistency:** Existing code domain nodes use path-aware IDs (`"utils-ts-formatdate"`)
3. **Lost context:** Can't determine file location from ID alone
4. **Squasher mismatch:** EmberExtract uses full paths, `generateId()` strips them

## Objectives

1. Make `generateId()` path-aware by default
2. Align with existing code domain ID pattern
3. Eliminate collision risk
4. Maintain readability

## Solution: Path-Aware Slug Generation

### Proposed Implementation

**File:** `src/resonance/db.ts:358-365`

```typescript
generateId(input: string): string {
  // Normalize path to be project-relative
  const normalized = input
    .replace(/^\.*\//, "")              // Remove leading ./ or ../
    .replace(/\.(md|ts|js|json)$/, "")  // Strip extension
    .toLowerCase()                      // Lowercase for consistency
    .replace(/[^a-z0-9\/]/g, "-")       // Convert non-alphanum to dashes (preserve /)
    .replace(/\/+/g, "-")               // Convert slashes to dashes
    .replace(/-+/g, "-")                // Collapse multiple dashes
    .replace(/^-|-$/g, "");             // Trim edge dashes
  
  return normalized;
}
```

### Examples

| Input | Current Output | New Output |
|-------|----------------|------------|
| `"GraphEngine.ts"` | `"graphengine"` | `"graphengine"` |
| `"src/core/GraphEngine.ts"` | `"graphengine"` | `"src-core-graphengine"` |
| `"./docs/README.md"` | `"readme"` | `"docs-readme"` |
| `"utils/formatDate.ts"` | `"formatdate"` | `"utils-formatdate"` |

### Backward Compatibility

**Breaking Change:** IDs will change for any nodes created from full paths.

**Migration Strategy:**
Per Amalfa philosophy (markdown as source of truth):
1. Delete database: `rm .amalfa/resonance.db*`
2. Regenerate: `amalfa init`
3. Re-run ember extract if needed

**No data loss:** All content is in markdown files.

## Implementation Checklist

### Phase 1: Code Changes
- [ ] Update `generateId()` in `src/resonance/db.ts`
- [ ] Add unit tests for new ID patterns
- [ ] Update any hardcoded ID references (grep for old patterns)

### Phase 2: Verification
- [ ] Run test suite
- [ ] Regenerate local DB and verify ID patterns
- [ ] Check for ID collisions in new scheme

### Phase 3: Documentation
- [ ] Update `DATABASE-PROCEDURES.md` with new ID format
- [ ] Add migration note to CHANGELOG
- [ ] Document ID generation in README

### Phase 4: Rollout
- [ ] Tag release with migration note
- [ ] Communicate to users: "Run `amalfa init` after upgrade"
- [ ] Monitor for issues

## Test Cases

### Unit Tests (New)

```typescript
describe("generateId", () => {
  it("preserves path structure", () => {
    expect(db.generateId("src/core/GraphEngine.ts")).toBe("src-core-graphengine");
  });
  
  it("handles relative paths", () => {
    expect(db.generateId("./docs/README.md")).toBe("docs-readme");
  });
  
  it("normalizes edge cases", () => {
    expect(db.generateId("foo//bar.ts")).toBe("foo-bar");
    expect(db.generateId("Foo_Bar.ts")).toBe("foo-bar");
  });
  
  it("strips extensions", () => {
    expect(db.generateId("test.md")).toBe("test");
    expect(db.generateId("script.ts")).toBe("script");
  });
  
  it("handles filename-only (backward compat)", () => {
    expect(db.generateId("README.md")).toBe("readme");
  });
});
```

### Integration Tests

```bash
# 1. Regenerate DB
rm .amalfa/resonance.db*
amalfa init

# 2. Check ID patterns
sqlite3 .amalfa/resonance.db "SELECT id FROM nodes WHERE id LIKE '%-%' LIMIT 10;"
# Expected: src-core-*, docs-*, etc.

# 3. Verify no collisions
sqlite3 .amalfa/resonance.db "
  SELECT id, COUNT(*) as cnt 
  FROM nodes 
  GROUP BY id 
  HAVING cnt > 1;
"
# Expected: Empty result

# 4. Test squasher
# Generate ember sidecar for src/core/GraphEngine.ts
# Run squasher
# Verify parent found and nodes added
```

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ID collisions in new scheme | Low | Medium | Add collision detection test |
| Users lose local DB state | High | Low | Document migration clearly |
| Performance impact | Very Low | Low | IDs are still short, no regex complexity added |
| Breaking MCP clients | Low | Medium | MCP returns IDs dynamically, no hardcoding |

## Success Criteria

- ✅ No ID collisions in production corpus
- ✅ EmberExtract squasher works without fallback logic
- ✅ All tests pass
- ✅ ID pattern documented
- ✅ Migration communicated to users

## Future Enhancements

### Optional: Namespace Prefixing
For multi-repo knowledge graphs:
```typescript
generateId(input: string, namespace?: string): string {
  const slug = /* ... path normalization ... */;
  return namespace ? `${namespace}/${slug}` : slug;
}
```

### Optional: Collision Detection
Log warning if ID already exists during ingestion:
```typescript
const existing = this.getNode(id);
if (existing && existing.label !== node.label) {
  log.warn({ id, existingLabel: existing.label, newLabel: node.label }, 
    "ID collision detected");
}
```

## Dependencies

**Blocks:**
- EmberExtract end-to-end flow (currently using fallback)
- Multi-file refactoring tools (need reliable parent lookup)

**Blocked By:**
- Phase 1 (fix-squasher-parent-lookup) must ship first

## Timeline

- **Phase 1 (Immediate):** Ship fallback fix
- **Phase 2 (This Sprint):** Implement path-aware IDs
- **Phase 3 (Next Release):** Remove fallback logic, document migration

---

**Ready for implementation:** After Phase 1 ships  
**Breaking changes:** Yes (requires DB regeneration)  
**Requires DB migration:** Yes (via `amalfa init`)
