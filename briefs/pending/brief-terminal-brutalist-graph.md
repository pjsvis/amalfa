Here is the visual logic for distinguishing **Hollow Nodes** (Metadata) from **Full Nodes** (Content) using the Terminal-Brutalist design system.

The core metaphor is **Density**.

* **Hollow Node:** A "wireframe" container. It has structure (borders) but no mass (transparent background).
* **Full Node:** A "solid" block. It has mass (filled background).
* **The Agent:** The force that fills the void (Orange).

### The Visual Logic

#### 1. Graph Rendering (Sigma.js)

We distinguish nodes on the canvas by their "fill" state.

| State | Visual Representation | CSS/Sigma Rule |
| --- | --- | --- |
| **Hollow Node** (Default) | **The Ring.** A white circle outline with a black center. Represents a pointer to a file, not the file itself. | `color: var(--ansi-black)`, `borderColor: var(--ansi-white)`, `borderSize: 2` |
| **Full Node** (Loaded/Cached) | **The Solid.** A solid white circle. Represents that the heavy content has been read into memory (JIT). | `color: var(--ansi-bright-white)` |
| **Ingesting / Pending** | **The Pulse.** A hollow ring with an Orange border. The Agent is currently reading or vectorizing this node. | `borderColor: var(--ansi-orange)` |
| **Error / Missing** | **The Void.** A hollow ring with a Red border and a diagonal strike-through (if supported) or just Red. | `borderColor: var(--ansi-red)` |

#### 2. The "Quick Look" UI Panel

When a user clicks a node, the inspector panel reflects its state.

* **Hollow State (Metadata View):**
* **Appearance:** Black Background (`#0C0C0C`), White Border.
* **Content:** Displays *only* the metadata fields in a monospace list (Path, Size, Last Modified, UUID).
* **Vibe:** "This is the index card."


* **Full State (Content View):**
* **Appearance:** The panel **Inverts**. White Background (`#CCCCCC`), Black Text (`#0C0C0C`).
* **Content:** Displays the rendered Markdown/Code.
* **Vibe:** "This is the document."
* *Why invert?* It creates a shocking, high-contrast confirmation that data has been retrieved. It mimics a printed page or a terminal cursor block.



---

### Agent Brief: Implementing "Hollow vs. Solid"

Copy this brief to instruct the coding agent on how to implement this state visualization.

---

# Agent Task: Visualizing "Hollow" vs "Full" Node States

**Context:**
We need to visually distinguish between "Hollow Nodes" (metadata only, lightweight) and "Full Nodes" (content loaded JIT) in both the Graph Renderer (`sigma.js`) and the DOM UI ("Quick Look" Panel).

**Directives:**

1. **Sigma.js Node Rendering:**
* Override the default node reducer.
* **If `node.content == null` (Hollow):**
* Render as a **Ring/Outline**.
* Fill Color: `var(--ansi-black)` (matches canvas background).
* Border Color: `var(--ansi-white)`.


* **If `node.content != null` (Full):**
* Render as a **Solid Circle**.
* Fill Color: `var(--ansi-bright-white)`.


* **If `node.status == 'ingesting'`:**
* Border Color: `var(--ansi-orange)` (The Agent Color).




2. **UI Panel ("Quick Look") Logic:**
* Create a CSS class `.panel-hollow` and `.panel-full`.
* **`.panel-hollow`:**
* `background-color: var(--bg-panel);` (Black)
* `color: var(--text-primary);` (White)
* `border: var(--border-default);` (White border)


* **`.panel-full`:**
* **INVERTED THEME.**
* `background-color: var(--ansi-white);` (Grey/White)
* `color: var(--ansi-black);` (Black text)
* `border: 2px solid var(--ansi-bright-white);`




3. **Transition Effect:**
* When the user clicks a Hollow Node, the panel opens in `.panel-hollow` mode showing metadata.
* Trigger the `read_node_content` tool.
* Upon data return, **snap** the panel to `.panel-full` mode. **Do not fade.** The transition should be instant (Brutalist).



---

### Summary

This system gives you immediate visual feedback on the system's "memory":

* **Dark UI** = You are browsing the map (Hollow).
* **Bright UI** = You are reading the territory (Full).
* **Orange Blips** = The Agent is working.