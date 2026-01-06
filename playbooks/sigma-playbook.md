# Sigma.js Playbook

## Version

We are using **Sigma.js v2.4.0**.

> [!IMPORTANT]
> **Version Critical**: We are strictly using **v2.4.0**. Do not use v1 (uses `sigma.instances`) or v3 (uses different settings) documentation.

> [!NOTE]
> **Alpine.js Integration**: This playbook is designed to be used with Alpine.js. Avoid direct DOM manipulation (e.g., `document.getElementById`) and prefer Alpine directives (`x-on`, `x-ref`) and component state.

## Core Concepts

- **Graphology**: Used for graph data structure and manipulation.
- **Sigma**: The renderer (WebGL).
- **Layout**: ForceAtlas2 is used for layout.

## Configuration

### Renderer Settings

Settings are passed to the `Sigma` constructor. Use `x-ref` to reference the container.

```js
// Inside Alpine component init()
const container = this.$refs.sigmaContainer;
this.renderer = new Sigma(this.graph, container, {
  renderEdgeLabels: true,
  // Add other settings here
});
```

## Camera Control

### Zooming

> [!WARNING]
> **Inverse Logic**: In Sigma v2, `camera.ratio` is the **inverse** of the zoom level.
>
> - **Ratio < 1**: Zoomed In (Seeing a smaller area)
> - **Ratio > 1**: Zoomed Out (Seeing a larger area)

To control zoom programmatically, use Alpine methods bound to `@click`:

```html
<button @click="zoomIn()">+</button>
<button @click="zoomOut()">-</button>
```

```js
// Alpine component methods
zoomIn() {
  const camera = this.renderer.getCamera();
  camera.animate({ ratio: camera.ratio / 1.5 });
},
zoomOut() {
  const camera = this.renderer.getCamera();
  camera.animate({ ratio: camera.ratio * 1.5 });
}
```

### Disabling Scroll Zoom

In v2.4.0, prevent the `wheel` event from reaching Sigma using Alpine's `.stop` modifier on the container.

```html
<div 
  x-ref="sigmaContainer" 
  class="absolute inset-0" 
  @wheel.stop
></div>
```

### Camera Animation Risks

> [!CAUTION]
> **Race Conditions**: Avoid animating the camera (e.g., `camera.animate()`) immediately after hiding or showing a large number of nodes (e.g., filtering). This can cause race conditions in the renderer where labels disappear or artifacts remain.
>
> **Best Practice**: If you are filtering the graph significantly, allow the user to manually zoom/pan rather than auto-centering, or add a significant delay before animation.

## Event Handling

### The "Click Race" (Node vs Stage)

> [!CAUTION]
> **Event Propagation**: Clicking a node often triggers a `clickNode` event followed immediately by a `clickStage` (background) event. If your `clickStage` handler clears the selection, it will instantly deselect the node you just clicked.

**Solution: The Debounce Lock**

Use a flag (e.g., `clickBlock`) to temporarily ignore stage clicks after a node click.

```js
// Alpine Component Data
data() {
  return {
    clickBlock: false, // The Lock
    // ...
  }
}

// In init() or setup
this.renderer.on("clickNode", ({ node }) => {
  // 1. Engage Lock
  this.clickBlock = true;
  setTimeout(() => this.clickBlock = false, 200); // 200ms debounce

  // 2. Handle Selection
  this.selectedNode = node;
});

this.renderer.on("clickStage", () => {
  // 1. Check Lock
  if (this.clickBlock) return; 

  // 2. Clear Selection
  this.selectedNode = null;
});
```

### The "Hover-Click Fallback" (Fixing Sticky Clicks)

Sigma's hit detection can sometimes miss, or a `clickStage` event might fire when you think you are clicking a node. To make clicking robust:

1.  Track the `hoveredNode` using `enterNode` and `leaveNode`.
2.  In your `clickStage` handler, check if a node is currently hovered.
3.  If yes, select that node instead of clearing the selection.

