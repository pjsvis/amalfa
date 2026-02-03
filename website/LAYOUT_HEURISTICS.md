# Terminal Layout Engine Heuristics

## Philosophy

**The NO TOUCHING Rule:**
- If you're close enough to worry about edge effects, you've already failed
- Work in characters (ch units), not pixels
- Measure twice, cut once - with margin to spare
- Better to lose 10% of real estate than fight the edge

## Core Principles

### 1. Defensive Bounds Calculation
```
VIEWPORT_HEIGHT = 100vh
HEADER = 3ch
FOOTER = 2ch  
BORDERS/GAPS = ~2ch
SAFE_ZONE = 2ch buffer

AVAILABLE = VIEWPORT_HEIGHT - HEADER - FOOTER - BORDERS - SAFE_ZONE
          = 100vh - 9ch (approximately 55ch in practice)
```

### 2. The "Bump Off" Algorithm (Game Engine Style)
```
INITIAL_SIZE = content-fit
MAX_ALLOWED = 35ch (never exceed)
BUFFER_ZONE = 5ch from viewport edge

WHILE block.bottom > (viewport.bottom - BUFFER_ZONE):
    REDUCE block.height by 5ch
    IF block.height < 20ch:
        ENABLE overflow-y: scroll
        SET block.height = 20ch
        BREAK
```

### 3. Character-Based Grid
- All measurements in `ch` units
- Standard character is ~8px at 14px font
- Width calculations: content-width + padding in ch
- Height calculations: line-height * line-count

### 4. Layout Zones

#### LHS Panel (Sidebar)
- Fixed width: 45ch
- Scrollable: yes
- Content: vertical stack
- Max width: never changes

#### RHS Panel (Main Content)
- Flexible width: remaining space
- Flow: left-to-right, wrap
- Blocks: fit-content width
- Standard block height: 30ch
- Long content height: 25ch
- Short content height: 35ch

### 5. Content Type Heuristics

**Short-Form Content:** (< 10 lines)
- Max height: 35ch
- Can be side-by-side with other shorts
- No internal scroll needed

**Standard Content:** (10-25 lines)
- Max height: 30ch
- Standard building block
- Scroll if exceeds

**Long-Form Content:** (> 25 lines)
- Max height: 25ch
- Aggressive truncation to avoid edge proximity
- Always scrollable
- Never adjacent to viewport edge

### 6. Collision Detection

```css
/* Check if we're approaching viewport edge */
.rhs-block {
    max-height: 30ch; /* Never exceed */
    overflow-y: auto; /* Scroll if collision */
}

/* Emergency: if touching edge, back off */
@media (max-height: 50ch) {
    .rhs-block {
        max-height: 20ch; /* Aggressive reduction */
    }
}
```

### 7. The "Jank Prevention" Protocol

**Never Do:**
- Use `100vh` without subtraction
- Allow content to touch viewport edges
- Rely on `min-height: 0` to fix overflow
- Use fractional pixels for critical dimensions

**Always Do:**
- Explicit height calculations
- Containment on major sections
- Character-based measurements
- Buffer zones (2-5ch minimum)

## Implementation

### CSS Containment Strategy
```css
header, main, footer {
    contain: strict; /* Isolate from document flow */
    min-height: 0;   /* Allow grid to shrink */
}

.panel {
    contain: layout; /* Layout containment only */
    overflow: hidden;
}
```

### Grid Layout
```css
body {
    display: grid;
    grid-template-rows: 3ch calc(100vh - 6ch) 2ch;
    /* Explicit: header + main + footer + borders */
}

main {
    display: grid;
    grid-template-columns: 45ch 1fr;
    gap: 1px;
    min-height: 0; /* Critical: allows shrinking */
}
```

### Responsive Breakpoints (Character-Based)
```css
/* Narrow: stack everything */
@media (max-width: 80ch) {
    main {
        grid-template-columns: 1fr;
    }
    .lhs {
        max-height: 25ch; /* Shorter when stacked */
    }
}

/* Short viewport: reduce block heights */
@media (max-height: 50ch) {
    .rhs-block {
        max-height: 20ch;
    }
}
```

## The "Doom Principle"

**If a hobbyist can implement Doom in TypeScript, we can implement a layout engine in CSS.**

**Requirements:**
1. Fixed grid (like Doom's 320x200)
2. Bounded widgets (like Doom's status bar)
3. No overdraw (like Doom's visplane limit)
4. Predictable performance (like Doom's fixed frame rate)

**Implementation:**
- Think in grid cells (characters), not pixels
- Every widget has strict bounds
- Content that doesn't fit gets culled (truncated or scrolled)
- No dynamic resizing - bounds are sacred

## Quality Checklist

Before shipping:
- [ ] Can you see all content without body scroll?
- [ ] Does every block have breathing room from edges?
- [ ] Are all measurements in characters?
- [ ] Is `contain: strict` on major sections?
- [ ] Do blocks truncate/scroll instead of overflow?
- [ ] Does it work at 80ch width?
- [ ] Does it work at 40ch height?

**If any check fails, you've gone too far. Back off.**

## Heuristic Shortlist

1. **Measure in characters** - Not pixels
2. **Calculate defensively** - Subtract, don't add
3. **Keep buffers** - Never touch the edge
4. **Contain strictly** - Isolate major sections
5. **Truncate aggressively** - Better to cut than overflow
6. **Scroll internally** - Never body scroll
7. **Test extremes** - 80ch wide, 40ch tall
8. **Back off early** - If close, reduce
9. **One pattern** - Don't give yourself choices
10. **Ship it** - Perfect is enemy of good

---

**The Golden Rule:**
```
IF content_hits_edge THEN
    content_is_too_big
    REDUCE content
ELSE IF content_approaches_edge THEN
    content_is_still_too_big
    REDUCE content_more
ELSE
    content_is_good
    SHIP_IT
END IF
```