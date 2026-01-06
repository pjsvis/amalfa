# Modern Layout Playbook

## Purpose
To provide standard patterns for high-fidelity layouts, replacing "magic numbers" and fragile hacks with robust, mathematical CSS engines.

## 1. The Universal Centering Heuristic
**Problem**: Vertically and horizontally centering content without side effects.

### Pattern: `place-items: center`
The gold standard for centering in Grid and Flex containers.

```css
.hero-section {
  display: grid;
  place-items: center; /* Instant X/Y centering */
  min-height: 50vh;
}
```

### Pattern: `margin-inline: auto`
For block-level elements requiring horizontal centering (replaces `margin: 0 auto`).

```css
.container {
  max-width: var(--size-content-3);
  margin-inline: auto; /* RTL-safe centering */
}
```

## 2. The "Holy Grail" Grid Topology
**Problem**: Creating a responsive app shell (Header, Sidebar, Main, Footer) without complex nesting.

### Pattern: Grid Areas
Use named grid areas to map the layout visually.

```css
.app-shell {
  display: grid;
  min-height: 100vh;
  /* Sidebar fixed width, Main takes remaining space */
  grid-template-columns: var(--size-15) 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: 
    "header header"
    "sidebar main"
    "footer footer";
}

/* Mobile Adaptation */
@media (max-width: 768px) {
 .app-shell {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    grid-template-areas: 
      "header"
      "sidebar"
      "main"
      "footer";
  }
}
```

## 3. The "RAM" Pattern (Responsive Cards)
**Problem**: Creating responsive grids without manually specifying breakpoints (e.g., `grid-cols-1 md:grid-cols-3`).

### Pattern: Repeat, Auto-Fit, MinMax
Uses the content's intrinsic size to determine the layout.

```css
.card-grid {
  display: grid;
  gap: var(--size-4);
  /* The Magic Algorithm */
  grid-template-columns: repeat(auto-fit, minmax(min(var(--size-content-1), 100%), 1fr));
}
```
- **`auto-fit`**: Fit as many columns as possible.
- **`minmax(...)`**: Columns must be at least `var(--size-content-1)` wide, but stretch (`1fr`) if space allows.
- **`min(..., 100%)`**: Prevents overflow on very small screens.

## 4. Container Queries vs. Media Queries
**Heuristic**:
- Use **Media Queries** (`@media`) for **Macro Layout** (Page shell, navigation visibility).
- Use **Container Queries** (`@container`) for **Micro Layout** (Card internals, button arrangements).

```html
<div class="@container">
  <article class="flex flex-col @md:flex-row">
    <!-- This card rearranges based on its container width, not the viewport -->
  </article>
</div>
```
## 5. Layout Debug Mode
**Problem**: Visualizing grid tracks and container extents during development.

### Pattern: `.layout-debug-mode`
A utility class toggled via keyboard shortcut (e.g., `Shift+D`) to outline elements and visualize grid columns.

```css
.layout-debug-mode * {
  outline: 1px dashed rgba(255, 0, 0, 0.3) !important;
  background: rgba(255, 0, 0, 0.02) !important;
}

.layout-debug-mode .app-shell {
  /* Visualize Grid Columns */
  background: linear-gradient(90deg,
    rgba(0, 0, 255, 0.05) 0,
    rgba(0, 0, 255, 0.05) var(--size-15),
    transparent var(--size-15),
    transparent calc(100% - var(--size-15)),
    rgba(0, 0, 255, 0.05) calc(100% - var(--size-15))
  ) !important;
}
```
