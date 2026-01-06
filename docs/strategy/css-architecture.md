# CSS Architecture Strategy: "Zero Magic, High Predictability"

## The Problem
We are currently "fighting the framework".
1.  **Tailwind Preflight** aggressively strips all defaults (cursors, backgrounds) to ensure a blank canvas.
2.  **Open Props** provides tokens but expects us to wire them up.
3.  **Our Custom CSS** attempts to put styles back, but often clashes with the aggressive reset.
4.  **The Build System** (Static Files) created a "Zombie Code" scenario where changes weren't reflected.

## The Solution

### 1. The Build: "Fresh Start" Protocol
We must guarantee that `http://localhost:3000` never serves stale code.
*   **Action:** Update `scripts/cli/dev.ts` to **DELETE** `public/css/app.css` on startup.
*   **Result:** If the build fails, the site breaks (Good). If it works, it is fresh (Good). No more "Dark on Dark" ghosts.

### 2. The Reset: "PolyVis Base"
Instead of importing a generic reset (like `open-props/normalize`) which previously broke our layout, we officially designate `src/css/layers/base.css` as our **Explicit Reset**.
*   **Rule:** If Tailwind strips it (like `cursor: pointer`), we explicitly put it back in `base.css`.
*   **Benefit:** We control the defaults. No hidden external styles.

### 3. The Future: "Utility-First"
We should stop writing component classes like `.btn-structural` in CSS files.
*   **Direction:** Move styles into HTML using Tailwind classes (e.g., `class="cursor-pointer bg-surface-hover..."`).
*   **Benefit:** The HTML tells the truth. No CSS file hunting.

## Immediate Next Steps
1.  [x] **Fix Cursors:** Done in `base.css`.
2.  [ ] **Fix Build:** Modify `scripts/cli/dev.ts` to clean stale artifacts.
## Lessons Learned (2025-12-15)
*   **Layout Hierarchy:** Trying to control width via *Content* (Buttons) inside a Flex *Container* (Sidebar) creates friction and unpredictable stretching. Always control the **Container** first.
*   **Utility vs. Layout:** Utility classes are excellent for discrete styling (colors, spacing) but should be used carefully for varying layout contexts.
*   **Revert Culture:** If an experiment fails (like fixed-width buttons), revert to the known stable state (Content-based sizing) rather than patching the bad assumption.

## Phase 2: The CSS Remediation Plan
To eliminate "CSS Friction":
1.  **Strict Layering:** Enforce `reset` -> `theme` -> `layout` -> `utilities`.
2.  **Container Queries:** Explore `@container` for components that need to adapt (like sidebar buttons) without relying on global viewport queries.
3.  **Theme Variables for Layout:** Define layout constants (Sidebar Width, Header Height) in `theme.css` to centralize control, but allow components to read them, not drive them.
4.  **Audit:** Systematically review `index.html` to remove mixed metaphors (e.g., inline styles fighting Tailwind classes).
