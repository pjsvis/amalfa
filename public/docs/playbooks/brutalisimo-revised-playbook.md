This is the **Canonical Playbook** for the "Brutal Substrate." It represents the final synthesis of our engineering philosophy: a system where units are character-locked, data is bouncer-filtered, and styles are server-side generated.

---

# 🏗️ THE BRUTAL SUBSTRATE: CANONICAL PLAYBOOK

## 1. DATA INTEGRITY: THE BOUNCER PATTERN

We treat the ingestion pipeline as a mechanical sorting machine. Errors are not "handled"; they are segregated.

* **Runtime:** Bun 1.3.8+ for native performance and sub-millisecond I/O.
* **The `to()` Monad:** All async calls must return a `[error, data]` tuple to eliminate try/catch nesting.
* **Deterministic Hashing:** Use `Bun.hash()` on key-sorted JSON to create immutable block IDs.
* **Zero-Copy I/O:** Use `mmap` via `Bun.file()` for high-throughput log processing.

## 2. THE TYPOGRAPHIC GRID: COORDINATE-BASED LAYOUT

We reject fluid web design. The UI is a character-addressable hardware buffer.

* **Atomic Units:** Use **`ch`** for horizontal and **`lh`** (1.5rem) for vertical. Percentages and `px` are forbidden.
* **Dimension Lockdown:** Every block uses `height: fit-content` and `min-height: 0` to eliminate "auto-size" slack.
* **The Shell:**
* **Header/Footer:** Fixed at `1lh` or `3ch`.
* **Main:** Grid-locked `[45ch | 1fr | 45ch]` for Sidebars and Content.


* **The Disclosure Pattern:** Use native `<details>` and `<summary>` for all collapsible blocks to eliminate JS state.

## 3. COLOR ARCHITECTURE: SOFTENED OKLCH

We use perceptual math to create a "Softened IDE" aesthetic that avoids visual halation.

* **Substrate Colors:**
* `--bg: oklch(0.14 0.01 250)` (Soft Charcoal)
* `--fg: oklch(0.88 0.01 250)` (Eggshell White)
* `--border: oklch(0.32 0.01 250)` (Structural Grey)


* **Pastel ANSI Hues:** Maintain Lightness (`L`) at `0.85` and Chroma (`C`) below `0.08`.
* **Nesting:** All component styles must be nested (`&`) to prevent global CSS pollution.

## 4. SSR ENGINE: HONO + UNOCSS JIT

We generate our CSS on-demand during the Hono SSR lifecycle to achieve a "Zero-Build" DX.

* **Attributify Mode:** Style components using attributes (e.g., `w-40ch`) instead of class strings.
* **JIT Injection:** A Hono middleware scans the JSX output, generates atomic CSS, and injects it into the `<head>`.
* **Markdown:** Render long-form content using native `Bun.Markdown.render`.

---

# 🤖 AGENTS.md (EXTRACT FOR AI SYSTEM PROMPT)

> **ROLE:** You are a Brutal Architect. You build industrial-grade, character-locked terminal interfaces.
> ### THE CONSTRAINTS
> 
> 
> 1. **UNIT LOCK:** You are forbidden from using `px`, `rem` (except for `--lh`), `%`, or `auto` height. Use `ch` and `lh` only.
> 2. **HTML PURITY:** Prioritize semantic tags (`article`, `section`, `details`). Do not use `div` for everything.
> 3. **NO JS STATE:** If you need to toggle a block, use the native `<details>` element.
> 4. **DETERMINISTIC IDs:** Every block must have an ID: `id="b-[content-hash]"`.
> 5. **NESTED CSS:** All overrides must be scoped using native CSS nesting.
> 6. **BOUNCER FIRST:** If input data is malformed, log it to `.exceptions.jsonl` and return `null`. Never attempt to "fix" it in the UI.
> 
> 
> ### COMMAND OVERLAY
> 
> 
> Every block must include a `:hover` hint: `agent-browse --target #[id]`.

---

### Opinion: The Final Verdict

By pillaging **UnoCSS** for its engine and **MVP.css** for its semantic purity, we have built a system that is faster than the "modern" web but as robust as a 1970s mainframe. It is a "Fixed-Gear" environment where the AI cannot break the layout because the layout is made of iron.

**The Substrate is complete.** Would you like me to initialize a new Bun project with this exact folder structure and the `TerminalEngine` middleware ready for your first data module?