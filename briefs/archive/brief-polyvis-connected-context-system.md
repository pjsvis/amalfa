# next Task => PCCC

The following brief describes how we can kink our grqph to a summary of groupings and a list of entry (directive and heuristic) descriptions

This brief outlines the architecture for the **Polyvis Connected Context System (PCCS)**. It leverages the "Triad of Context" concept to create a navigable loop between the abstract map, the structural documentation, and the narrative history, utilizing standard web primitives (HTML/CSS/JS) to ensure robustness and ease of navigation.

-----

### **Project Brief: Polyvis Connected Context System (PCCS)**

**Objective:**
To implement a "Deep Linking" architecture that creates a seamless, bidirectional navigation loop between the **Visualizer (Graph)**, **Documentation (Legend)**, and **Narrative List (Origins)**.

**Constraint Checklist:**

  * Stack: Vanilla HTML/CSS/JS (No frameworks).
  * Navigation Principle: Standard `href` anchors and URL parameters.
  * State Management: Browser History API (Back button restores context).
  * mouse right click on node shows detail

-----

### **1. Component Architecture**

The system consists of three distinct views that must speak to each other via URL:

1.  **The Neuro-Map (Visualizer):** The interactive D3/WebGL graph.
2.  **The Codex (Narrative List):** A linear HTML list of heuristics with descriptions and origins (derived from the JSON).
3.  **The Guide (Docs):** High-level explanations of the color-coded clusters (e.g., "Why are these nodes red?").

### **2. Interaction Flows & Technical Implementation**

****Flow A: Graph $\rightarrow$ Narrative (Drill Down)****

  * **User Action:** User clicks a node (e.g., `OH-029`) in the Visualizer.
  * **Technical Logic:**
      * The graph click event listener triggers a standard navigation.
      * `window.location.href = '/codex.html#OH-029';`
  * **Result:** The browser navigates to the Narrative List page and automatically scrolls to the specific entry anchored by `id="OH-029"`.
  * **Back Button Behavior:** Standard browser behavior returns the user to the Visualizer.

****Flow B: Narrative $\rightarrow$ Graph (Contextualize)****

  * **User Action:** User is reading an entry (e.g., `OH-104`) and clicks a "Locate in Map" icon/link.
  * **Technical Logic:**
      * Link target: `<a href="/visualizer.html?focus=OH-104">`.
      * **On Load Script (Visualizer):**
          * Parse `window.location.search` to extract `focus=OH-104`.
          * If parameter exists, invoke the internal graph method (e.g., `graph.centerOnNode('OH-104')`) and trigger the "highlight" visual state.
  * **Result:** The Visualizer loads with the specific node centered and zoomed.

****Flow C: Narrative $\rightarrow$ Docs (Categorical Understanding)****

  * **User Action:** User clicks a category tag in the Narrative List (e.g., "Category: Operational Heuristic").
  * **Technical Logic:**
      * Link target: `<a href="/docs.html#operational-heuristics">`.
  * **Result:** Jumps to the static documentation explaining that specific category.

-----

### **3. Implementation Details (Vanilla JS)**

****A. The Narrative List Generation (Build Time)****

We will use a script (implementing **OH-104**) to generate the HTML from `conceptual-lexicon-ref-v1.79.json`.

  * **Structure:**
    ```html
    <div class="entry" id="OH-029">
      <h3>OH-029: Reggie Perrin Protocol</h3>
      <p class="origin"><strong>Origin:</strong> Named after the 1970s sitcom...</p>
      <p class="desc">The "Clean Slate" mechanism for resetting context...</p>
      <div class="actions">
        <a href="/visualizer.html?focus=OH-029" class="btn-locate">[Target Icon] Locate in Map</a>
      </div>
    </div>
    ```

****B. The Graph "Focus" Handler (Runtime)****

