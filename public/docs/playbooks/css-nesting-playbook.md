# PolyVis: CSS Nesting Playbook & Operational Standards

**Status:** Draft | **Context:** PolyVis UI Implementation
**Based on:** Native CSS Spec & [Kevin Powell Analysis: Analysis-Powell-Nesting-001]
**Philosophy:** Pragmatic utility over dogmatic purity.

---

## 1. Core Philosophy: "Locality of Behavior"
We adopt CSS nesting primarily to enforce **OH-040: Principle of Factored Design**. All logic related to a component—including its responsive variations and state changes—should be co-located within its primary selector block.

* **Goal:** Reduce "Cognitive Load" by preventing the scattering of related styles across the stylesheet.
* **Anti-Pattern:** "Jump-scrolling" to find media queries at the bottom of a file.

## 2. The "Killer Feature": Nested Media Queries
This is the single highest-value application of nesting for this project.

* **Directive:** All media queries affecting a specific component **must** be nested directly within that component's block.
* **Why:** It keeps the component's "responsive story" intact and readable.
* **Note:** Ignore concerns about output repetition; Gzip/Brotli handles the redundancy trivially.

**Example:**
```css
.card {
  font-size: 1rem;

  /* YES: Co-located logic */
  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
}
````

## 3\. The Specificity "Cognitive Hazard" (The `&` Trap)

Native CSS nesting is **not** a string pre-processor (like Sass). The `&` selector functions internally as `:is()`, which flattens specificity to the *most specific* selector in the list.

  * **Hazard:** Unexpected "Specificity Inflation."
  * **Rule:** Avoid nesting ID selectors or high-specificity utility classes inside component blocks unless absolutely necessary.
  * **Constraint:** If using the `&` to attach a parent context, be aware that the specificity of that context leaks into the nested rules.

## 4\. BEM & The String Concatenation Ban

Native CSS **cannot** do string concatenation. The classic Sass pattern of `&__element` is technically impossible in native CSS.

  * **Directive:** Do not attempt BEM-style suffixing (e.g., `.block { &__element { ... } }`). It will fail or produce invalid selectors.
  * **The Pivot:** We accept **Descendant Selectors** as a valid, pragmatic alternative to strict BEM classing.

**Permitted Pattern (Contextual Descendants):**

```css
/* ACCEPTABLE in PolyVis */
.card {
  /* Targeting the semantic tag directly within context */
  img {
    border-radius: 8px;
  }
  
  /* OR using a full class name if specific overrides are needed */
  .card-title {
    font-weight: bold;
  }
}
```

## 5\. Depth Control: The "Inception" Limit

Nesting invites complexity. To prevent "Complexity Collapse," we enforce a strict depth limit.

  * **Hard Limit:** Maximum **3 levels** of nesting.
  * **Heuristic:** If you need to nest deeper than 3 levels, your HTML structure is likely too complex, or you should break the styles into a new top-level component.
  * **Exception:** Pseudo-classes (`:hover`, `:focus-visible`) do not count towards this limit if they are the leaf nodes.

## 6\. Syntax Standards

  * **Pseudo-classes:** Must always use the ampersand `&` for clarity and technical correctness (e.g., `&:hover`).
  * **Combinators:** The ampersand is optional for combinators (e.g., `+ img` works without `&`), but we prefer explicit usage if it improves readability.

