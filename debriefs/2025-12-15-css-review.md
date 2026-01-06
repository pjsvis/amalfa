# CSS Architecture Review & Improvement Proposals

**Date:** 2025-12-15
**Status:** In Progress

---

## Executive Summary

The CSS architecture is **well-designed** with modern patterns (CSS Layers, OKLCH colors, Container Queries, CSS Nesting). However, there are several issues that should be addressed for maintainability and consistency.

---

## Issues Identified

### 1. **Duplicate `.stack-large` Definition** (High Priority)

**Location:** Defined in TWO places with DIFFERENT values:
- `layout.css:156` - `margin-block-start: var(--size-4)`
- `utilities.css:6` - `margin-top: var(--size-6)`

**Problem:** The layer cascade means `utilities.css` (higher specificity layer) wins, but this is confusing and error-prone.

**Fix:** Remove the duplicate from `utilities.css` and keep only the `layout.css` definition.

---

### 2. **Missing `--radius-component` Variable** (High Priority)

**Location:** Used in `components.css:30, 81, 85, 157, 275` but **never defined** in `theme.css`.

**Problem:** This causes fallback to `0` or browser default, breaking border-radius styling.

**Fix:** Add to `theme.css`:
```css
--radius-component: var(--radius-2); /* or appropriate Open Props value */
```

---

### 3. **ID Selector Override Block** (Medium Priority)

**Location:** `layout.css:191-215`

```css
#right-sidebar-override { ... }
#right-sidebar-override * { color: var(--black); }
```

**Problems:**
- Uses ID selectors (high specificity, harder to override)
- Uses `*` universal selector (performance/specificity smell)
- References `var(--black)` which isn't defined in theme.css
- "FORCE OVERRIDE" comment indicates a hack, not a solution

**Fix:** Refactor to use a proper component class with CSS variables or scope isolation.

---

### 4. **Legacy Alias Technical Debt** (Medium Priority)

**Location:** `theme.css:174-188`

```css
/* Legacy compatibility - migrate away from these */
--gray-2: var(--surface-3);
--gray-8: var(--surface-3);
--gray-9: var(--text-2);
--color-brand: var(--primary);
```

**Fix:** Search codebase for usages, replace with semantic variables, then remove aliases.

---

### 5. **`components.css` Exceeds 300-Line FLIP Guideline** (Medium Priority)

**Location:** `components.css` at 409 lines

**Problem:** Per `AGENTS.md` Protocol 21 (FLIP), files should stay under 300 lines.

**Suggested Split:**
| New File | Contents |
|----------|----------|
| `buttons.css` | Lines 1-167 (button variants) |
| `navigation.css` | Lines 197-242 (nav components) |
| `forms.css` | Lines 168-196 (inputs) |
| `components.css` | Remaining (sidenote, links, home, docs) |

---

### 6. **Undefined Variables Referenced** (Medium Priority)

| Variable | Location | Status |
|----------|----------|--------|
| `--radius-component` | `components.css` | **Missing** |
| `--black` | `layout.css:198,202` | **Missing** (should be `--text-1`) |
| `--shadow-3` | `layout.css:91,138` | Uses Open Props but not verified |
| `--border-size-1` | Multiple | Open Props dependency |
| `--border-size-2` | `components.css:187` | Open Props dependency |
| `--border-size-3` | `components.css:249` | Open Props dependency |

---

### 7. **Inconsistent Property Usage** (Low Priority)

- `margin-block-start` vs `margin-top` (both used for same purpose)
- `var(--size-*)` vs `var(--spacing-*)` (theme defines both)

**Fix:** Standardize on `margin-block-*` (logical properties) and `--spacing-*` (project tokens).

---

### 8. **Hardcoded Magic Values** (Low Priority)

| Location | Value | Issue |
|----------|-------|-------|
| `layout.css:84,131` | `768px` | Should be a variable `--breakpoint-md` |
| `layout.css:89,136` | `80%` | Should be a variable `--sidebar-mobile-width` |

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Immediate)
- [x] Add `--radius-component` to `theme.css`
- [x] Remove duplicate `.stack-large` from `utilities.css`
- [x] Replace `--black` with `--text-1` in layout.css

### Phase 2: Cleanup (Short-term)
- [x] Refactor `#right-sidebar-override` to use `.sidebar-panel-light` class
- [x] Search and replace legacy `--color-brand` aliases with `--primary`
- [x] Extract breakpoint variables to theme variables (`--breakpoint-*`, `--sidebar-mobile-width`)

### Phase 3: Refactoring (When Capacity Allows)
- [x] Split `components.css` into smaller modules (buttons.css, forms.css, navigation.css, components.css)
- [ ] Standardize on logical properties (`margin-block-*`)
- [ ] Audit all inline styles in HTML files

---

## Final File Structure

| File | Lines | Purpose |
|------|-------|---------|
| `theme.css` | 272 | Design tokens, colors, spacing |
| `base.css` | 97 | Resets, element defaults |
| `layout.css` | 214 | App shell, grid patterns |
| `buttons.css` | 166 | Button styles and variants |
| `forms.css` | 32 | Input styles |
| `navigation.css` | 47 | Nav components |
| `components.css` | 156 | Sidenotes, links, home, docs |
| `graph.css` | 53 | Sigma explorer styles |
| `utilities.css` | 38 | Debug utilities |
| **Total** | **1,075** | All under 300-line FLIP limit |

---

## Proposed Theme Additions

Add these missing variables to `theme.css`:

```css
/* RADII */
--radius-component: var(--radius-2);

/* BREAKPOINTS */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;

/* MOBILE LAYOUT */
--sidebar-mobile-width: 80%;
```
