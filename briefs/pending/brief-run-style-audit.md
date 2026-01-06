Here is the **Technical Brief** for your coding agent.

This task is designed to run alongside your current CSS refactor. It ensures that as you rip out the old styles, new "soft" styles don't accidentally creep back in.

---

# Agent Task: Implement Runtime CSS Integrity Checks ("The Style Auditor")

**Context:**
We are refactoring the **PolyVis** UI to a strict "Terminal Brutalist" design system. We need a programmatic way to enforce design invariants (Zero Border Radius, Monospace Fonts, ANSI Colors) at runtime. This allows both developers and Agents to "unit test" the visual layer.

**Goal:**
Create a client-side utility script (`style-auditor.js`) that performs a "Physical Inspection" of the rendered DOM elements to ensure they comply with the design directives.

**Directives:**

1. **Create the Auditor Module:**
* File: `src/utils/style-auditor.js` (or equivalent path).
* Export a function: `runStyleAudit()`.
* Expose globally: `window.runStyleAudit = runStyleAudit;` (for console access).


2. **The "Sandbox" Logic:**
* The function should create a hidden, temporary container (`div`) appended to the `body`.
* Inside this container, render the core primitives to be tested:
* A `<button class="btn-primary">Test Button</button>`
* A `<div class="panel-hollow">Test Panel</div>`
* A `<h1>Test Header</h1>`




3. **The Assertions (Strict Mode):**
Use `window.getComputedStyle(element)` to measure the resolved CSS values. Throw an error or log a failure if:
* **Geometry Violation:** `border-radius` is not exactly `'0px'`.
* **Typography Violation:** `font-family` does not contain `'Mono'`, `'Courier'`, or `'monospace'`.
* **Structure Violation:** The `.panel-hollow` does not have a border width of at least `2px`.
* **Contrast Violation:** Background color and Text color are identical (invisible text).


4. **Integration with Agent Theme:**
* If `window.__AGENT_THEME__` exists, validate that the computed colors match the palette in that object.


5. **Reporting:**
* **On Pass:** Log `%c[STYLE AUDIT] PASSED: System is Brutalist.`, 'color: #16C60C' (ANSI Green).
* **On Fail:** Log `%c[STYLE AUDIT] FAILED: <Reason>`, 'color: #C50F1F' (ANSI Red).



**Reference Implementation Skeleton:**

```javascript
export function runStyleAudit() {
  console.log('Running Physical Style Audit...');
  const sandbox = document.createElement('div');
  sandbox.style.visibility = 'hidden';
  document.body.appendChild(sandbox);

  try {
    // 1. Setup Test Subject
    const btn = document.createElement('button');
    btn.className = 'btn-primary'; // Adjust to your actual class name
    sandbox.appendChild(btn);
    
    // 2. Measure Physics
    const style = window.getComputedStyle(btn);
    
    // 3. Assertions
    if (style.borderRadius !== '0px') {
      throw new Error(`GEOMETRY VIOLATION: Button has curves (${style.borderRadius})`);
    }
    
    if (!style.fontFamily.toLowerCase().match(/mono|courier|console/)) {
      throw new Error(`TYPOGRAPHY VIOLATION: Font is not machine-readable (${style.fontFamily})`);
    }

    console.log('%c[STYLE AUDIT] PASSED: Integrity Verified.', 'color: #16C60C; font-weight: bold;');
    return true;

  } catch (e) {
    console.error(`%c[STYLE AUDIT] FAILED: ${e.message}`, 'color: #C50F1F; font-weight: bold;');
    return false;
  } finally {
    // Clean up the evidence
    document.body.removeChild(sandbox);
  }
}

// Auto-expose
if (typeof window !== 'undefined') {
  window.runStyleAudit = runStyleAudit;
}

```

---

### How to use this during your refactor

Once the agent implements this, you can simply refresh your browser and type `runStyleAudit()` in the console.

* If it returns **Green**: Your CSS refactor is safe.
* If it returns **Red**: You missed a spot (likely a stray user-agent stylesheet or a Tailwind default interfering).