# Project Brief: Internal Navigation (Cross-Linking)

**Objective:**
Enable "Wiki-style" navigation within the Knowledge Graph by automatically detecting node IDs (e.g., `OH-104`, `COG-5`) in node descriptions and converting them into clickable links that navigate the graph to that node.

**Constraint Checklist:**
*   **No Schema Changes:** This is a UI-only transformation.
*   **Pattern Matching:** Must robustly detect IDs without false positives.
*   **Interaction:** Clicking a link must behave exactly like clicking the node itself (Select, Pan, Show Details).

---

## 1. The "Linkifier" Logic

**File:** `public/sigma-explorer/index.html` (Alpine Component)

We need a utility function to parse text and inject HTML links.

**Regex Strategy:**
We can match the project's standard ID formats.
*   *Pattern:* `/\b([A-Z]{2,}-\d+)\b/g` (Matches `OH-104`, `COG-5`)
*   *Pattern:* `/\b(term-\d+)\b/g` (Matches `term-001`)

**Transformation:**
1.  Find matches for ID patterns.
2.  **Validation:** Check `graph.hasNode(id)`. If false, return original text (do not linkify).
3.  **Replacement:** If true, replace with `<a href="#" class="internal-link" data-node-id="$1">$1</a>`.

## 2. Event Delegation

Since the content is injected dynamically via `x-html`, we cannot easily bind `@click` to individual links. We will use **Event Delegation**.

**Implementation:**
1.  Add `@click` handler to the parent container (the Node Details div).
2.  Check if `event.target` matches `.internal-link`.
3.  If yes:
    *   `event.preventDefault()`
    *   Extract `data-node-id`.
    *   Call `selectNode(id)`.

## 3. Visual Cues

**File:** `public/css/style.css`

*   **Style:** distinct from external links. Maybe a dotted underline or a specific color (e.g., Blue vs Black).
*   **Hover:** Highlight the link.

## 4. Definition of Done
1.  **Auto-Linking:** Any text in a node definition matching a Node ID is rendered as a link.
2.  **Navigation:** Clicking the link selects the target node and updates the view.
3.  **Robustness:** Invalid IDs (nodes that don't exist) should either not be linked or handle the click gracefully (e.g., "Node not found" toast).
