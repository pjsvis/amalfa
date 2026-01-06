# UI Debug Analysis - Sigma Explorer Issues

**Date:** 2025-12-12  
**Tool:** Ripgrep + AST-grep superpowers  
**Status:** Analysis Complete - Ready for Implementation

---

## Issue 1: Analysis Guide Summary Dark-on-Dark in Light Mode

### **Grep Investigation**
```bash
$ rg "summary|details" src/css/ public/css/ --type css
```

**Found:** `public/css/app.css` line 377-379
```css
:where(summary) {
    background: var(--surface-3);
    ...
}
```

**Problem:** Summary uses `var(--surface-3)` which is dark in both themes, AND text color comes from parent which has `style="color: var(--text-2);"` - creating dark text on dark background in light mode.

**Root Cause:**
1. HTML (line 377-379): Summary has `style="color: var(--text-2);"`  
2. CSS: Summary background is `var(--surface-3)` (dark colored)
3. In light mode: `--text-2` is dark gray + `--surface-3` is dark gray = invisible text

### **Proposed Fix**
```html
<!-- File: public/sigma-explorer/index.html, line 377-379 -->
<!-- BEFORE -->
<summary class="flex items-center justify-between cursor-pointer list-none font-bold text-xs uppercase tracking-wider"
    style="color: var(--text-2);">

<!-- AFTER -->
<summary class="flex items-center justify-between cursor-pointer list-none font-bold text-xs uppercase tracking-wider"
    style="color: var(--text-1);">
    <!-- Change --text-2 to --text-1 for better contrast -->
```

---

## Issue 2: Analysis Guide Should Collapse When Node Clicked

### **Grep Investigation**
```bash
$ rg "analysisGuide|x-ref" public/sigma-explorer/index.html
```

**Found:** Line 374 - `<details x-ref="analysisGuide" ... open>`

**Current Behavior:** `open` attribute keeps it always expanded

**Problem:** No JavaScript to collapse it when node is selected

### **Proposed Fix**

**File:** `public/sigma-explorer/index.html` (around line 403-406 where selectedNode logic is)

Add Alpine.js watcher:
```html
<!-- In the selectedNode section, add x-effect -->
<div x-show="selectedNode" 
     x-effect="if (selectedNode) { $refs.analysisGuide.removeAttribute('open') }"
     class="space-y-4 border-t border-gray-100 pt-4"
```

**OR** simpler approach - remove the `open` attribute entirely and let user open it:
```html
<!-- Line 374 -->
<details x-ref="analysisGuide"
    class="group open:bg-[var(--surface-2)] open:ring-1 open:ring-black/5 rounded-lg p-2 transition-all duration-300">
    <!-- Remove 'open' attribute -->
```

**Recommendation:** Use x-effect approach for better UX (auto-collapse when node selected).

---

## Issue 3: Too Many Louvain Communities

### **Grep Investigation**
```bash
$ rg "louvain.*resolution|tuning.*louvain" --type js --type json -A 3
```

**Found:** 
1. `src/js/components/sigma-explorer/viz.js` line 36-37:
   ```js
   const resolution = this.settings?.graph?.tuning?.louvain?.[domainKey] || 1.1;
   ```

2. `polyvis.settings.json` line 17-21:
   ```json
   "louvain": {
       "persona": 1.1,
       "experience": 1.0
   }
   ```

**Problem:** Resolution values `1.0` and `1.1` are creating too many small communities. Default of 1.0 creates MANY communities, need higher resolution to merge them.

**Analysis:**
- **Lower resolution** (e.g., 0.5-0.9) = FEWER, LARGER communities  
- **Higher resolution** (e.g., 1.1-2.0) = MORE, SMALLER communities  

Current: `1.0` and `1.1` → Too many communities

### **Proposed Fix**

**File:** `polyvis.settings.json`

```json
"graph": {
    "tuning": {
        "louvain": {
            "persona": 0.6,      // Lower = fewer communities (was 1.1)
            "experience": 0.5    // Lower = fewer communities (was 1.0)
        }
    }
}
```

**Tweakable Parameters Added:**
- `persona`: 0.6 (adjust between 0.4-0.8 for fewer/more communities)  
- `experience`: 0.5 (adjust between 0.3-0.7)  

**Already settings-driven!** ✅ Just need to adjust values.

---

## Summary of Proposed Changes

### **Files to Modify**

| File | Lines | Change | Complexity |
|------|-------|--------|------------|
| `public/sigma-explorer/index.html` | 379 | Change `--text-2` to `--text-1` in summary | **Easy** (1 char) |
| `public/sigma-explorer/index.html` | 403-406 | Add `x-effect` to collapse guide | **Easy** (1 line) |
| `polyvis.settings.json` | 19-20 | Lower louvain resolution values | **Easy** (2 numbers) |

### **Verification Commands**

```bash
# 1. Check text contrast (visual - run dev server)
bun run dev
# Visit http://localhost:3000/sigma-explorer/
# Toggle to light mode
# Check: Analysis Guide summary is readable

# 2. Check auto-collapse (visual)
# Click any node
# Check: Analysis Guide collapses

# 3. Check fewer communities (visual)
# Click "Louvain Communities" button
# Count community buttons
# Expected: 3-7 communities (not 10-15)
```

---

## Implementation Plan

1. **Fix CSS contrast** (Issue #1) - 30 seconds  
2. **Add auto-collapse** (Issue #2) - 1 minute  
3. **Adjust Louvain** (Issue #3) - 30 seconds  
4. **Verify all fixes** - 2 minutes  

**Total:** ~4 minutes to implement + verify

---

**Ready to proceed?** All fixes identified, low risk, easy to implement and rollback if needed.
