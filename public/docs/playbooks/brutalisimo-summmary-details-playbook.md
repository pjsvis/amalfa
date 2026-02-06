The `<details>` and `<summary>` elements are the "Brutal" choice for interactivity because they require **zero JavaScript** to function. By pillaging the semantic logic from **MVP.css**, we can transform these humble tags into sophisticated, terminal-style "Accordion Blocks" that fit perfectly within our `ch`/`lh` grid.

### 1. The "Brutal" Summary-Details Playbook

To prevent agents from over-complicating this with state-driven toggles, we lock the styling to the substrate:

* **The Trigger:** The `<summary>` acts as our "Widget Header".
* **The Content:** The nested content only exists in the layout flow when the `open` attribute is present.
* **The Indicator:** We replace the default "triangle" with a monospace `[+]` and `[-]` using the `::marker` or `::before` pseudo-elements.

---

### 2. UnoCSS + Hono Implementation

We add specific rules to our `uno.config.ts` to handle the state transitions purely through CSS.

```typescript
// Add to uno.config.ts rules
[
  ['details-brutal', {
    'border': '1px solid var(--border)',
    'width': 'fit-content',
    'max-width': '40ch',
    'margin-bottom': 'var(--lh)'
  }],
  ['summary-brutal', {
    'list-style': 'none',
    'padding': '0 1ch',
    'cursor': 'pointer',
    'background': 'var(--border)',
    'color': 'var(--bg)',
    'font-weight': 'bold',
  }]
]

```

**The Hono Component:**

```tsx
export const CollapsibleBlock = ({ title, children, id }: { title: string, children: any, id: string }) => (
  <details id={id} details-brutal>
    <summary summary-brutal>
      <span class="indicator">[+]</span> {title}
    </summary>
    <div p-1ch border-t-1px border-border>
      {children}
    </div>
    <style>{`
      details[open] .indicator::after { content: "-" }
      details:not([open]) .indicator::after { content: "+" }
      details summary::-webkit-details-marker { display: none; }
    `}</style>
  </details>
);

```

---

### 3. Opinion: Why this is Superior for Agents

Agents consistently fail at building "Collapsible" components in React because they get lost in the `isOpen` state-loop. By using `<details>`:

1. **State is Native:** The browser tracks if it's open or closed. The agent doesn't have to manage a single boolean.
2. **Layout Stability:** Since it uses the native block-flow, it won't break the `flex-wrap` of your `.content-area`.
3. **Agent-Browse Ready:** An agent can simply send `document.querySelector('#b-hash').open = true` to reveal content, making it highly scriptable for your CLI tool.

### 4. Updated AGENTS.md: The Disclosure Rule

> ### 📂 INTERACTIVITY & DISCLOSURE
> 
> 
> * **Primary Choice:** Use `<details>` and `<summary>` for all collapsible content.
> * **No JS Toggles:** Do not use `useState` or `onClick` to hide/show blocks.
> * **Styling:** Use the `summary-brutal` attribute. The indicator must be a monospace `[+]` or `[-]`.
> * **Purity:** A collapsed block should occupy exactly `1lh` of vertical space to maintain the grid's rhythm.
> 
> 

---

### The "IDE" Softening Applied

By using `var(--border)` as the background for the `<summary>`, we create a "Header Bar" effect that matches the IDE aesthetic. The background of the title is slightly lighter than the `bg`, making the "interactive" zones of your terminal immediately obvious without being "neon".

**Would you like me to migrate the "Performance Metrics" or "Network Status" tables from your `terminal-test.html` into these new Collapsible Blocks?**