# 1. Prior Art & Inspiration

What you are describing is a hybrid of **Kanban Boards** and **Digital Magazine** layouts.

* **Windows 8 "Metro" Start Screen:** Perhaps the most famous example of a horizontal-scrolling, card-based grid. It grouped apps into columns that flowed horizontally.
* **Trello / Kanban Boards:** These use horizontal scrolling with vertical stacks of cards. However, your requirement differs because you likely want the cards to flow naturally into new columns based on available height, rather than manually placing cards into specific columns.
* **Flipboard (Web & Tablet):** Flipboard’s layout engine dynamically sizes content to fit a "page" (screen size), often utilizing multi-column newspaper layouts that you swipe (scroll) through horizontally.
* **Pinterest (Horizontal variant):** While Pinterest is famous for vertical masonry, the underlying logic (packing items of variable height into columns) is similar, just rotated 90 degrees.

---

## 2. The DOM Strategy: Grouping the Bento Cards

Since standard Markdown produces a flat list of elements (H2, P, UL, H2, P...), you cannot style them as cards directly. You must use your AST parser (or a post-processing step after `marked`) to "group" the content.

**The Transformation:**
You need to iterate through the tokens. Every time you hit an `<h2>`, you close the previous `<section class="bento-card">` and open a new one.

**Input:**

```markdown
## Section 1
Content...
## Section 2
Content...

```

**Output Structure:**

```html
<article class="horizontal-container">
  <section class="bento-card">
    <h2>Section 1</h2>
    <p>Content...</p>
  </section>
  <section class="bento-card">
    <h2>Section 2</h2>
    <p>Content...</p>
  </section>
</article>

```

---

## 3. CSS Layout Patterns

There are three primary ways to achieve the "Horizontal Newspaper" look. The **Multi-Column** approach is likely your best fit.

### Option A: CSS Multi-Column Layout (The "True Newspaper")

This is the most semantic and "browser-native" way to create a newspaper layout. You define a column width, and the browser automatically flows your cards into as many columns as needed, extending to the right.

* **How it works:** You set the container to have a fixed height (derived from the viewport) and define `column-width`. The content flows down, hits the bottom, and wraps to a new column on the right.
* **Pros:** Handles content reordering naturally. If a card is too tall, it pushes others to the next column.
* **Cons:** Horizontal scrolling with CSS columns can sometimes behave oddly with browser trackpads (though `overflow-x: auto` usually fixes this).

```css
.horizontal-container {
  /* 1. Constraint: The container needs a defined height to force wrapping */
  height: calc(100vh - 100px); /* Adjust for headers/padding */
  
  /* 2. The Newspaper Magic */
  column-width: 320px; /* Or whatever your desired card width is */
  column-gap: 20px;
  column-fill: auto; /* Crucial: Fills columns sequentially rather than balancing them */
  
  /* 3. Scrolling */
  overflow-y: hidden;
  overflow-x: auto;
}

.bento-card {
  /* 4. Prevent cards from being sliced in half by a column break */
  break-inside: avoid; 
  page-break-inside: avoid; /* Legacy support */
  
  background: white;
  margin-bottom: 20px; /* Space between cards in the same vertical column */
  border: 1px solid #ddd;
  border-radius: 8px;
}

```

### Option B: Flexbox Column Wrap

If you want strict control over the cards and ensure they never try to split, Flexbox is a robust alternative.

* **How it works:** Set the direction to column and tell it to wrap.
* **Pros:** extremely predictable card rendering.
* **Cons:** The reading order is Top-Down, *then* Left-Right. If a user is on a wide monitor, they might see Card 1, Card 2 (below it), Card 3 (below that). If they are strictly reading chronologically, this is fine. If they expect a "Slide" show (Left to Right), this is wrong.

```css
.horizontal-container {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  height: calc(100vh - 100px);
  overflow-x: auto;
  overflow-y: hidden;
  gap: 20px;
}

.bento-card {
  width: 320px; /* Fixed width is usually required here */
  /* No break-inside needed, flex items don't break */
}

```

### Option C: CSS Grid (Masonry / Auto-Flow)

Standard CSS Grid is difficult for this because `grid-template-rows` usually requires defined heights, which you don't have (your markdown content varies).

* **Note:** There is a future CSS spec called "Grid Layout Masonry" (`grid-template-rows: masonry`), but it is not yet supported in major browsers. **Avoid this for production right now.**

---

## 4. Integration with Layout (Sidebars)

Since you have a layout with a Main Middle + Two Sidebars, the horizontal scrolling of the middle section must not break the page.

**The Layout Structure:**
You should likely use CSS Grid for the macro page layout to ensure the middle section captures the viewport height correctly.

```css
body {
  display: grid;
  /* Sidebar | Content | TOC */
  grid-template-columns: auto 1fr auto; 
  height: 100vh;
  overflow: hidden; /* Prevent body scroll */
}

main {
  /* This is the middle section */
  overflow: hidden; /* Let the inner container handle the scroll */
  position: relative;
}

.horizontal-container {
  /* As defined in Option A above */
  height: 100%; 
  overflow-x: auto;
}

```

## Summary of Recommendations

1. **Parser:** Use a post-processor on your AST to wrap `h2` + content into `<div class="card">` elements.
2. **Layout:** Use **Option A (CSS Multi-Column)**. It is the only method that truly replicates the "Newspaper" flow where text/cards fill a vertical space and then move right, without requiring rigid geometry.
3. **Safety:** Ensure you add `break-inside: avoid` to your card class so the browser doesn't chop a card in half at the bottom of the screen.

## Usage

To view the Bento Layout experiment:

1. Open `index.html` in your browser.
2. The page loads the raw markdown from the playbook.
3. Client-side JavaScript parses it and groups content into "Bento Cards" (H2 + following content).
4. The CSS Multi-column layout automatically flows these cards horizontally.