```js
// 1. Track Hover
this.renderer.on("enterNode", ({ node }) => this.hoveredNode = node);
this.renderer.on("leaveNode", () => this.hoveredNode = null);

// 2. Fallback in Stage Click
this.renderer.on("clickStage", () => {
  if (this.clickBlock) return;

  // FALLBACK: If hovering, select the node!
  if (this.hoveredNode) {
    this.selectNode(this.hoveredNode);
    return;
  }

  this.selectedNode = null; // Actual background click
});
```

## Visual Noise Control

### Label Threshold

To prevent label clutter, use `labelRenderedSizeThreshold`. This hides labels for nodes smaller than the threshold until the user zooms in.

```js
this.renderer = new Sigma(this.graph, container, {
  // Hide labels for nodes < 8px until zoomed
  labelRenderedSizeThreshold: 8, 
  // ...
});
```

### Dynamic Threshold Adjustment

You can adjust the label threshold at runtime to show more or fewer labels depending on the context (e.g., lower the threshold when filtering to a small community).

```js
// Show more labels (e.g., when filtering)
this.renderer.setSetting("labelRenderedSizeThreshold", 4);

// Show fewer labels (e.g., default view)
this.renderer.setSetting("labelRenderedSizeThreshold", 8);
```

### Pre-Render Visualization

To avoid a "flash of unstyled content" (e.g., gray nodes turning colored), apply your visualization logic (colors, sizes) **before** creating the `Sigma` instance.

```js
// 1. Load Graph
this.graph = ...;

// 2. Apply Visuals (Louvain, PageRank)
applyLouvainColors(this.graph);
applyPageRankSizes(this.graph);

// 3. Render (Graph is already styled)
this.renderer = new Sigma(this.graph, container, ...);
```

## 7. The Ghost Graph (Semantic Layer)
An ephemeral layer that visualizes vector similarities on demand.

-   **Trigger**: User clicks "Find Similar" on a node.
-   **Mechanism**:
    1.  Client: Calls `findSimilar(nodeId)`.
    2.  Database: Executes `vec_dot` UDF query against `embeddings` column.
    3.  Graph: Adds temporary "Ghost Edges" (Gold color, `ghost: true`).
-   **Context Policy**:
    -   Ghost edges persist if re-clicking the *same* node (Contextual Navigation).
    -   Ghost edges clear automatically when selecting a *new* node (Clean Slate).
-   **Style**:
    -   Color: `var(--color-ghost-edge)` (defined in `theme.css`).
    -   Type: `arrow` (directed).
## 8. Data Translation Layer (The Adapter)

**Principle**: "The View shall not know the Database schema."

To prevents "bad data" or reserved words from leaking into Sigma, we must use a strict **Adapter Pattern**. Do not pass raw DB rows directly to `graph.addNode()`.

### The Contract
We define a strict interface for what our Graph View expects:

```typescript
interface SigmaNode {
    id: string;
    label: string;       // REQUIRED. Mapped from DB 'title'
    nodeType: string;    // Mapped from DB 'type'
    x?: number;          // Calculated/Hashed
    y?: number;          // Calculated/Hashed
    color?: string;      // Calculated
    size?: number;       // Calculated
    attributes?: Record<string, any>; // Safe bucket for extras
}
```

### Implementation (Safe Adapter)
Create a pure function `adaptNode(row)` that:
1.  **Sanitizes**: Ensures `label` is a non-empty string (fall back to ID).
2.  **Filters**: Removes sensitive or large DB fields (like full `content`) unless explicitly whitelisted for the UI.
3.  **Renames**: Maps `title` -> `label` explicitly.
4.  **Validates**: Drops nodes that don't meet minimum visual criteria.

**Bad (Leaky):**
```js
graph.addNode(row.id, { ...row, label: row.title }); // Leaks all DB columns!
```

**Good (Safe):**
```js
const cleanNode = adaptNode(row);
graph.addNode(cleanNode.id, cleanNode);
```