Add this lightweight logic to the Visualizer's initialization script:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get param
    const urlParams = new URLSearchParams(window.location.search);
    const focusTarget = urlParams.get('focus');

    // 2. Initialize Graph
    const myGraph = ForceGraph()(document.getElementById('graph'))
        .graphData(myData);

    // 3. Apply Focus (if requested)
    if (focusTarget) {
        // Wait for engine to warm up or data to load
        setTimeout(() => {
            const node = myData.nodes.find(n => n.id === focusTarget);
            if (node) {
                // Fly camera to node
                myGraph.cameraPosition(
                    { x: node.x, y: node.y, z: 200 }, // Position
                    node, // LookAt
                    2000  // Transition ms
                );
                // Optional: Trigger selection styling
                // highlightNode(node);
            }
        }, 1000);
    }
});
```

### **4. Acceptance Criteria**

1.  **Deep Linking:** Every Heuristic (`OH-XXX`) has a permanent URL in the Narrative List.
2.  **Bidirectional Navigation:** Users can move from Map to Text and Text to Map without losing their place.
3.  **No Framework Overhead:** The solution adds zero npm dependencies; it runs purely on browser standards.
4.  **Context Preservation:** The browser "Back" button functions as a reliable undo for navigation steps.

---

```python?code_reference&code_event_index=2
import os
print(os.listdir())

```

```text?code_stdout&code_event_index=2
[]

```

````python?code_reference&code_event_index=6
content = """# Project Brief: Polyvis Connected Context System (PCCS)

**Objective:**
To implement a "Deep Linking" architecture that creates a seamless, bidirectional navigation loop between the **Visualizer (Graph)**, **Documentation (Legend)**, and **Narrative List (Origins)**.

**Constraint Checklist:**
* Stack: Vanilla HTML/CSS/JS (No frameworks).
* Navigation Principle: Standard `href` anchors and URL parameters.
* State Management: Browser History API (Back button restores context).

---

## 1. Component Architecture

The system consists of three distinct views that must speak to each other via URL:

1.  **The Neuro-Map (Visualizer):** The interactive D3/WebGL graph.
2.  **The Codex (Narrative List):** A linear HTML list of heuristics with descriptions and origins (derived from the JSON).
3.  **The Guide (Docs):** High-level explanations of the color-coded clusters (e.g., "Why are these nodes red?").

## 2. Interaction Flows & Technical Implementation

### Flow A: Graph -> Narrative (Drill Down)
* **User Action:** User clicks a node (e.g., `OH-029`) in the Visualizer.
* **Technical Logic:**
    * The graph click event listener triggers a standard navigation.
    * `window.location.href = '/codex.html#OH-029';`
* **Result:** The browser navigates to the Narrative List page and automatically scrolls to the specific entry anchored by `id="OH-029"`.
* **Back Button Behavior:** Standard browser behavior returns the user to the Visualizer.

### Flow B: Narrative -> Graph (Contextualize)
* **User Action:** User is reading an entry (e.g., `OH-104`) and clicks a "Locate in Map" icon/link.
* **Technical Logic:**
    * Link target: `<a href="/visualizer.html?focus=OH-104">`.
    * **On Load Script (Visualizer):**
        * Parse `window.location.search` to extract `focus=OH-104`.
        * If parameter exists, invoke the internal graph method (e.g., `graph.centerOnNode('OH-104')`) and trigger the "highlight" visual state.
* **Result:** The Visualizer loads with the specific node centered and zoomed.

### Flow C: Narrative -> Docs (Categorical Understanding)
* **User Action:** User clicks a category tag in the Narrative List (e.g., "Category: Operational Heuristic").
* **Technical Logic:**
    * Link target: `<a href="/docs.html#operational-heuristics">`.
* **Result:** Jumps to the static documentation explaining that specific category.

## 3. Implementation Details (Vanilla JS)

### A. The Narrative List Generation (Build Time)
We will use a script (implementing **OH-104**) to generate the HTML from `conceptual-lexicon-ref-v1.79.json`.
* **Structure:**
    ```
```text?code_stdout&code_event_index=6
File created: project_brief_pccs.md

````

[file-tag: code-generated-file-0-1763904651507707545]
html
\<div class="entry" id="OH-029"\>
\<h3\>OH-029: Reggie Perrin Protocol\</h3\>
\<p class="origin"\>\<strong\>Origin:\</strong\> Named after the 1970s sitcom...\</p\>
\<p class="desc"\>The "Clean Slate" mechanism for resetting context...\</p\>
\<div class="actions"\>
\<a href="/visualizer.html?focus=OH-029" class="btn-locate"\>[Target Icon] Locate in Map\</a\>
\</div\>
\</div\>
\`\`\`

### B. The Graph "Focus" Handler (Runtime)

Add this lightweight logic to the Visualizer's initialization script:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 1. Get param
    const urlParams = new URLSearchParams(window.location.search);
    const focusTarget = urlParams.get('focus');

    // 2. Initialize Graph
    const myGraph = ForceGraph()(document.getElementById('graph'))
        .graphData(myData);

    // 3. Apply Focus (if requested)
    if (focusTarget) {
        // Wait for engine to warm up or data to load
        setTimeout(() => {
            const node = myData.nodes.find(n => n.id === focusTarget);
            if (node) {
                // Fly camera to node
                myGraph.cameraPosition(
                    { x: node.x, y: node.y, z: 200 }, // Position
                    node, // LookAt
                    2000  // Transition ms
                );
                // Optional: Trigger selection styling
                // highlightNode(node);
            }
        }, 1000);
    }
});
```

