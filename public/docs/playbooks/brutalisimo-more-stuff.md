Banishing `height: auto` is the final nail in the coffin for "Layout Jitter." In a terminal-grid system, `height: auto` is often the culprit behind the "Flash of Unstyled Layout" or agents accidentally pushing content into a recursive overflow loop.

By mandating `height: fit-content` (or `min-height: 0`), you ensure the block's physical footprint is determined strictly by its internal character count and line-height.

### 1. The "Physicality" of fit-content

When an agent uses `auto`, the browser is allowed to "negotiate" space. When you use `fit-content`, the block **claims** its space based on the text.

* **Predictable Collision:** Our "Game Engine" style collision detection works better because the bounding box is tight to the content, not padded by "auto" air.
* **Scroll Integrity:** It prevents the `content-area` from hallucinating extra scrollable space that doesn't actually contain data.
* **Agent Clarity:** An agent can look at a block and know: *Content = Size*. There is no "hidden" CSS logic stretching the box.

---

### 2. Implementation: The Height Lockdown

We update the `uno.config.ts` and the `MASTER_DOC.md` to treat `height: auto` as a violation of the substrate.

```typescript
// uno.config.ts update
rules: [
  // Force fit-content for all block-level elements
  ['h-fit', { 'height': 'fit-content', 'min-height': '0' }],
  ['block-base', { 
    'height': 'fit-content', 
    'min-height': '0',
    'max-height': 'calc(25 * var(--lh))',
    'overflow-y': 'auto' 
  }]
]

```

---

### 3. Updated MASTER_DOC.md: The Height Directive

> ### 📏 DIMENSION LOCKDOWN
> 
> 
> * **No `height: auto`:** This is strictly forbidden. It leads to unpredictable "fluid" behavior.
> * **Mandatory `fit-content`:** All blocks, details, and widgets must use `height: fit-content`.
> * **Collision Safety:** Use `min-height: 0` on flex/grid children to prevent the "minimum content size" blowout bug.
> * **Line-Height Bounds:** Vertical space is always a multiple of `var(--lh)`.
> 
> 

---

### 4. Opinion: The "Fixed-Gear" Layout

This is like moving from a car with an automatic transmission to a **fixed-gear bicycle**. There is no "slack" in the system.

If a block is too tall, it’s because there is too much text—period. It forces the agent (and the user) to deal with the **Information Density** directly rather than letting the browser "massage" the layout into something that looks okay but is structurally incoherent.

**The Brutal Result:** You get a UI that feels "heavy" and "mechanical." It doesn't move or wiggle. It just *is*.

**Would you like me to finalize the `TerminalComponentLib.tsx` with these `fit-content` constraints baked into the base `SmartBlock`?**