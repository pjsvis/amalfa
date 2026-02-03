---
date: 2026-02-03
tags: [terminal-ui, css-layout, character-based-design, layout-engine]
---

## Debrief: Terminal Layout Engine Development

## Accomplishments

- **Character-Based Layout System:** Built a complete terminal-inspired layout engine using `ch` units instead of pixels, creating a predictable character grid
- **LHS/RHS Panel Architecture:** Implemented a two-column layout with a narrow fixed-width sidebar (45ch) and flexible main content area with flowing blocks
- **Game-Engine-Style Collision Detection:** Created CSS-based "bump off" algorithm where blocks size to fit-content but have strict max-height bounds (25ch, 30ch, 35ch) to avoid viewport edges
- **NO TOUCHING Rule Implementation:** Enforced a 5ch minimum buffer from viewport edges, backing off aggressively when content approaches boundaries
- **Text-Based Overflow Indicators:** Implemented simple character-based "--- more below ---" indicators at truncation points instead of gradient masks
- **Comprehensive Heuristics Documentation:** Created `LAYOUT_HEURISTICS.md` codifying all design principles, measurements in characters, and the "Doom Principle" (if Doom can run in TypeScript, we can layout in CSS)
- **Multiple Content Type Support:** Demonstrated handling of short-form, standard, and long-form content within the same layout system
- **Stress Testing:** Added 8+ example blocks to RHS panel including tables, lists, code blocks, and long-form documentation to validate layout behavior

## Problems

- **Initial Over-Engineering:** Attempted to use gradient masks for overflow indication, which contradicted the entire character-based philosophy
- **Edge Effect Struggles:** Early attempts to fix 1px overflow issues led to overly complex solutions before accepting the simple character buffer approach
- **CSS Containment Complexity:** Initially struggled with `contain: strict` and containment strategies before simplifying to bounded blocks
- **Pattern Inconsistency:** Early versions had competing layout patterns (boxes vs panels) before unifying on the single panel approach
- **Scroll Handling Confusion:** Initially attempted to prevent all scrolling before accepting that internal widget scroll is acceptable when content exceeds bounds

## Lessons Learned

- **Work in Characters, Not Pixels:** When building terminal-inspired interfaces, `ch` and `em` units provide predictable, countable dimensions that map directly to the content
- **Calculate Defensively:** Always subtract buffer space from viewport calculations. Available height = 100vh - header - footer - borders - SAFE_BUFFER (never use raw viewport)
- **Simple Text Over Visual Effects:** The "--- more below ---" text indicator is superior to gradient masks because it uses the same medium (characters) and requires no pixel-based rendering
- **Explicit Bounds Are Sacred:** Every widget must have explicit `max-width` and `max-height`. Content that doesn't fit gets culled or scrolled - never overflows
- **One Pattern, No Choices:** Offering multiple layout patterns (boxed vs lined vs floating) creates decision fatigue. One rigid pattern enforced everywhere is better
- **The 5ch Rule:** Never allow content within 5 characters of viewport edges. If it's close enough to worry about, you've already failed
- **Fit-Content with Caps:** `width: fit-content` is powerful but dangerous without caps. Always pair with `min-width` and `max-width` constraints
- **Commit the Good, Expunge the Bad:** Document the working heuristics (LAYOUT_HEURISTICS.md) and remove failed experiments. Future agents should only see the proven patterns

## Design Heuristics Codified

```
VIEWPORT_HEIGHT = 100vh
HEADER = 3ch
FOOTER = 2ch
BORDERS/GAPS = ~2ch
SAFE_BUFFER = 5ch
AVAILABLE = 100vh - 12ch (approximately 55ch in practice)

STANDARD_BLOCK = 30ch max (leaves 25ch buffer)
LONG_CONTENT = 25ch max (extra safe for overflow content)
SHORT_CONTENT = 35ch max (when content is brief)

RULE: IF content_approaches_edge THEN back_off
RULE: Content that overflows gets scrolled internally, never body scroll
RULE: All measurements in characters, never pixels
```

## What to Apply Elsewhere

These principles apply beyond terminal layouts:
- Any bounded widget system (dashboards, data displays)
- Any character-count-constrained interface (mobile terminals, embedded displays)
- Any system where predictability matters more than visual flair

## Final State

The terminal-test.html demonstrates:
- LHS sidebar: Fixed 45ch width, vertical stack, scrollable
- RHS container: Flexible width, blocks flow L→R, each sized to content with strict bounds
- 8+ content blocks showing various types (tables, lists, code, long-form)
- Text-based overflow indicators
- Character-based measurements throughout
- No gradient masks, no pixel calculations, no visual frippery

**Files Created:**
- `website/terminal-test.html` - Complete implementation
- `website/LAYOUT_HEURISTICS.md` - Reference documentation
- `website/screen-capture.ts` - Utility for AI screen analysis

**Commits:**
- `99e79dd` - Terminal layout engine with collision detection
- `1139c91` - Character-based block sizing
- `33890f0` - CSS containment fixes
- `4f0b828` - Initial terminal-style checkpoint

**Server:** http://localhost:8888/terminal-test.html

**Status:** Functional, documented, ready for use.