## 4\. Acceptance Criteria

1.  **Deep Linking:** Every Heuristic (`OH-XXX`) has a permanent URL in the Narrative List.
2.  **Bidirectional Navigation:** Users can move from Map to Text and Text to Map without losing their place.
3.  **No Framework Overhead:** The solution adds zero npm dependencies; it runs purely on browser standards.
4.  **Context Preservation:** The browser "Back" button functions as a reliable undo for navigation steps.

-----

## Addendum A: Layout & State Architecture

**Date:** 2025-11-23
**Reference:** `OH-041: Principle of Optimal Simplicity`

## 1\. Viewport Layout Strategy (The "Expando" Model)

To maintain context without page reloads, the application will utilize a **Fixed-Viewport CSS Grid** layout.

  * **Global Container:** The `<body>` will be fixed height (`100vh`) with `overflow: hidden`.
  * **Header:** A fixed-height top bar (60px) for global navigation and settings.
  * **Main Stage (The Expando):** The remaining viewport height is dedicated to a flexible container housing three components:
    1.  **Left Sidebar (Narrative):** Auto-width, hidden by default. Contains the "Codex" (Narrative List).
    2.  **Center Stage (Visualizer):** Flexible width (`1fr`). Contains the WebGL/D3 canvas. This element **never unmounts**; it merely resizes.
    3.  **Right Sidebar (Docs):** Auto-width, hidden by default. Contains the "Guide" (Documentation).
  * **Scrolling:** Scrolling is explicitly contained *within* the individual sidebars. The main window never scrolls.

## 2\. The "Single-Page" Navigation Model

The application acts as a conceptual Single Page Application (SPA) using Vanilla JS.

  * **Mutually Exclusive Sidebars:** Only one sidebar may be active (`.is-open`) at a time. Opening the *Narrative* implies closing the *Docs*, and vice versa, to maximize the *Visualizer* area.
  * **DOM Persistence:** When a user "navigates" to a textual resource, the Graph is **not destroyed**. It is obscured or resized, preserving its internal simulation state (physics, node positions).

## 3\. State Management Hierarchy

We reject the use of the SQLite database for transient UI state. Instead, we implement a layered approach prioritizing browser standards:

| State Type | Storage Mechanism | Life-Cycle Behavior | Implementation Logic |
| :--- | :--- | :--- | :--- |
| **Transient UI** | **URL Query Params** | Persists during navigation; sharable. | `?view=narrative&target=OH-029` drives the visibility of sidebars. |
| **View Geometry** | **sessionStorage** | Persists on Page Refresh (F5). | Graph coordinates (x,y,z, zoom) are saved on `mouseup`/interaction end. |
| **User Prefs** | **localStorage** | Persists Indefinitely. | Theme (Dark/Light), Accessibility settings. |
| **Knowledge** | **SQLite / JSON** | Read-Only / Immutable. | The core graph data and text content. |

## 4\. Implementation Directives

  * **History API:** Use `window.history.pushState()` to update the URL when sidebars open/close without triggering a page reload.
  * **Event Listeners:** A global `popstate` event listener must be implemented to handle the Browser "Back" button, ensuring it correctly toggles the sidebars to the previous state.
  * **Initialization:** On `DOMContentLoaded`, a router function must parse the current URL parameters to restore the correct UI state (e.g., if the user loads a link sent by a colleague).
    """

with open('project\_brief\_pccs.md', 'w') as f:
f.write(content)

print("File created: project\_brief\_pccs.md")

```
The **Master Brief** has been updated and consolidated. I have generated a new artifact, `project_brief_pccs.md`, which integrates the original Deep Linking architecture with the new **Addendum A: Layout & State Architecture**.

This document now serves as the single source of truth for the **Polyvis Connected Context System**.

**Action Taken:**
* **Created File:** `project_brief_pccs.md`
* **Content:** Merged the original "Deep Linking" brief with the "Addendum A" (Expando Layout & State Management).

You may now persist this file to the repository.
```