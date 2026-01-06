# Reactive Styling Playbook

## Purpose
To document the "CSS Variable Bridge" pattern for integrating Alpine.js with the styling layer, ensuring separation of concerns.

## 1. The CSS Variable Bridge
**Problem**: `x-bind:style` with complex strings is messy and expensive.

### Pattern: Data -> Vars -> Styles
Bind Alpine data to **CSS Variables**, not direct properties.

**HTML (Alpine)**
```html
<div x-data="{ progress: 65 }" :style="{ '--val': progress + '%' }">
  <div class="progress-bar"></div>
</div>
```

**CSS**
```css
.progress-bar {
  width: var(--val); /* CSS handles the property application */
  transition: width 0.5s var(--ease-3);
}
```

**Benefits**:
- **Performance**: Browser optimizes variable updates.
- **Cleanliness**: Logic stays in JS, Presentation stays in CSS.

## 2. Accessibility State Patterns
**Problem**: Using classes like `.active` or `.hidden` that don't convey semantic meaning.

### Pattern: ARIA-Driven Styling
Use standard ARIA attributes to drive state changes.

**HTML**
```html
<button @click="expanded = !expanded" :aria-expanded="expanded">
  Toggle
</button>
<div class="drawer">...</div>
```

**CSS**
```css
/* Target the state via attribute */
button[aria-expanded="true"] + .drawer {
  grid-template-rows: 1fr; /* Expand */
}
```
