---
tags:
  - metadata
  - vocabulary
  - agent-driven
  - extracted
---
# Problem Solving Playbook

## Purpose
To document proven strategies for debugging complex interactions and solving persistent engineering problems. This is a living collection of "mental models" and tactical patterns.

## Core Strategies

### 1. Variable Reduction (The "Disablement" Pattern)
**Principle:** When debugging a complex interaction (e.g., a click failing in a rich UI), systematically disable surrounding features to isolate the root cause.

**The Lesson:**
-   **"Unrelated" is a Hypothesis, not a Fact:** We often assume a feature (like a drag-camera controller) is unrelated to a bug (like a node click). This assumption is dangerous.
-   **Aggressive Disablement:** Don't just "tweak" the potential interference; turn it off completely.
    -   *Example:* To debug a click issue, we disabled the hover popover and the drag controller entirely.
    -   *Result:* Once the noise was gone, the signal (the click) was clear. We could then re-introduce features one by one.

### 2. The "Native Interception" Pattern
**Context:** When working with heavy UI libraries (Sigma.js, Mapbox, Three.js) that abstract away DOM events.

**Problem:**
Library event handlers often swallow or manipulate events before your code sees them. Trying to "react" to a library event (e.g., `downNode`) to stop another library action (e.g., `drag`) often fails because the internal logic has already fired.

**Solution: Go Lower.**
Intercept the **native DOM event** at the container level using the `capture` phase.

```javascript
// The "Nuclear Option" for stopping library interference
container.addEventListener("mousedown", (e) => {
    if (shouldBlock(e)) {
        e.stopPropagation(); // Stops the library from ever seeing it
    }
}, true); // 'true' enables the CAPTURE phase (top-down)
```

**Why it works:**
-   The Capture phase happens *before* the Bubble phase (where most libraries listen).
-   By stopping propagation here, you effectively "blind" the library to the event, giving you total control.

### 3. Visual Feedback & "The UI is a Liar"
**Principle:** If you can't see it, you can't debug it. But don't trust the UI blindly.
-   **Cursors:** Changing the cursor (e.g., `grab` vs `grabbing`) is not just UX; it's a debug tool to confirm state changes.
-   **Console Logs:** "Debug Mode" logging (e.g., `[SigmaDebug]`) is essential for tracing event order in real-time.
-   **Default Open:** In visualization tools (graphs, trees), ALWAYS default to showing everything initially. Filtering logic (e.g., "hide orphans") often looks exactly like "failed data loading". Verify the data is there *before* you try to make it pretty.
-   **Verify Backend First:** Never assume the UI reflects the true state of the database. Always use raw queries (SQLite CLI) or targeted test scripts (`test_roundtrip.ts`) to prove the data exists.

### 4. The "Strip-it-Back" Heuristic
**Principle:** Complexity is often the bug itself. When a UI component is misbehaving (e.g., text scrunching, invisible items, layout shifts), the issue is frequently caused by conflicting "fancy" styles (truncation, transitions, calculated padding).

**The Lesson:**
-   **Simplify to Verify:** Remove all non-essential styles. Revert to browser defaults or basic utility classes.
-   **Example:** A Table of Contents was invisible/scrunching. We removed `truncate`, `leading-relaxed`, and complex hover effects.
-   **Result:** The text became readable immediately. We could then decide if the "fancy" stuff was even necessary (it wasn't).
-   **Rule:** If you need 5 lines of CSS to make a list item readable, you are over-engineering.

### 5. The "Isolation Test" Pattern (Clean Room Debugging)
**Context:** When a component works in theory (or in a different context) but fails in the main application, and the cause is obscured by the complexity of the full system (e.g., global styles, complex bundles, script interference).

**The Workflow:**
1.  **Stop Debugging the Monolith:** Do not waste hours fighting the full application bundle.
2.  **Create a "Clean Room":** Create a temporary, minimal HTML file (e.g., `isolation-test.html`) and a minimal entry point (e.g., `test.css` or `test.js`).
3.  **Import One Thing:** Import *only* the component or style you are trying to fix.
4.  **Verify:** Does it work in isolation?
    -   **Yes:** The component is fine. The bug is in the *integration* (e.g., build process, specificity clash, script conflict).
    -   **No:** The component is broken. Fix it here, where the feedback loop is fast.
5.  **Re-integrate:** Once fixed in isolation, move it back to the main app. If it breaks again, you know exactly where to look (the integration point).

---

### 6. Alpine.js Method Binding Issue (2025-12-11)
**Problem**: Methods imported via `Object.fromEntries` wrapping lose their ability to call each other, causing "this.methodName is not a function" errors.

**Root Cause**: The wrapping pattern creates new function objects that break lexical scope connections between methods in the original object.

**Solution**: Use direct import pattern `...Module.methods` instead of wrapping methods individually.

**Prevention**: Apply the "Strip-it-Back Heuristic" before attempting complex method binding strategies. Always try the simplest approach first.

**Example of Working Pattern**:
```javascript
// ❌ WRONG - breaks method connections:
...Object.fromEntries(Object.entries(Viz.methods).map(([key, method]) => [key, function(...args) {...}]))

// ✅ CORRECT - preserves method connections:
...Viz.methods
```

**Lessons**: 
- Alpine.js has architectural constraints around method import patterns
- Complex wrapping solutions often create more problems than they solve
- When debugging method binding issues, isolate the problem before making architectural changes
