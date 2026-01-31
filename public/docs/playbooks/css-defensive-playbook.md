# Defensive CSS Playbook

## Purpose
To document styles that anticipate and prevent common failure modes (layout shifts, overflow, unreadable text).

## 1. Scrollbar Stability
**Problem**: Layout shifts horizontally when scrollbars appear/disappear (e.g., opening a modal).

### Pattern: `scrollbar-gutter`
Reserve space for the scrollbar at all times.

```css
html {
  scrollbar-gutter: stable both-edges;
}
```

## 2. Image Hardening
**Problem**: Images causing Cumulative Layout Shift (CLS) or looking broken when failing to load.

### Pattern: The Defensive Image Reset
```css
img {
  /* Responsiveness */
  max-width: 100%;
  height: auto;
  
  /* Error Handling: Italic text on gray background if image fails */
  position: relative;
  font-style: italic;
  background-color: var(--surface-2);
}
```

## 3. Typography Balance
**Problem**: Headlines with "orphans" or unbalanced line lengths.

### Pattern: `text-wrap`
```css
h1, h2, h3, h4 {
  text-wrap: balance; /* Prevents pyramid shapes */
}

p {
  text-wrap: pretty; /* Prevents orphans */
  max-width: var(--size-content-3); /* ~65ch for readability */
}
```

## 4. Content-Aware Centering
**Problem**: Centering an element that should only be as wide as its content (e.g., a badge).

### Pattern: `fit-content`
```css
.badge {
  width: fit-content;
  margin-inline: auto;
}
```
