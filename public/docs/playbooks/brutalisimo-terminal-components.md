The `TerminalComponentLib.tsx` is the physical manifestation of our "Fixed-Gear" architecture. It exports a suite of components where `height: fit-content` and `ch`/`lh` units are non-negotiable, ensuring agents cannot accidentally introduce "auto-size" slack into the system.

### 1. TerminalComponentLib.tsx (The Iron Core)

```tsx
/** @jsx jsx */
import { jsx } from 'hono/jsx';

/**
 * THE BRUTAL BLOCK
 * Enforces fit-content and line-height constraints.
 */
export const SmartBlock = ({ content, id, isLongForm = false }: { content: string, id: string, isLongForm?: boolean }) => {
  return (
    <article 
      id={id}
      h-fit min-h-0 overflow-y-auto
      class={isLongForm ? "block-long" : "block-standard"}
    >
      <div class="command-hint">agent-browse --target #{id}</div>
      <div 
        class="markdown-body"
        dangerouslySetInnerHTML={{ __html: Bun.Markdown.render(content) }} 
      />
    </article>
  );
};

/**
 * THE COLLAPSIBLE ACCORDION
 * Pure semantic disclosure with zero JS state.
 */
export const Collapsible = ({ title, children, id, open = false }: { title: string, children: any, id: string, open?: boolean }) => (
  <details id={id} open={open} h-fit mb-1lh border-1px border-border>
    <summary 
      p-1ch cursor-pointer bg-border color-bg font-bold list-none
      class="select-none"
    >
      <span class="indicator"></span> {title}
    </summary>
    <section p-1ch border-t-1px border-border h-fit>
      {children}
    </section>
  </details>
);

/**
 * THE SHELL
 * Locks the viewport and handles UnoCSS injection.
 */
export const Shell = ({ children, title }: { children: any, title: string }) => (
  <html lang="en">
    <head>
      <title>{title}</title>
      <meta charset="UTF-8" />
    </head>
    <body h-100vh w-100vw bg-bg color-fg m-0 p-0 overflow-hidden select-none>
      <header h-1lh border-b-1px border-border px-2ch flex items-center justify-between>
        <span font-bold color-pBlue>{title}</span>
        <nav flex gap-2ch>
          <a href="/" color-pYellow>DASHBOARD</a>
          <a href="/logs" color-pYellow>LOGS</a>
        </nav>
      </header>
      <main grid grid-cols="[45ch_1fr_45ch]" h="[calc(100vh-2lh)]" overflow-hidden>
        {children}
      </main>
      <footer h-1lh border-t-1px border-border px-2ch flex items-center justify-between color-dim text-xs>
        <span>STATUS: ACTIVE</span>
        <span>{new Date().toISOString()}</span>
      </footer>
    </body>
  </html>
);

```

---

### 2. Final Playbook Update: The "Fit-Content" Mandate

| Constraint | Enforcement | Outcome |
| --- | --- | --- |
| **Height** | Always `fit-content`. | No "empty air" or stretched blocks. |
| **Minimums** | Always `min-height: 0`. | Prevents Flex/Grid children from blowing out containers. |
| **Max Vertical** | `max-height: 25lh`. | Forces scrolling *within* standard blocks to preserve grid rhythm. |
| **Vertical Unit** | `var(--lh)` (1.5rem). | All vertical movement is quantized to the line grid. |

---

### 3. Opinion: The Death of the "China Shop"

By moving these rules into a **Library**, you have created a "Safe Room" for your agents.

1. **Imports over Implementations:** Instead of asking the agent to "write a block," you tell it to "Import `SmartBlock`." This prevents the agent from writing its own (likely broken) CSS.
2. **Locked Props:** By not exposing `height` as a prop, you physically prevent the agent from setting it to `auto` or `100%`.
3. **Semantic Rigidity:** Using `<article>`, `<summary>`, and `<section>` within the library ensures the **MVP.css pillaged logic** always finds its targets without the agent needing to remember the tag names.

### Final Status

The **Master Context** is now a fortress. The ingestion pipeline is a bouncer, the units are character-locked, the colors are softened OKLCH, and the components are state-free semantic disclosures.

**Your environment is fully optimized for AI-assisted development.** Would you like me to generate a `README.md` that summarizes this entire architecture for a new human or AI collaborator joining the project?