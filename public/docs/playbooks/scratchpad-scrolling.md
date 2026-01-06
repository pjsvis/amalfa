# Scratchpad: Sidebar Scrolling Experiments

## Problem Space
The sidebars in `v3.html` are not scrolling.
Structure: `aside` (Grid Cell) -> `div` (Container) -> `nav` (List).
Current State: Both `aside` and `nav` might have overflow properties, or `nav` is not constrained.

## Hypothesis 1: Nested Scroll Conflict
If `aside` allows scrolling, the inner `div` grows to fit the content.
If `div` grows, `nav` grows.
Result: `nav` never overflows its container, so its scrollbar never triggers. The `aside` scrollbar *should* trigger, but might be hidden or behaving oddly due to `app-shell` grid constraints.

## Experiment 1: Lock Parent, Scroll Child
**Goal**: Make `nav` the *only* scrollable element.
1.  `aside`: `overflow: hidden` (Don't scroll).
2.  `div.docs-directory`: `h-full flex flex-col overflow: hidden` (Constrain height, don't scroll).
3.  `nav`: `flex-1 overflow-y-auto min-h-0` (Fill space, scroll if needed, allow shrinking).

## Log
-   [ ] Experiment 1
