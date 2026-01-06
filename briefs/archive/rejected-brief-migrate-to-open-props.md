# Task: Migrate to Open Props

**Objective:** Replace the Tailwind CSS dependency with Open Props to align with the project's "Vanilla First" and "Brutalist" philosophy, resulting in a cleaner, standards-based codebase.

- [ ] **Remove Dependency:** Eliminate the Tailwind CSS CDN link.
- [ ] **Adopt Standard:** Import Open Props (via CDN or local file).
- [ ] **Refactor CSS:** Replace Tailwind utility classes (e.g., `p-4`, `flex`, `text-xs`) with standard CSS and Open Props variables (e.g., `padding: var(--size-3)`, `font-size: var(--font-size-0)`).
- [ ] **Simplify HTML:** Clean up the HTML markup by removing long class strings.

## Key Actions Checklist:

- [ ] **Setup:** Add Open Props to `index.html` (and other pages).
- [ ] **Audit:** Identify all Tailwind classes currently in use.
- [ ] **Refactor Global Styles:** Update `style.css` to use Open Props for the design system (colors, spacing, typography).
- [ ] **Refactor Components:** Update `sigma-explorer/index.html` and other views to use standard CSS classes backed by Open Props.
- [ ] **Cleanup:** Remove Tailwind script.

## Detailed Requirements

### Why Open Props?
- **Lightweight:** No build step, just CSS variables.
- **Deterministic:** Standardized values for spacing, fonts, and animations.
- **Future-Proof:** Uses native CSS features, not a framework abstraction.

### Migration Strategy
We will move from "Utility Classes in HTML" to "Semantic Classes in CSS".

**Before (Tailwind):**
```html
<div class="flex flex-col p-4 space-y-4 bg-white shadow-sm">
```

**After (Open Props):**
```html
<div class="sidebar-panel">
```

```css
.sidebar-panel {
  display: flex;
  flex-direction: column;
  padding: var(--size-3);
  gap: var(--size-3);
  background: var(--surface-1);
  box-shadow: var(--shadow-1);
}
```
