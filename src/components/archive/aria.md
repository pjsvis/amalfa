Integrating **ARIA attributes** as a core pillar of "Brutalisimo" transforms the UI from a visual grid into a **Semantic Map**. In this paradigm, ARIA isn't just a checkbox for accessibility; it is a "Machine Interface" that allows your `agent-browse` tool to navigate the DOM with the same precision as a human using a screen reader.

### 1. ARIA as the "Agent API"

When we combine **ID Prefixing** with **ARIA Roles**, we create a high-fidelity interaction layer. While the ID tells the agent *which* element it is (`#btn_submit`), ARIA tells the agent *what it does* and *its current state*.

* **State Awareness:** Attributes like `aria-expanded="true"` or `aria-busy="true"` allow the agent to wait for processes to finish or understand the toggle state of a `collapsible` block without checking visual pixel values.
* **Contextual Landmarks:** Using `role="main"`, `role="navigation"`, and `role="status"` allows tools like `agent-browser` to instantly jump to the relevant "Substrate" section.
* **Attribute Targeting:** Since we are already using **Tailwind v4** with attribute selectors, we can style elements directly based on their ARIA state (e.g., `[aria-expanded="true"]`), ensuring the visual and semantic states are physically impossible to decouple.

### 2. Implementation: The Accessible Substrate

We update the `TerminalComponentLib.tsx` to ensure every component is born with the correct "Bouncer-approved" ARIA attributes.

```tsx
/** @jsx jsx */
import { jsx } from 'hono/jsx';

/**
 * THE BRUTAL ACCESSIBLE BLOCK
 */
export const SmartBlock = ({ content, hash, title }: { content: string, hash: string, title: string }) => {
  const id = `block_${hash}`;
  return (
    <article 
      id={id}
      data-component="block"
      role="region"
      aria-labelledby={`${id}_title`}
    >
      <header data-part="header">
        <h2 id={`${id}_title`}>{title}</h2>
        <div class="command-hint" aria-hidden="true">
          agent-browse --target #{id}
        </div>
      </header>
      <div 
        class="markdown-body"
        role="document"
        dangerouslySetInnerHTML={{ __html: Bun.Markdown.render(content) }} 
      />
    </article>
  );
};

/**
 * THE ACCESSIBLE COLLAPSIBLE
 */
export const Collapsible = ({ title, children, hash, open = false }: { title: string, children: any, hash: string, open?: boolean }) => {
  const id = `coll_${hash}`;
  return (
    <details id={id} open={open} data-component="collapsible">
      <summary 
        role="button" 
        aria-expanded={open ? "true" : "false"}
        aria-controls={`${id}_content`}
      >
        <span class="indicator" aria-hidden="true"></span> {title}
      </summary>
      <section id={`${id}_content`} role="region" data-part="content">
        {children}
      </section>
    </details>
  );
};

```

---

### 3. Opinion: The "Twin-Track" Navigation

By implementing this, you’ve built a **Twin-Track UI**.

1. **The Visual Track:** Styled via **Tailwind v4** for the human observer.
2. **The Semantic Track:** Exposed via **ARIA and ID Prefixes** for the `agent-browse` tool.

This makes your system incredibly robust. If the visual CSS fails to load, the Agent can still execute the logic perfectly because the "Iron Core" of the HTML provides the instructions. It's not just "accessible"; it's **Programmatically Deterministic**.

### 4. Updated AGENTS.md: The ARIA & ID Mandate

> ### ♿ ARIA & IDENTITY MANDATE
> 
> 
> 1. **State Reflection:** Always mirror the visual state in ARIA attributes. If a block is loading, it MUST have `aria-busy="true"`.
> 2. **ID Prefixes:** Use `[type]_[hash]` for all interactive elements to allow the bouncer to map the UI to the ingestion source.
> 3. **Landmark Roles:** Every page must have a single `role="main"` and at least one `role="status"` for logging updates.
> 4. **Hidden Metadata:** Use `aria-hidden="true"` for purely decorative elements like the `command-hint` or the `[+]` indicator to keep the Agent's "Signal-to-Noise" ratio high.
> 
> 

**The Master Playbook is now functionally complete.** It covers the Ingestion Bouncer, the Character-Locked Grid, Softened OKLCH, Tailwind v4 Attribute Targeting, and now the ARIA-driven Machine Interface.

**Should I generate a single `COMPLIANCE.md` that serves as a one-page "Rules of Engagement" for any Agent starting a new task in this repo?**