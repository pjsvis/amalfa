# CSS Verification Workflow Playbook

## Purpose
To eliminate "blind coding" and "hallucinated fixes" by enforcing a rigorous cycle of visual verification using the Browser Subagent.

## The Golden Rule
**"If you haven't seen it in the browser, it doesn't exist."**
Never report a UI fix based solely on code analysis. Code theory often diverges from browser reality.

## The Workflow

### 1. Visual Baseline (Before)
Before attempting a fix, establish the current state.
-   **Action**: Launch Browser Subagent.
-   **Task**: Open the target page.
-   **Inspect**:
    -   Are scrollbars visible? (Main window vs. containers)
    -   Is the layout broken? (Overflow, misalignment)
    -   Are colors/styles correct?
-   **Evidence**: Capture a screenshot or read the computed styles of the problematic element.

### 2. Hypothesis & Fix
Formulate a fix based on the visual evidence, not just the code.
-   **Action**: Edit CSS/HTML.
-   **Constraint**: Apply **one** logical change at a time (e.g., "Fix container overflow"). Avoid "shotgun debugging" (changing 10 things at once).

### 3. Visual Verification (After)
Verify the specific fix was effective.
-   **Action**: Reload the page in Browser Subagent.
-   **Inspect**:
    -   Did the specific issue resolve?
    -   Did it cause a regression? (e.g., Did fixing the scrollbar break the layout?)
-   **Evidence**: Capture a screenshot or read the DOM to confirm the change.

### 4. Responsive Check
Explicitly check the "other" device states.
-   **Action**: Resize browser window.
-   **Check**:
    -   **Desktop (> 1024px)**: Side-by-side, no main scrollbar.
    -   **Mobile (< 768px)**: Stacked/Split, correct scrolling behavior.

## Anti-Patterns (Do Not Do)
-   **The "It Should Work" Fallacy**: "I added `overflow: hidden`, so the scrollbar *must* be gone." (False. `scrollbar-gutter`, `min-height`, or child overflow could still force it).
-   **Blind Refactoring**: Changing class structures without checking if the new structure actually renders as intended.
-   **Ignoring Regressions**: Fixing one thing (layout) but breaking another (colors) because you didn't look at the whole page.
