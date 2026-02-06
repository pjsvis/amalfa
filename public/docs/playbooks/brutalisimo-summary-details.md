CSS Styles for Details

**Best CSS styles and transitions for the `<details>` and `<summary>` HTML tags** focus on accessibility, visual feedback, and smooth animations. Here’s how to achieve the best results:

### **Styling the Summary and Removing Default Icons**
To remove the default disclosure triangle and replace it with custom content:
```css
summary {
  list-style: none;
  cursor: pointer;
  padding: 10px;
  font-weight: bold;
}

summary::-webkit-details-marker {
  display: none;
}

/* Use ::before for cross-browser consistency */
summary::before {
  content: "▶";
  margin-right: 8px;
  transition: transform 0.3s ease;
}

details[open] summary::before {
  content: "▼";
  transform: rotate(180deg);
}
```
This approach works across browsers, including Chromium and Safari.

### **Animating Content with `max-height` (CSS-Only)**
Since `height: auto` doesn’t support transitions, use `max-height` with a fixed fallback:
```css
details {
  overflow: hidden;
  transition: max-height 0.4s ease-out;
  max-height: 40px; /* Initial height */
}

details[open] {
  max-height: 500px; /* Adjust to fit content */
}
```
This method is simple and widely supported, though it requires estimating the max height.

### **Advanced Animation Using `::details-content` (Modern Browsers)**
For true `height: auto` transitions, use the new `::details-content` pseudo-element with `interpolate-size`:
```css
@supports (interpolate-size: allow-keywords) {
  :root {
    interpolate-size: allow-keywords;
  }

  details[open]::details-content {
    height: auto;
  }

  details::details-content {
    transition: height 0.5s ease, content-visibility 0.5s ease allow-discrete;
    height: 0;
    overflow: clip;
  }
}
```
**Note**: This only works in Chrome 130+ and other modern browsers supporting `interpolate-size`.

### **Fallback for Older Browsers**
For browsers without `interpolate-size`, use a fixed `max-height` with `overflow-y: scroll`:
```css
@supports not (interpolate-size: allow-keywords) {
  details::details-content {
    max-height: 300px;
    overflow-y: auto;
  }
}
```

### **Best Practices**
- Always include **visual indicators** (like arrows) for accessibility.
- Use `transition: all 0.3s ease` for smooth hover and open/close effects.
- Avoid `height: auto` in transitions unless using `interpolate-size`.
- Use `::before` or `::after` for custom icons instead of relying on `::marker`.

This combination ensures **cross-browser compatibility**, **smooth animations**, and **semantic accessibility**.