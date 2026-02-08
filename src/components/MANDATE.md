This `COMPLIANCE.md` is the final governor for the system. It is designed to be the first file an AI Agent reads before touching the codebase. It codifies the "Brutalisimo" philosophy into a set of non-negotiable laws that prevent the "bull in a china shop" effect by replacing creative freedom with structural necessity.

---

# 🛡️ BRUTALISIMO COMPLIANCE: RULES OF ENGAGEMENT

## 1. THE DATA BOUNCER (LOGIC)

We do not "try-catch" our way through messy data. We segregate and bounce.

* **The `to()` Monad:** Every async operation MUST use the `[err, data] = await to(fn)` pattern.
* **Idempotent Hashing:** Use `Bun.hash()` on key-sorted JSON to generate deterministic IDs.
* **Segregation:** Malformed data is immediately logged to `.exceptions.jsonl` and excluded from the primary render path.

## 2. THE TYPOGRAPHIC SUBSTRATE (LAYOUT)

The UI is a fixed-grid coordinate system. Fluidity is a bug.

* **Unit Lockdown:** Use **`ch`** for horizontal and **`lh`** (1.5rem) for vertical. Percentages, `px`, and `auto` heights are forbidden.
* **Height Law:** Every block must use `height: fit-content` and `min-height: 0` to ensure physical density.
* **Semantic Shell:** Use standard landmark tags (`<header>`, `<main>`, `<footer>`, `<article>`, `<nav>`).

## 3. IDENTITY & MACHINE INTERFACE (AGENT-READY)

The UI is a machine-readable API. Visuals are secondary to semantics.

* **ID Prefixing:** All IDs must follow the `[type]_[hash]` pattern (e.g., `block_8f2a`, `btn_f231`).
* **ARIA State:** Mirror every visual state with ARIA. Use `aria-expanded`, `aria-busy`, and `aria-controls` to describe the "Iron Core" of the UI.
* **Landmarks:** One `role="main"` and one `role="status"` per page for programmatic anchoring.

## 4. TAILWIND V4 & ATTRIBUTE STYLING (CSS)

We do not use "Class Soup." We style based on the identity of the data.

* **Attribute Targeting:** Apply styles to `data-component` and `aria-*` attributes using `@apply` in the CSS substrate.
* **Softened OKLCH:** Use the IDE-softened palette. Avoid pure black/white to prevent visual halation.
* **Native Nesting:** Scope all sub-element styles using CSS nesting (`&`) within the component block.

---

### AGENT INSTRUCTION: THE "CHINA SHOP" CLAUSE

> If you find yourself writing a complex JavaScript function to handle a visual toggle, you have failed. Use the native `<details>` and `<summary>` disclosure pattern instead. If you are tempted to use a percentage for width, you are in the wrong coordinate system. Revert to `ch`.

---

### Next Step

With the **Compliance Bouncer** now in place, your engine is fully guarded against regression. Would you like me to generate the **`uno.config.ts`** equivalent for **Tailwind v4** (the `tailwind.css` theme block) that enforces these OKLCH and unit variables as the global system defaults?