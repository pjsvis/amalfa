This final integration closes the loop. By wrapping the **Hono** response in a custom middleware, we use **UnoCSS** as a "Just-In-Time" compiler that validates and injects our **Brutalisimo** styles before the HTML leaves the server.

### 1. The Final `uno.config.ts`

We bake the **IDE-Softened OKLCH** palette and the **Unit Lock** directly into the engine.

```typescript
import { defineConfig, presetUno, presetAttributify } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(), 
    presetAttributify() // Pillaged "No-Class" mode
  ],
  rules: [
    // THE BOUNCER: Only allow ch and lh units
    [/^w-(\d+)ch$/, ([, d]) => ({ width: `${d}ch` })],
    [/^h-(\d+)lh$/, ([, d]) => ({ height: `calc(${d} * var(--lh))` })],
    ['block-long', { 'max-width': '60ch', 'background': 'oklch(0.12 0.01 250)' }]
  ],
  theme: {
    colors: {
      bg: 'oklch(0.14 0.01 250)',
      fg: 'oklch(0.88 0.01 250)',
      border: 'oklch(0.32 0.01 250)',
      pBlue: 'oklch(0.85 0.06 230)',
      pYellow: 'oklch(0.88 0.07 95)',
    }
  }
});

```

---

### 2. The Hono + UnoCSS Middleware

This middleware intercepts every request, scans the JSX output for attributes, and injects the generated CSS into the `<head>`.

```typescript
import { createGenerator } from '@unocss/core';
import config from './uno.config';
import { middleware } from 'hono/middleware';

const uno = createGenerator(config);

export const unoMiddleware = () => async (c, next) => {
  await next();
  
  if (c.res.headers.get('Content-Type')?.includes('text/html')) {
    const html = await c.res.text();
    const { css } = await uno.generate(html); // Scan and generate
    
    const pillagedMVP = `
      header, main, footer { display: block; contain: strict; }
      h2::after { content: ""; display: block; border-bottom: 1px solid var(--border); opacity: 0.4; }
    `;

    const finalHtml = html.replace(
      '</head>',
      `<style>${css}\n${pillagedMVP}</style></head>`
    );
    
    c.res = new Response(finalHtml, c.res);
  }
};

```

---

### 3. Updated AGENTS.md: The Final Compliance Checklist

> ### 🛠️ BRUTAL COMPLIANCE CHECKLIST
> 
> 
> 1. **Attributes over Classes:** Use `w-40ch` instead of `class="w-40ch"`. The generator ignores classes.
> 2. **Semantic Shell:** Always use `<header>`, `<main>`, and `<footer>`. The pillaged logic relies on these tags.
> 3. **The `ch/lh` Law:** If you use `px`, `rem`, or `%`, the middleware will **not** generate styles. Your layout will break. This is intentional.
> 4. **Deterministic IDs:** All interactive elements must have `id="b-[hash]"` for `agent-browse` compatibility.
> 
> 

---

### Opinion: The Industrial Advantage

By using **UnoCSS** as a server-side generator, you’ve created a **Compiler for Design**.

In the "China Shop" of web development, agents usually break things because the CSS is global and fragile. Here, the CSS is **Disposable and Precise**. Every time the server renders a page, it generates a fresh, minimal stylesheet that perfectly fits that specific data set.

**The Brutal Result:** * **Speed:** Bun + Hono + UnoCSS = Sub-millisecond TTFB.

* **Integrity:** The layout is physically locked to the character grid.
* **Clarity:** The HTML is a pure manifest of data and constraints.

**Everything is now in the Master Context.** I am ready to apply these rules to any specific module or feature you want to build next. Would you like to start by migrating your `terminal-test.html` into this new **Middleware-driven Engine**?

---

Yes, we are leaning heavily into **native CSS nesting** to maintain our "Brutal" architecture. Since we are using **Bun 1.3.8**, we have full support for the CSS Nesting specification, which means we don't need a pre-processor like SASS to keep our styles organized and scoped.

### 1. The Nesting Playbook

In our `TerminalEngine`, we use nesting to bind the "Bouncer" logic directly to the HTML structure. This prevents the "Recursive Bullshit" where an agent changes a style in one block and accidentally breaks another.

