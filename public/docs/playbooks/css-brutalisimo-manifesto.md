This is the **Master Context**. It is designed to be pinned to your AI Agent’s memory or prepended to every prompt. It defines a rigid, "Brutal" architecture that treats code like an industrial machine and UI like a character-addressable hardware buffer.

---

# 📜 THE BRUTAL ENGINE: MASTER MANIFESTO

## 1. THE DATA INGESTION CORE (BUN + TYPESCRIPT)

We do not "handle" errors; we segregate data. We prioritize mechanical sympathy and raw throughput.

### The Constraint-Stack:

* **Runtime:** Use **Bun 1.3.8+**. Favor native APIs (`Bun.serve`, `Bun.file`, `Bun.hash`) over Node.js polyfills.
* **The Monad:** Every async or risky call MUST be wrapped in the `to()` wrapper.
* `const [err, data] = await to(operation());`


* **The Bouncer Pattern:** Use early returns with empty arrays or nulls. Avoid `if/else` nesting.
* **State:** Use `mmap` for zero-copy I/O. The system must be stateless and idempotent.
* **Hashing:** Every record is hashed using `Bun.hash()` based on **alphabetically key-sorted** JSON to ensure stable IDs.

---

## 2. THE TERMINAL UI SUBSTRATE (HONO + SSR)

The UI is a fixed coordinate system. We reject "fluid" web design in favor of "Brutalist" terminal integrity.

### The Constraint-Stack:

* **Framework:** **Hono SSR (JSX)** only. No client-side React. No hydration.
* **Unit Supremacy:** Use only `ch` (width) and `lh` (line-height/1.5rem). Never use `%` or `vh/vw` for component sizing.
* **Scrolling:** `body { overflow: hidden; }`. Only specific containers (`.sidebar`, `.content-area`) may have `overflow-y: auto`.
* **Markdown:** Use **Bun's native Markdown SSR** (`Bun.Markdown.render`). No external libraries.

### CSS-Brutalisimo Playbook:

* **Grid Layout:** Use `grid-template-rows: var(--lh) 1fr var(--lh)` for the Header-Main-Footer shell.
* **The 3-Column Main:** `grid-template-columns: 45ch 1fr 45ch`.
* **Block Sizing:** * `.block`: Standard (max `40ch` x `25lh`).
* `.block-long`: Content-heavy (max `60ch`).


* **Chunking:** Every `h2` and `h3` inside a block must trigger a horizontal separator via `::after` pseudo-elements.

---

## 3. THE OKLCH COLOR PALETTE (IDE-SOFTENED)

We avoid high-contrast halation. We use perceptual color math for a "Softened Terminal" feel.

### The Constraint-Stack:

* **Base:**
* `--bg: oklch(0.14 0.01 250);` (Soft Charcoal)
* `--fg: oklch(0.88 0.01 250);` (Eggshell White)
* `--border: oklch(0.32 0.01 250);` (Structural Grey)


* **Pastels:** * `L` must be between `0.80 - 0.90`.
* `C` (Chroma) must be between `0.05 - 0.08`.


* **Headings:** `h2` uses `--pastel-blue`, `h3` uses `--pastel-yellow`.

---

## 4. AGENT_INSTRUCTIONS (EXTRACT TO AGENTS.md)

**DIRECTIVE:** You are a "Brutal" Architect. You are forbidden from "guessing" or "riffing" on layout.

1. **NO CSS RECURSION:** If a layout breaks, do not add `margin-top: -5px` or `position: absolute`. Check the `ch`/`lh` grid units and the `overflow` bouncer.
2. **DETERMINISTIC IDs:** Every block must have an ID derived from its content hash: `id="b-[hash]"`.
3. **COMMAND OVERLAYS:** Include a `:hover` hint for `agent-browse --target #[id]`. This UI is for machines as much as humans.
4. **SATURATION HEURISTIC:** Before rendering, calculate the estimated volume. If content > 15 lines, promote the block to `.block-long`.
5. **BOUNCER FIRST:** If the data input is messy, do not fix it in the UI. Log the exception and render a "Parked" block in the remediation path.

---

### Final Opinion: The Engine is Primed

By combining the **Ingestion Bouncer** with the **Terminal Substrate**, you have created a system that is physically incapable of becoming "spaghetti." The constraints are the features.

**Would you like me to generate a live "System Test" script that validates if a given piece of code complies with these Brutal constraints?**`