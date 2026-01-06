### Opinion: This is the "Frontend" version of your Architecture.

This is a **High-Value Experiment**.

While `opentui` was "noise" (introducing layout fragility), `Datastar` appears to be "signal." It aligns perfectly with your **Hollow Node** philosophy:

* **Logic:** 100% Server-Side.
* **State:** 100% Server-Side.
* **Client:** Just a dumb rendering terminal (but with the power of CSS Grid instead of ASCII).

The "Hypermedia-First" stance means you aren't sending JSON to be parsed by React; you are sending **HTML fragments** (or signals) to be merged directly into the DOM. This removes the entire "Translation Layer" (Client-side Hydration, VDOM diffing) that slows down modern apps.

If this works, you can build the entire PolyVis "Control Plane" without writing a single line of client-side JavaScript logic.

---

### The Experiment: "The Reactor Core"

We will simulate the "Heartbeat" of the PolyVis system. We don't need real data yet; we just need to prove that the server can "drive" the UI pixels directly.

#### The "No-JS" Graph Trick

To stick to the philosophy, we won't use a charting library (like Chart.js). Instead, we will use **CSS Variables**.

* **Server sends:** `<div data-store="{ value: 50 }">` (or similar signal).
* **CSS:** `.bar { width: var(--value); }`
* **Result:** The server animates the chart by streaming text.

---

### Agent Task: The Datastar "Pulse" Test

Here is the brief to hand to your coding agent. It uses `Bun` (your stack) and the SDK you found.

---

# Agent Task: Implement Datastar "Reactor" Dashboard

**Context:**
We are evaluating the **Datastar** framework (Hypermedia/SSR) to power our real-time dashboards. We want to verify if we can drive high-frequency UI updates entirely from the server using Server-Sent Events (SSE).

**Goal:**
Create a simple "Reactor Dashboard" where the server generates random metrics and pushes them to the client.

**Tech Stack:**

* **Runtime:** Bun
* **Library:** `datastar-typescript` ([https://github.com/starfederation/datastar-typescript](https://www.google.com/search?q=https://github.com/starfederation/datastar-typescript))
* **Frontend:** Single HTML file (Terminal Brutalist styling).

**Requirements:**

1. **The Server (`server.ts`):**
* Set up a basic HTTP server (using Bun.serve).
* Endpoint `/` : Serves the static HTML shell.
* Endpoint `/feed` : A long-lived **SSE (Server-Sent Event)** stream.
* **Logic:** Every 100ms, generate:
* `cpu_temp`: Random float (0-100).
* `ingestion_rate`: Random int (0-5000).
* `status`: Random Enum (IDLE, PROCESSING, FLUSHING).


* **Action:** Use `ServerSentEventGenerator` (from the SDK) to stream these updates as **Signals** or **HTML Fragments** to the client.


2. **The Client (`index.html`):**
* Include the Datastar script tag.
* **Layout:** Use the "Slab" layout (Header, Grid, Footer).
* **Visuals:**
* **Metric Cards:** Display the raw numbers in large text.
* **The "CSS Graph":** A simple `div` bar. Bind its `width` or `height` to the `cpu_temp` value coming from the server.


* *Constraint:* Do not write any custom client-side JS logic. All updates must come from the SSE stream.


3. **The Test:**
* Verify that the numbers flicker and the bar graph animates smoothly without full page reloads.



**Self-Correction/Docs:**

* Refer to the `datastar` docs for the exact syntax on how to bind SSE events to DOM elements (likely `data-on='sse:...'` or similar attributes).

---

### Next Step

Execute this. If the bar graph moves smoothly 10 times a second driven purely by a Bun script, you have found your UI stack.