# Agent Task: Implement "Slab & Grid" Layout Prototype

**Context:**
We are implementing the "Holy Grail" application shell for **PolyVis**. The goal is a strict "Viewport Lock" layout that never scrolls the body, only specific internal panels.

**Task:**
Create a standalone file `layout-test.html` that demonstrates the **3-Slab Flex + CSS Grid** architecture.

**Design System constraints:**

* Use the **Terminal Brutalist** palette (High Contrast).
* **No Border Radius**.
* **Thick Borders** (2px).
* **Monospace Fonts**.

**Technical Specifications:**

1. **The Shell (Body):**
* Display: `flex` (Column direction).
* Height: `100vh` (Exact viewport height).
* Width: `100vw`.
* Overflow: `hidden` (Global scroll lock).
* Background: `#0C0C0C` (ANSI Black).
* Color: `#CCCCCC` (ANSI White).


2. **Slab 1: The Header:**
* Height: `60px` (Fixed).
* Border-Bottom: `2px solid #FFFFFF`.
* Flex-Shrink: `0` (Must not compress).


3. **Slab 2: The Main Stage (Grid):**
* Flex-Grow: `1` (Fills remaining vertical space).
* Display: `grid`.
* **Columns:** `250px` (Left Panel) | `1fr` (Canvas) | `350px` (Right Panel).
* *Critical:* Set `min-height: 0` to prevent flex overflow bugs.


4. **Slab 3: The Footer:**
* Height: `40px` (Fixed).
* Border-Top: `2px solid #FFFFFF`.
* Flex-Shrink: `0`.


5. **Internal Scrolling:**
* The **Left Panel** and **Right Panel** must have `overflow-y: auto`.
* Populate them with "Lorem Ipsum" text to prove they scroll independently of the page.
* The **Center Canvas** should have `overflow: hidden` (for Sigma.js later).



**Output:**
Provide the full, single-file HTML code with embedded CSS.

---

### **Why this brief is safe**

I added the `min-height: 0` constraint in **Slab 2**. This is a common "Flexbox gotcha"—without it, the middle slab will often refuse to shrink, breaking your `100vh` lock. This instruction prevents the Agent from falling into a debugging loop.