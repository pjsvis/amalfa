# Project Brief: Documentation Layout Upgrade

**Objective:**
To refactor the `docs/` layout into a **"Tri-Pane Structural Grid"** that supports academic-style "Marginalia" (Sidenotes) without introducing heavy dependencies like `tufte-css`.

**Core Philosophy:**
* **Bifurcated Mentation:** Separate the "Signal" (Main Text) from the "Meta-Signal" (Context/Origins) spatially.
* **Structural Brutalism:** Reject the "Book" metaphor (serifs, cream paper) in favor of the "Terminal" metaphor (mono fonts, borders, white/gray).
* **Optimal Simplicity:** Implement complex layout features using standard CSS Grid and Tailwind utilities.

---

### 1. Technical Constraints

* **No New Dependencies:** Do NOT install `tufte-css` or `open-props`. Use existing Tailwind classes and manual CSS variables if absolutely necessary.
* **Responsive Integrity:** Sidenotes must sit in the right margin on Desktop (>1280px) but collapse inline or strictly below paragraphs on Mobile.
* **Factored Design:** The "Sidenote" logic must be a reusable utility class.

---

### 2. Implementation Plan

****Step A: The Tri-Pane Grid (Layout Refactor)****
Refactor `public/docs/index.html` to use a Fixed-Viewport Grid.

**Target Behavior:**
* **Global Scroll:** Disabled (`body { overflow: hidden }`).
* **Sidebar Scroll:** Independent.
* **Content Scroll:** Independent.

**Implementation:**
```html
<div class="grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-8 max-w-[1600px] mx-auto p-8 h-[calc(100vh-100px)]">
  
  <aside class="overflow-y-auto h-full custom-scrollbar">
    ...
  </aside> 
  
  <main class="prose max-w-[65ch] relative overflow-y-auto h-full custom-scrollbar px-6">
    ...
  </main> 
  
  <div class="hidden lg:block h-full"></div> 
</div>

**Target Grid Structure (Desktop):**
`[ Sidebar (250px) ]  [ Content (65ch) ]  [ Margin (1fr) ]`

**Implementation:**
```html
<div class="grid grid-cols-1 lg:grid-cols-[250px_1fr_300px] gap-8 max-w-[1600px] mx-auto p-8">
  <aside>...</aside> <main class="prose max-w-[65ch] relative">...</main> <div class="hidden lg:block"></div> </div>