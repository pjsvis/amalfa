# Graphology Playbook

## Installation

```bash
npm install graphology
```

> [!NOTE]
> **Alpine.js Integration**: This playbook is designed to be used with Alpine.js. While Graphology is framework-agnostic, ensure graph state is managed within Alpine components.

## Instantiation

### Basic Graph

```javascript
import Graph from 'graphology';
const graph = new Graph();
```

### Graph Types

Graphology supports different types of graphs:

- `Graph`: A basic graph that can be directed or undirected.
- `DirectedGraph`: A graph where all edges are directed.
- `UndirectedGraph`: A graph where all edges are undirected.

```javascript
import { DirectedGraph, UndirectedGraph } from 'graphology';

const directedGraph = new DirectedGraph();
const undirectedGraph = new UndirectedGraph();
```

### Instantiation Options

You can pass options to the constructor to customize the graph:

```javascript
const graph = new Graph({
  type: 'directed', // 'directed', 'undirected', or 'mixed'
  multi: false, // true to allow parallel edges
  allowSelfLoops: true // true to allow self-loops
});
```

## Properties

- `graph.order`: The number of nodes in the graph.
- `graph.size`: The number of edges in the graph.
- `graph.type`: The type of the graph ('directed', 'undirected', or 'mixed').
- `graph.multi`: Whether the graph allows parallel edges.
- `graph.allowSelfLoops`: Whether the graph allows self-loops.

## Read

- `graph.hasNode(node)`: Check if a node exists.
- `graph.hasEdge(edge)`: Check if an edge exists.
- `graph.degree(node)`: Get the degree of a node.
- `graph.source(edge)`: Get the source of an edge.
- `graph.target(edge)`: Get the target of an edge.
- `graph.opposite(node, edge)`: Get the opposite node of an edge.

## Mutation

- `graph.addNode(node, attributes)`: Add a node to the graph.
- `graph.addEdge(source, target, attributes)`: Add an edge to the graph.
- `graph.dropNode(node)`: Remove a node from the graph.
- `graph.dropEdge(edge)`: Remove an edge from the graph.
- `graph.clear()`: Clear the graph (remove all nodes and edges).
- `graph.clearEdges()`: Clear all edges from the graph.

## Attributes

### Node Attributes

- `graph.setNodeAttribute(node, name, value)`: Set a node attribute.
- `graph.getNodeAttribute(node, name)`: Get a node attribute.
- `graph.hasNodeAttribute(node, name)`: Check if a node has an attribute.
- `graph.removeNodeAttribute(node, name)`: Remove a node attribute.

### Edge Attributes

- `graph.setEdgeAttribute(edge, name, value)`: Set an edge attribute.
- `graph.getEdgeAttribute(edge, name)`: Get an edge attribute.
- `graph.hasEdgeAttribute(edge, name)`: Check if an edge has an attribute.
- `graph.removeEdgeAttribute(edge, name)`: Remove an edge attribute.

## Iteration

### Nodes

- `graph.forEachNode(callback)`: Iterate over each node.
- `graph.nodes()`: Get an array of all nodes.

### Edges

- `graph.forEachEdge(callback)`: Iterate over each edge.
- `graph.edges()`: Get an array of all edges.

### Neighbors

- `graph.forEachNeighbor(node, callback)`: Iterate over the neighbors of a node.
- `graph.neighbors(node)`: Get an array of the neighbors of a node.

## Serialization

- `graph.import(data)`: Import a graph from a serialized format.
- `graph.export()`: Export the graph to a serialized format.

## Standard Library

Graphology comes with a standard library that includes:

- **Algorithms**: community detection, shortest path, etc.
- **Generators**: classic graphs, random graphs, etc.
- **Layout**: ForceAtlas2, Noverlap, etc.
- **Metrics**: density, centrality, etc.
- **Traversal**: DFS, BFS, etc.

To use the standard library, you need to import the functions from `graphology-library`.

```javascript
import { dfs } from 'graphology-traversal';

dfs(graph, (node, attributes) => {
  console.log(node);
});
```

## Layouts & Dependencies

### Using Bundled Layouts (ForceAtlas2)

When using `graphology-library` via CDN (e.g., unpkg), it often bundles popular layouts like ForceAtlas2. **Do not** try to load `graphology-layout-forceatlas2` separately if you are already loading `graphology-library`, as this can lead to version conflicts or 404 errors if the standalone package doesn't have a UMD build.

**Correct Usage (Browser/CDN):**

