# Terminal-Style Design Playbook

A design vocabulary for creating terminal.shop-inspired interfaces in HTML/CSS.

## Philosophy

Terminal.shop works because it can't add more - the medium won't allow it. On the web, you must enforce those limits artificially. Every element justified by function, not decoration. If you can't explain it in plain text first, you can't build it.

## Hard Constraints

### Typography
- Monospace only: `font-family: monospace`
- No custom fonts
- No font loading
- No font variations or weights beyond what the system provides

### Layout
- Grid-based layout using `ch` units (character width) for precise alignment
- Design mentally in an 80×24 grid before scaling up
- Whitespace as primary layout tool
- Box drawing with Unicode characters or minimal border properties

### Color
- 8-16 ANSI colors maximum, defined upfront
- No gradients
- No shadows
- Color used sparingly for emphasis only

### Prohibited
- No images
- No icons (except Unicode glyphs)
- No animations (except maybe cursor blink)
- No rounded corners
- No post-2000 flourishes
- No JavaScript unless absolutely necessary for state management

## The Discipline

### What You Don't Add
Most web brutalism fails because designers can't resist "one more thing." The real trick is restraint.

- If it doesn't serve function, remove it
- If you're unsure, remove it
- Maximum specificity: every character and line must earn its place
- No abstraction layers fighting against the platform
- Embrace the medium's native capabilities

### Implementation Guidelines
- A stylesheet so small it fits in a tweet (or close to it)
- Consider compiling from a text-based format that makes excess impossible
- Test by viewing with CSS disabled - the structure should still make sense
- Functionality expressed directly through the medium's capabilities

## ANSI Color Palette Reference

```
Black:   #000000
Red:     #AA0000
Green:   #00AA00
Yellow:  #AA5500
Blue:    #0000AA
Magenta: #AA00AA
Cyan:    #00AAAA
White:   #AAAAAA

Bright variants:
Black:   #555555
Red:     #FF5555
Green:   #55FF55
Yellow:  #FFFF55
Blue:    #5555FF
Magenta: #FF55FF
Cyan:    #55FFFF
White:   #FFFFFF
```

## Example: Minimal Navigation

```
terminal
─────────────────────────────────────
s shop    a account    c cart $ 0 [0]
─────────────────────────────────────
```

Implementation:
- Underline for active tab
- Box-drawing characters (U+2500 series)
- Monospace ensures perfect alignment
- No framework required

## Mantras

- Constraints breed creativity
- Every character earns its place
- More tokens to describe than to implement
- Honest design - no pretense
- The medium is the message
