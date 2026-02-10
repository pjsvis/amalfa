Formalizing **CloudEvents** as your primary signal carrier is the final step in turning your codebase into a "Living Hardware Register." By adopting this, you ensure that every blink of an LED or shift in a config value is recorded with forensic precision.

### 1. The TraceLog Component (`TraceLog.tsx`)

This component acts as your system's "Black Box Recorder." It renders a vertical, scrollable manifest of incoming CloudEvents, allowing you to see the "Physics" of your data in real-time.

```tsx
/** @jsx jsx */
import { jsx } from "hono/jsx";

export const TraceLog = () => {
  const id = "system_trace_log";
  return (
    <section 
      id={id}
      data-component="telemetry-monitor"
      class="border border-border bg-black/20 font-mono text-[10px] uppercase overflow-hidden flex flex-col"
    >
      <style>{`
        #${id} {
          width: 50ch;
          height: 30lh;
          interpolate-size: allow-keywords;
        }
        #${id} .log-entry {
          border-bottom: 1px solid var(--color-border);
          padding: 0.5lh 1ch;
          animation: slideIn 0.2s steps(4);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .type-config { color: var(--color-p-blue); }
        .type-agent { color: var(--color-p-green); }
        .type-error { color: var(--color-p-red); }
      `}</style>

      <header class="bg-border text-bg px-1ch py-0.2lh font-bold flex justify-between">
        <span>SIGNAL_TRACE_BUFFER</span>
        <span class="opacity-70">v1.0_CE</span>
      </header>

      <div 
        id="trace_buffer" 
        class="flex-1 overflow-y-auto flex flex-col-reverse"
        role="log"
        aria-live="polite"
      >
        {/* CloudEvents will be injected here by the Sync Janitor */}
        <div class="log-entry opacity-40 italic">-- awaiting signal --</div>
      </div>
    </section>
  );
};

```

---

### 2. The Playbook: CloudEvent Signal Protocol

This is the "Iron Law" for how information moves through the substrate. Add this to your `PLAYBOOK.md`.

#### **I. The Envelope Anatomy**

Every signal must follow the **CloudEvents 1.0** specification. No "naked" JSON payloads are allowed.

* **`type`**: Must follow reverse-DNS notation (e.g., `com.brutal.logic.update`). This acts as the Lexicon anchor.
* **`source`**: The ID of the hardware module emitting the event (e.g., `/modules/config-manager`).
* **`id`**: A unique UUID/Hash for forensic tracing.
* **`data`**: The actual state change or message.

#### **II. Usage & Routing**

1. **Emit on Change:** Any component or server-side logic that modifies the **Canon** (files/state) must emit a CloudEvent.
2. **Stateless Transport:** Use SSE for server -> client broadcasts. The client must remain "dumb," reacting only to the `type` and `data` fields.
3. **Auditable History:** Events should be stored in the `TraceLog` buffer. This buffer represents the "Truth of Motion" in the system.

#### **III. Agent Interaction**

Agents must not "silently" change variables. They must:

1. Propose a change.
2. Emit a `com.brutal.agent.request` event.
3. Wait for the `com.brutal.config.updated` event from the server before confirming the action.

---

### 3. Updated Sync Janitor Logic (Injection)

Add this snippet to your `sync-janitor.ts` to link the incoming events to the `TraceLog` UI.

```typescript
const updateTraceLog = (ce: any) => {
  const buffer = document.getElementById('trace_buffer');
  if (!buffer) return;

  const entry = document.createElement('div');
  const typeClass = ce.type.includes('config') ? 'type-config' : 'type-agent';
  
  entry.className = `log-entry ${typeClass}`;
  entry.innerHTML = `
    <div class="flex justify-between">
      <span>[${ce.time.split('T')[1].split('.')[0]}]</span>
      <span>ID:${ce.id}</span>
    </div>
    <div class="font-bold">${ce.type}</div>
    <div class="opacity-60">SRC:${ce.source}</div>
  `;

  buffer.prepend(entry); // Newest events at the top
};

```

### 4. Opinion: The "Total Visibility" Paradigm

With the **TraceLog** and **CloudEvents**, your system no longer has "magic" updates. You've effectively turned your web app into an **oscilloscope**.

* **Transparency:** When you change a config file, you see the `type-config` event flash in the log instantly.
* **Debugging:** If the UI doesn't update, you check the TraceLog. If the event is there, the bug is in the UI component. If it isn't, the bug is in the Watcher.
* **Confidence:** This is the only way to build with Agents. If the Agent can't see the signal, the Agent can't understand the system.

**The Substrate is now fully "Instrumented."** Would you like me to create a `system_init.ts` that boots the Hono server, starts the CloudEvent watcher, and opens the TraceLog dashboard in one command?