```javascript
// graphology-library exports ForceAtlas2 directly as layoutForceAtlas2
if (graphologyLibrary.layoutForceAtlas2) {
  graphologyLibrary.layoutForceAtlas2.assign(graph, {
    iterations: 50,
    settings: { gravity: 1 }
  });
}
```

**Incorrect Usage:**

```javascript
// Avoid assuming global variables from standalone scripts unless verified
forceAtlas2.assign(graph, ...); // Likely undefined
```

### Debugging Globals

If you are unsure where a library is attached in the window object:
1.  Open the browser console.
2.  Inspect the main library object (e.g., `window.graphologyLibrary`).
3.  Check for properties like `layout`, `layoutForceAtlas2`, etc.

### UMD Library Structure (v0.8.0)

When using `graphology-library` in the browser, the exports are structured as follows:

- **Top-level Layouts**: Some layouts are exported directly on the library object.
    - `graphologyLibrary.layoutForceAtlas2`
    - `graphologyLibrary.layoutNoverlap`
- **Nested Layouts**: Other layouts are grouped under the `layout` property.
    - `graphologyLibrary.layout.circular`
    - `graphologyLibrary.layout.random`
    - `graphologyLibrary.layout.circlepack`
- **Algorithms**:
    - `graphologyLibrary.communitiesLouvain`
    - `graphologyLibrary.shortestPath`
    - `graphologyLibrary.metrics`

## Applied Patterns (Best Practices)

### 1. Graph Gardening (Filtering)
**Problem:** Disconnected or "noise" nodes distort force-directed layouts (ForceAtlas2), causing the main component to be squashed.
**Solution:** Filter these nodes out **during ingestion** (Frontend) rather than deleting them from the database. This preserves the "Source of Truth" while ensuring a clean view.

```javascript
const excludedIds = new Set(["term-001", "term-002"]);
// Inside ingestion loop
if (excludedIds.has(row.id)) continue;
```

### 2. Semantic Edge Generation
**Problem:** Knowledge graphs are often too sparse (few edges) to reveal meaningful structure.
**Solution:** Generate "Semantic Edges" by scanning node definitions for keywords from other nodes.
- **Exact Match:** High confidence, low recall.
- **Keyword Match:** Lower confidence, high recall (creates "hairballs" which are good for structural analysis).
- **Stop Words:** Critical to filter out common words ("the", "system") to prevent clique formation.

### 3. Louvain Community Coloring
**Problem:** Louvain community IDs are unstable (arbitrary integers). Assigning colors by ID (`colors[id % length]`) leads to "Color Thrashing" where the main cluster changes color if the graph topology changes slightly.
**Solution:** Assign colors by **Rank** (Size).
1. Calculate community sizes.
2. Sort communities by size (Descending).
3. Assign the first color (e.g., Red) to the largest group, second (Orange) to the second largest, etc.

```javascript
// Rank-based coloring
const counts = {};
communities.forEach(id => counts[id] = (counts[id] || 0) + 1);
const sortedGroups = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
const rankMap = {};
sortedGroups.forEach((id, index) => rankMap[id] = index);

// Assign color
// Assign color
const color = palette[rankMap[communityId] % palette.length];
```

### 4. Louvain Resolution Tuning
**Problem:** The default Louvain resolution (1.0) often produces too few or too many communities for human cognitive processing (Miller's Law: $7 \pm 2$).
**Solution:** Tune the `resolution` parameter to target the "Sweet Spot" (5-9 communities).
- **Resolution < 1.0:** Larger, fewer communities (Macro View).
- **Resolution > 1.0:** Smaller, more numerous communities (Micro View).
- **Strategy:** Do not expose this to the user. Find the value that works for your specific dataset density and lock it in.

```javascript
// Example: Bumping resolution to 1.1 to increase community count from 4 to ~7
const communities = graphologyLibrary.communitiesLouvain(graph, { 
    resolution: 1.1 
});
```

### 5. Deterministic Layouts
**Problem:** Force-directed layouts (ForceAtlas2) and Community Detection (Louvain) are sensitive to initial conditions. Random initial positions (`Math.random()`) cause the graph to "shape-shift" and communities to swap colors on every reload.
**Solution:** Initialize node positions using a **deterministic hash** of the Node ID.

```javascript
// Deterministic Randomness
const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return (Math.abs(h) % 1000) / 10;
};
graph.addNode(id, { x: hash(id + 'x'), y: hash(id + 'y') });
```
