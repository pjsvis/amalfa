# DATASTAR PLAYBOOK (The "Reactor" Pattern)

**Philosophy:**

* **Hollow Node:** The Client has NO logic. It only has "Bindings."
*   **Hollow Node:** The Client has NO logic. It only has "Bindings."
*   **The Server is the Engine:** All state transitions happen in Bun.
*   **The Transport:** Server-Sent Events (SSE) push HTML fragments or Signal updates.

## 1. The Stack

*   **Runtime:** Bun
*   **Library:** `datastar` (Custom Bundle)
*   **Client:** `index.html` loading a local `datastar.bundle.js`.

## 2. Lessons Learned (The "Reactor" Experiment)

### A. Bundling is Critical
Do not rely on the CDN for production or stability. The official bundle may be "slim" and attempt to dynamically fetch plugins.
**Best Practice:** Create a custom entry point and build a self-contained bundle.

**entry.ts**:
```typescript
import { apply, load } from '@starfederation/datastar/dist/engine/engine.js';
import { GET } from '@starfederation/datastar/dist/plugins/official/backend/actions/get.js';
import { MergeSignals } from '@starfederation/datastar/dist/plugins/official/backend/watchers/mergeSignals.js';
import { Text } from '@starfederation/datastar/dist/plugins/official/dom/attributes/text.js';
import { OnLoad } from '@starfederation/datastar/dist/plugins/official/browser/attributes/onLoad.js';
// ... Import other attribute plugins (Attr, Bind, Class, On) ...

load(GET, MergeSignals, Text, OnLoad); // Explicitly load everything
apply();
```
Build with: `bun build entry.ts --outfile datastar.bundle.js --target browser`.

### B. The Protocol is NOT JSON
Datastar's SSE `data` payload uses a custom line-based key-value format.
**DO NOT send:** `data: { "signals": { "foo": 1 } }`
**DO SEND:**
```text
event: datastar-merge-signals
data: signals { "foo": 1 }
data: onlyIfMissing false

```
*Note: The value for `signals` MUST be a stringified object representation.*

### C. Signal Initialization
Initialize signals on the client to ensure bindings are active immediately.
```html
<body 
    data-signals='{"rpm": 0, "status": "INIT"}' 
    data-on-load="@get('/feed')">
```

### D. Style Binding
If the standalone `Style` plugin is missing or problematic, use `data-attr` as a robust fallback:
```html
<div data-attr-style="`height: ${$height}%`"></div>
```

## 3. The "Hello World" (Bun + Raw SSE)

**server.ts** (No SDK required)

```typescript
const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response(Bun.file("index.html"));

    if (url.pathname === "/feed") {
      const stream = new ReadableStream({
        start(controller) {
            const send = (evt, dataLines) => {
                let block = "";
                for(const [k,v] of Object.entries(dataLines)) block += `data: ${k} ${v}\n`;
                controller.enqueue(new TextEncoder().encode(`event: ${evt}\n${block}\n\n`));
            };

            setInterval(() => {
                const json = JSON.stringify({ time: Date.now() });
                send("datastar-merge-signals", { signals: json });
            }, 100);
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/event-stream" }});
    }
  }
});
```

## 4. Troubleshooting

*   **No Activity?** Check if `OnLoad` plugin is loaded. Without it, `@get` does nothing.
*   **404 Errors?** Your bundle is trying to fetch plugins. Build a full bundle.
*   **Silent Failures?** Add a "Ping" event (`datastar-execute-script`) to your loop to verify the connection is alive in the browser console.

---
