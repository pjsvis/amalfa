# Project Brief: Polyvis Documentation Viewer (v2)

**Objective:** Build a responsive, 3-panel documentation viewer using Alpine.js. The interface uses a "Sliding Window" mechanic with a **Max-2 Panels Visible** rule. It features "Macro-Navigation" (File Switching) and "Micro-Navigation" (Table of Contents) in the Left Panel.

**Tech Stack:**

  * **Logic:** Alpine.js (State Management, Event Delegation).
  * **Content:** Markdown (Rendered via `marked.js` or similar).
  * **Data:** Flat JSON Index + Local Markdown Files.

-----

## 1\. Data Structure (`index.json`)

The application is driven by a single flat JSON index located in the root.

```json
[
  {
    "description": "System Architecture",
    "filename": "01_arch.md"
  },
  {
    "description": "Data Flow",
    "filename": "02_data.md"
  }
]
```

-----

## 2\. Interface Layout & Logic (The "Sliding Window")

**Constraint:** Only 2 panels are visible at any time on Desktop.

### State A: Browse Mode (Default)

  * **Visible:** `[ Left Panel ]` + `[ Middle Panel ]`
  * **Left Panel (The Navigator):**
      * Contains two tabs: **Index** (File List) and **Outline** (Table of Contents).
      * **Index Tab:** Lists documents from `index.json`. Clicking loads the file.
      * **Outline Tab:** Lists H2/H3 headers of the *current* document. Clicking scrolls to the section.
  * **Middle Panel (The Reader):** Displays the rendered Markdown.

### State B: Reference Mode (Deep Dive)

  * **Visible:** `[ Middle Panel ]` + `[ Right Panel ]`
  * **Trigger:** User clicks an *internal link* inside the Middle Panel content.
  * **Action:**
    1.  Left Panel (Index/Outline) folds away (hidden).
    2.  Right Panel (Reference) opens and renders the target file.
    3.  **Middle Panel Header:** A "Back" button appears.

### State Transition: "Back" Logic

  * **Trigger:** User clicks "Back" (only visible in State B).
  * **Action:**
    1.  Right Panel closes.
    2.  Left Panel reappears (restoring the previously active Tab).
    3.  Mode reverts to State A.

-----

## 3\. Alpine.js Store / Data Model

```javascript
Alpine.data('polyvis', () => ({
    docs: [],           // File list
    toc: [],            // Table of Contents: [{ text, id, level }]
    
    viewMode: 'browse', // 'browse' (L+M) | 'reference' (M+R)
    navTab: 'files',    // 'files' | 'outline' (Left Panel state)

    contentMain: '',    
    contentRef: '',
    
    async init() {
        this.docs = await (await fetch('index.json')).json();
        // Optional: Load first doc automatically
    },

    // Action: Load Main Document
    async loadMain(filename) {
        const raw = await (await fetch(filename)).text();
        
        // 1. Parse Markdown (Ensure headers get IDs)
        // Note: Configure parser to auto-slugify IDs (e.g. #My Header -> id="my-header")
        this.contentMain = parseMarkdown(raw); 
        
        // 2. Generate ToC
        this.generateToC(); 

        // 3. Reset View
        this.viewMode = 'browse'; 
        this.navTab = 'outline'; // Optional: Auto-switch to outline on load?
        window.scrollTo(0,0);
    },

    // Internal: Generate Table of Contents
    generateToC() {
        // Wait for DOM update, then scan contentMain container
        this.$nextTick(() => {
            const container = document.querySelector('#main-content'); // Selector ID
            const headers = container.querySelectorAll('h2, h3');
            this.toc = Array.from(headers).map(h => ({
                text: h.innerText,
                id: h.id,
                level: parseInt(h.tagName.substring(1))
            }));
        });
    },

    // Action: Load Reference (Right Panel)
    async loadRef(filename) {
        const raw = await (await fetch(filename)).text();
        this.contentRef = parseMarkdown(raw);
        this.viewMode = 'reference'; // Triggers UI slide
    },

    // Action: Back Button
    goBack() {
        this.viewMode = 'browse';
        this.contentRef = ''; 
    }
}))
```

-----

## 4\. Link Handling (Event Delegation)

**Requirement:** Intercept clicks in the Middle Panel to handle internal routing.

1.  Attach `@click="handleContentClick($event)"` to the Middle Panel container.
2.  **Intercept:** `event.preventDefault()` for `<a>` tags.
3.  **Route:**
      * **Internal Match (in `docs`):** Call `loadRef(href)`.
      * **Anchor Match (starts with `#`):** Allow smooth scroll (standard behavior).
      * **External:** `window.open(href, '_blank')`.

-----

## 5\. Implementation Checklist

1.  [ ] **Markdown Config:** Ensure the parser (e.g., `marked`) is configured to add `id` attributes to headers (`#header-slug`).
2.  [ ] **Left Panel UI:** Implement the Tab interface (Files vs. Outline).
3.  [ ] **ToC Logic:** Implement the extraction of H2/H3 tags into the `toc` array.
4.  [ ] **Scrolling:** Ensure clicking a ToC item scrolls the Middle Panel to the correct ID.
5.  [ ] **State Check:** Verify that opening a Reference (Right Panel) hides the ToC (Left Panel), and "Back" restores it.