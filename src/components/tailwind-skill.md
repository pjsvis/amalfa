### 1. The Tailwind v4 "Brutalisimo" Substrate (`app.css`)

In v4, the theme is CSS-native. We use this to hard-code our **ch/lh** units and **OKLCH** colors so the Agent can't "riff" on them.

```css
@import "tailwindcss";

@theme {
  /* IDE-SOFTENED OKLCH PALETTE */
  --color-bg: oklch(0.14 0.01 250);
  --color-fg: oklch(0.88 0.01 250);
  --color-border: oklch(0.32 0.01 250);
  
  /* PASTEL ANSI HUES */
  --color-p-blue: oklch(0.85 0.06 230);
  --color-p-yellow: oklch(0.88 0.07 95);
  --color-p-green: oklch(0.85 0.08 145);
  
  /* IMMUTABLE LINE HEIGHT */
  --spacing-lh: 1.5rem;
}

/* ATTRIBUTE TARGETING: The "No Class Soup" Law */
[data-component="block"] {
  @apply border border-border h-fit min-h-0 p-[1ch] overflow-y-auto;
  width: 40ch;

  &[data-size="long"] {
    @apply w-[60ch] bg-black/10;
  }

  /* ARIA-DRIVEN STYLING */
  &[aria-busy="true"] {
    @apply opacity-50 cursor-wait;
  }
}

[data-component="collapsible"] {
  @apply border border-border h-fit mb-[var(--spacing-lh)];

  & summary {
    @apply cursor-pointer bg-border text-bg font-bold px-[1ch] list-none;
    /* Native ARIA targeting */
    &[aria-expanded="true"]::before { content: "[-] "; }
    &[aria-expanded="false"]::before { content: "[+] "; }
  }
}

```

---

### 2. Implementation: ID Prefixing & ARIA Logic

We leverage the **ID Prefixing** to give `agent-browse` a deterministic map. Instead of generic hashes, we use `type_hash` to provide immediate context to the machine interface.

```tsx
/** @jsx jsx */
import { jsx } from 'hono/jsx';

export const SmartBlock = ({ content, hash, title, busy = false }: any) => {
  const id = `block_${hash}`; // ID Prefixing for agent-browse
  return (
    <article 
      id={id}
      data-component="block"
      role="region"
      aria-labelledby={`${id}_label`}
      aria-busy={busy ? "true" : "false"}
    >
      <header flex justify-between items-center mb-1ch>
        <h2 id={`${id}_label`} font-bold color-p-blue uppercase>{title}</h2>
        <span text-xs color-border aria-hidden="true">#{id}</span>
      </header>
      <div 
        role="document"
        dangerouslySetInnerHTML={{ __html: Bun.Markdown.render(content) }} 
      />
    </article>
  );
};

```

---

### 3. Opinion: The "Relational" DOM

By combining **Tailwind v4**, **Attribute Targeting**, and **ARIA**, you have essentially turned the DOM into a **Relational Database**.

* **Primary Key:** The prefixed ID (`block_8f2a`).
* **Foreign Key/Type:** The `data-component="block"` attribute.
* **State/Status:** The `aria-expanded` or `aria-busy` attributes.

This is the ultimate environment for an Agent. It doesn't need to "see" the page; it can **query** the page. If it needs to know if a block is loading, it doesn't look for a spinner; it checks `[aria-busy="true"]`.

### 4. Tailwind v4 Law

Do not write utility classes in JSX. Use `@apply` inside attribute-targeted CSS blocks. This keeps the HTML as a pure data manifest and the CSS as a structural substrate.

### 5. COMPONENT COLOCATION LAW
Physical Defaults: Core layout constraints (h-fit, min-h-0, w-[...]ch) must be colocated in the component's JSX.

External CSS for Theming Only: Use the global styles.css only for Variables (colors, fonts) and Global Resets.

Self-Contained Integrity: A component should render correctly with zero external classes, relying only on its inline Tailwind utilities.

### 6. SYNTAX LAW 

When referencing system variables in Tailwind v4, use the shorthand property-(--variable-name) syntax. Avoid square brackets [] and the var() keyword unless referencing a dynamic runtime value that is not in the @theme substrate.

By using the -(--variable) shorthand, we achieve a "Workable" Logic that handles its own complexity.

Syntactic Purity: The code reads like a list of hardware specs rather than a styling language.

Agent Safety: An agent is less likely to break a string like mb-(--spacing-lh) because it looks like a single, atomic token.

### 7. GEOMETRY LAW 
 
Use local <style> blocks within components to define "Physical" properties (width, height, interpolate-size, line-height). Use Tailwind classes only for "Atmospheric" properties (colors, borders, typography).

### 8. FORMATTING LAW 
 
All opening tags for primary components MUST format attributes as a vertical list. This ensures "Vertical Scannability" for both Human Architects and AI Agents. Use the <style> block to offload geometry and keep these lists concise.