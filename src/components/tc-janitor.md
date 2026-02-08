Since we are already living in the **Bun** ecosystem, writing the Persistence Janitor in TypeScript is the only logical move. Bun allows us to co-locate this logic and even "pillage" the same types between the server-side components and the client-side script.

By using a **Self-Invoking Function**, we can compile this with `Bun.build` or simply serve it as a static asset that the browser treats as a module.

### 1. The Persistence Janitor (`janitor.ts`)

This script acts as the "Hardware Observer," keeping the DOM in sync with the user's `localStorage`.

```typescript
/**
 * BRUTALISIMO PERSISTENCE JANITOR
 * Synchronizes [data-persist="true"] elements with localStorage.
 */
(() => {
  const PREFIX = "brut_v1_";

  const initJanitor = () => {
    const registry = document.querySelectorAll<HTMLElement>('[data-persist="true"]');

    registry.forEach((el) => {
      const storageKey = `${PREFIX}${el.id}`;

      // 1. RESTORE: Hydrate DOM from Hardware Store
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        if (el.dataset.state !== undefined) {
          el.dataset.state = saved;
          if (el.hasAttribute("aria-checked")) {
            el.setAttribute("aria-checked", saved === "on" ? "true" : "false");
          }
        }
        if (el.dataset.value !== undefined) {
          el.dataset.value = saved;
          const display = el.querySelector(".val-display");
          if (display) display.textContent = saved;
        }
      }

      // 2. OBSERVE: Mirror DOM mutations to Hardware Store
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "attributes") {
            const target = mutation.target as HTMLElement;
            const val = target.dataset.state ?? target.dataset.value;
            if (val !== undefined) {
              localStorage.setItem(storageKey, val);
            }
          }
        }
      });

      observer.observe(el, {
        attributes: true,
        attributeFilter: ["data-state", "data-value"],
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initJanitor);
  } else {
    initJanitor();
  }
})();

```

### 2. Integration: The "Iron" Deployment

In your `Shell` component, you now just point to the compiled output. You can use Bun's built-in bundler to transform this TypeScript into a minified, browser-ready JS file.

```tsx
// build.ts
await Bun.build({
  entrypoints: ['./src/client/janitor.ts'],
  outdir: './public',
  minify: true,
});

// Shell.tsx
<script src="/janitor.js" type="module"></script>

```

### 3. Why TypeScript for the Client?

Even for a simple "Janitor" script, TypeScript provides the **Bouncer**-level security we've established:

* **Type Safety:** We ensure we aren't calling `.id` on a null element.
* **Mutation Tracking:** Using `MutationObserver` in TS ensures we are specifically targeting the attributes that actually represent our "State".
* **Shared Constants:** You can export the `PREFIX` or any shared data-attribute names from a `constants.ts` and import them into both your Hono components and this janitor script, ensuring they never drift.

### 4. Opinion: The "Total Type" Loop

This completes the circuit. From the moment data hits your **Ingestion Bouncer** to the moment it’s toggled by a user's thumb and saved to `localStorage`, every bit is governed by a single type-safe architecture.

You’ve built a **"Zero-Friction State Machine"** where the "machine" is just the browser's native mutation engine, and the "state" is the HTML itself.

**The Brutalisimo stack is now unified in TypeScript.** Would you like me to generate a `bunfig.toml` and a `package.json` that automates this client-side build as part of your dev server?

Would you like me to...

* Generate the `package.json` scripts?
* Update the `COMPLIANCE.md` with the TS-Janitor protocol?
* Build a demo `SettingsModule.tsx` that uses these persistent switches?