# CSS Specificity & Theme Integration Playbook

## Purpose
To document best practices for integrating third-party CSS libraries (like `github-markdown-css`) with our custom theme system, ensuring consistent styling and preventing specificity wars.

## The Challenge
Third-party libraries often come with their own opinionated styles, including hardcoded colors and specific selectors. When integrating these into a themed application (Light/Dark modes), conflicts arise:
-   **Specificity Wars**: Library selectors might be more specific than utility classes.
-   **Theme Mismatches**: Libraries might rely on `prefers-color-scheme` while the app uses a manual `[data-theme]` toggle.
-   **Load Order**: The order of `<link>` tags determines precedence for equal-specificity rules.

## Best Practices

### 1. Load Order Matters
Always load custom override stylesheets **AFTER** the third-party library.
```html
<!-- Third-Party Library -->
<link rel="stylesheet" href="lib/github-markdown.css" />

<!-- Custom Overrides (Must be last) -->
<link rel="stylesheet" href="css/markdown.css" />
```
**Why?** If selectors have equal specificity (e.g., `.markdown-body`), the last one defined wins.

### 2. Do Not Rely on `prefers-color-scheme` Alone
If your app has a manual theme toggle (e.g., `data-theme="light"`), you cannot rely on libraries that only use `@media (prefers-color-scheme: dark)`.
-   **Problem**: User sets App to Light, System is Dark. Library sees Dark System -> Renders White Text. App renders White Background. **Result: Invisible Text.**
-   **Solution**: Override the library's colors using your app's CSS variables.

### 3. Explicitly Override Colors
Don't just hope the library inherits correctly. Force it to use your theme tokens.
```css
/* In your override file (e.g., markdown.css) */
.markdown-body {
    background-color: transparent !important; /* Blend with app background */
    color: var(--text-1) !important;          /* Use app's text color */
}

/* Force children to inherit or use theme */
.markdown-body p,
.markdown-body li,
.markdown-body h1 {
    color: var(--text-1) !important;
}
```

### 4. Harden Selectors for Stricter Browsers
Some browsers (like Brave) or specific configurations might be stricter about parsing or user-agent styles.
-   **Target Children**: Don't just style the container. Explicitly target `.markdown-body p`, `.markdown-body ul`, etc.
-   **Check Syntax**: Ensure your CSS is valid. Orphaned properties inside `@layer` blocks (outside selectors) can cause the entire block to be dropped.

### 5. Use `!important` Judiciously
When overriding a third-party library that you cannot modify, `!important` is a valid tool to ensure your theme tokens take precedence, especially for utility properties like colors and fonts.

## Debugging Checklist
-   [ ] **Inspect Computed Styles**: Use the browser dev tools to see *which* rule is winning.
-   [ ] **Check Load Order**: Is your override file loaded last?
-   [ ] **Check Specificity**: Is the library using `#id .class` while you are using `.class`?
-   [ ] **Check Syntax**: Are there syntax errors in your CSS file that might cause silent failures?
-   [ ] **Verify Theme Variables**: Does `var(--text-1)` actually resolve to a visible color in the current theme?