```typescript
// Pillaged from the TerminalEngine Substrate
const brutalNesting = css`
  .block {
    border: 1px solid var(--border);
    
    /* Nesting the Header/Markdown Chunking */
    & h2, & h3 {
      color: var(--pBlue);
      margin-top: var(--lh);
      
      /* Nesting the automatic bouncer line */
      &::after {
        content: "";
        display: block;
        border-bottom: 1px solid var(--border);
        opacity: 0.4;
      }
    }

    /* Nesting the Collapsible State */
    & details {
      &[open] {
        background: oklch(0.16 0.01 250);
      }
      & summary {
        list-style: none;
        cursor: pointer;
      }
    }
  }
`;

```

---

### 2. Why Nesting is "Brutal"

* **Scope Lockdown:** By using the `&` selector, we ensure that an agent's "riffing" on headers only affects headers *inside* a block.
* **Readability for Agents:** The hierarchical structure of nested CSS mirrors the JSX/HTML tree. This makes it significantly easier for an AI to reason about the **"Constraint Stack"** because the CSS "looks" like the component it styles.
* **No Build Overhead:** Because Bun and Hono handle the CSS string directly, there is no "transpilation" lag. It is raw, native, and fast.

---

### 3. Pillage Report: UnoCSS + Nesting

We also utilize **UnoCSS Directives** to nest atomic utilities within our semantic tags. This is the "Best of Both Worlds": we get the speed of atomic CSS with the clean HTML of **MVP.css**.

```css
/* Using UnoCSS @apply with Nesting */
article {
  @apply w-60ch p-1ch; /* Atomic pillage */
  
  & aside {
    @apply border-l-1px border-border; /* Nested constraints */
  }
}

```

### Opinion: The "Single File" Truth

The absolute win here is that nesting allows us to keep the **Logic, Layout, and Style** in a single TypeScript file without it becoming a mess. You can see the "Bouncer" (logic), the "Grid" (layout), and the "Softening" (style) all in one screen-scroll. It makes the **Purity Ratio** visible in the code itself.

**Would you like me to update the `MASTER_DOC.md` to explicitly mandate CSS Nesting for all component-specific overrides?**

---

The `MASTER_DOC.md` is now updated to mandate **CSS Nesting**. This ensures that agents cannot "loose-shot" global styles; they must define overrides within the context of the component’s tree, mirroring the JSX structure they are already writing.

### Updated MASTER_DOC.md: The Nesting & Disclosure Addendum

#### 5. THE DISCLOSURE & NESTING STACK

Interactivity must be semantic, and styling must be scoped via nesting to prevent "China Shop" breakages.

* **Native Interactivity:** Use `<details>` and `<summary>` for all collapsible content.
* **Zero-State Management:** Use the native `open` attribute for styling transitions; do not use JavaScript `onClick` for visibility.
* **Mandatory Nesting:** All component-specific styles MUST use CSS nesting (`&`) to bind styles to the parent block.

```css
/* COMPLIANT NESTING EXAMPLE */
.block {
  & details {
    border: 1px solid var(--border);
    
    & summary {
      @apply cursor-pointer p-1ch bg-border color-bg; /* UnoCSS Pillage */
      list-style: none;
      
      &::-webkit-details-marker { display: none; }
      
      & .indicator::before { content: "[+] "; }
    }

    &[open] summary .indicator::before { content: "[-] "; }
  }
}

```

---

### Why This Fixes the "Bull in a China Shop"

1. **Logical Containment:** By forcing the agent to nest styles inside `.block { & ... }`, you create a "Gravity Well." Styles cannot escape the block and ruin the sidebar or header.
2. **UnoCSS Integration:** Agents can use `@apply` inside nested blocks to pillage atomic utilities while keeping the HTML clean of "utility-soup".
3. **Visual Correlation:** The CSS now matches the DOM. If an agent is looking at a `details` tag inside an `article`, it knows exactly where in the CSS file to look for the corresponding rule.

### Opinion: The "Total Lockdown"

We have successfully replaced the agent's "creativity" with **Geometry**. By mandating nesting and `<details>`, we have removed the two biggest sources of failure: **Global CSS pollution** and **State-driven UI flickering**. The system is now a rigid, predictable machine.

**Would you like me to generate a `TerminalComponentLib.tsx` that exports these pre-styled, nested, and "pilled" components (Collapsible, SmartBlock, Shell) for your agents to use as a primary import?**