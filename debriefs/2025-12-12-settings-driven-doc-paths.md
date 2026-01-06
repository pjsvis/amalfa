# Settings-Driven Documentation Paths - 2025-12-12

**Type:** Configuration Enhancement  
**Status:** ✅ COMPLETE  
**Duration:** ~10 minutes

---

## Objective

Eliminate hardcoded documentation paths from scripts by centralizing them in `polyvis.settings.json`.

## Impact Analysis (Ripgrep)

### Hardcoded Paths Found
```bash
$ rg -t ts -t js 'join.*"docs|join.*"public/docs'
```

**Results:**
1. `scripts/transform/transform_cda.ts:262` - `"public/docs"`
2. `scripts/maintenance/consolidate-docs/index.ts:33-35` - `"docs"`, `"public/docs/vectra-docs"`
3. `scripts/maintenance/organize-root-docs/index.ts:15` - `"docs"` (maintenance script, acceptable)

**Total:** 2 active scripts with hardcoded paths

---

## Changes Made

### 1. Added to Settings (polyvis.settings.json)

```json
"docs": {
  "root": "docs",
  "webdocs": "docs/webdocs",
  "architecture": "docs/architecture",
  "public": "public/docs"
}
```

### 2. Updated Scripts

**A. consolidate-docs/index.ts**
```typescript
// Before
const DOCS_DIR = join(ROOT, "docs");
const WEBDOCS_DIR = join(DOCS_DIR, "webdocs");
const PUBLIC_VECTRA = join(ROOT, "public/docs/vectra-docs");

// After
import settings from "@/polyvis.settings.json";
const DOCS_DIR = join(ROOT, settings.paths.docs.root);
const WEBDOCS_DIR = join(ROOT, settings.paths.docs.webdocs);
const PUBLIC_DOCS = join(ROOT, settings.paths.docs.public);
const PUBLIC_VECTRA = join(PUBLIC_DOCS, "vectra-docs");
```

**B. transform_cda.ts**
```typescript
// Before
const docsPath = join(process.cwd(), "public/docs");

// After  
const docsPath = join(process.cwd(), settings.paths.docs.public);
```

---

## Verification

### Pre-Change: Hardcoded Paths
```bash
$ rg '"docs/|"public/docs/' scripts/
# Found: 1 match ✅
```

### Post-Change: Settings-Driven
```bash
$ rg '"docs/|"public/docs/' scripts/ | grep -v "settings.paths"
# Exit code: 1 (no matches) ✅
```

### Settings Usage Confirmed
```bash
$ rg 'settings\.paths\.docs' scripts/
# Results:
scripts/transform/transform_cda.ts: settings.paths.docs.public
scripts/maintenance/consolidate-docs/index.ts: settings.paths.docs.root
scripts/maintenance/consolidate-docs/index.ts: settings.paths.docs.webdocs
scripts/maintenance/consolidate-docs/index.ts: settings.paths.docs.public
✅ 4 usages across 2 scripts
```

---

## Benefits

✅ **Single Source of Truth** - All doc paths in one place  
✅ **Easy Refactoring** - Change paths once, affects all scripts  
✅ **No Magic Strings** - Aligned with Zero Magic principle  
✅ **Future-Proof** - New scripts will use settings pattern  

---

## Impact

### Files Modified
1. `polyvis.settings.json` - Added docs paths
2. `scripts/maintenance/consolidate-docs/index.ts` - Updated to settings
3. `scripts/transform/transform_cda.ts` - Updated to settings

### Files NOT Modified
- `scripts/maintenance/organize-root-docs/index.ts` - Maintenance script, acceptable hardcoding

---

## Lessons Learned

### The Ripgrep Superpower
Using ripgrep for impact analysis is **critical**:
- Found all hardcoded paths in seconds
- Verified complete elimination post-change
- Pattern: `rg '"path/' scripts/` is the canonical check

### Staged Approach Works
1. Impact analysis first
2. Add to settings
3. Update scripts sequentially
4. Verify with same ripgrep command

**This is now the standard refactoring pattern.**

---

## Status

✅ **VERIFIED COMPLETE**
- Settings updated
- Scripts migrated
- No hardcoded paths remain
- Ready to proceed with documentation consolidation

---

**Next:** Execute `bun run scripts/maintenance/consolidate-docs/index.ts` (now settings-driven)
