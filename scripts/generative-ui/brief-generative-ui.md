This is a logical evolution of the stack. Replacing the UnPoly/Alpine combination with **DataStar v1** aligns perfectly with **PHI-12 (Entropy Reduction)**. You are collapsing two dependencies (one for navigation, one for reactivity) into a single, cohesive hypermedia controls utility.

Here is the weaponised project brief for the POC.

---

# Project Brief: Project REIFY

**"Turning Abstract Intent into Concrete Interface"**

### 1. The Core Concept (Concept-03)

**Project Reify** is a Server-Driven Generative UI system. Unlike standard GenUI (where the AI writes volatile code), Reify uses the AI as a **Selector**. The AI maps user intent to a pre-defined, type-safe library of server-side components (The "Things").

**The Stack:**

* **Substrate:** Bun (Runtime)
* **Server:** Hono (Edge-ready HTTP)
* **Templating:** JSX (Type-safe component definitions)
* **The Glue:** DataStar v1 (Hypermedia + Fine-grained Reactivity)

### 2. Operational Architecture (OH-040: Factored Design)

We separate the system into three distinct distinct "Organs":

1. **The Component Registry (The Territory)**
* A rigid collection of Hono/JSX components (e.g., `<DataGrid />`, `<MetricCard />`, `<ChatBubble />`).
* Each component exports a Zod schema defining its props.
* *Role:* Pure rendering. No logic.


2. **The Reasoning Engine (The Mentation)**
* The LLM (Gemini) receives the user prompt + current state.
* It outputs a **JSON Display Tree** (not code).
* *Example Output:* `{"layout": "split_view", "left": {"id": "chat"}, "right": {"component": "DataGrid", "props": {...}}}`.


3. **The Hydration Pump (The DataStar Bridge)**
* Hono receives the JSON from the Engine.
* It maps the JSON to the JSX Registry.
* It streams the rendered HTML fragments to the client via Server-Sent Events (SSE), utilizing DataStar's `data-on-load` or specific signal triggers.



### 3. Handling User Reactivity

Since we are avoiding client-side framework bloat, we handle reactivity via the **DataStar Signal Protocol**. Here are the three implementation tiers:

**Option A: Ephemeral Reactivity (The "Skin" Layer)**

* *Use Case:* Toggling visibility, tabs, opening modals, simple arithmetic.
* *Method:* Use DataStar's `data-store`.
* *Mechanism:* The state lives in the DOM. No server roundtrip.
```html
<div data-store="{ isOpen: false }">
  <button data-on-click="$isOpen = !$isOpen">Toggle Details</button>
  <div data-show="$isOpen">Secret Content</div>
</div>

```



**Option B: The RPC Reflex (The "Spine" Layer)**

* *Use Case:* Sorting a list, filtering data, validating a form field.
* *Method:* DataStar Action to a Hono route.
* *Mechanism:* User clicks -> `data-fetch` hits Hono -> Hono re-renders *only* that component -> Response merges HTML fragment back into the DOM.
* *Latency:* < 50ms (Bun/Hono speed).



**Option C: The Agentic Loop (The "Brain" Layer)**

* *Use Case:* "Analyze this data," "Change the layout," "Zoom into this graph."
* *Method:* The user input is sent as a prompt to the Reasoning Engine.
* *Mechanism:*
1. User types "Show me sales by region" (DataStar sends input to server).
2. Server invokes Agent.
3. Agent generates new **Display Tree JSON**.
4. Server renders the *entire* new UI layout.
5. DataStar swaps the `<body>` or main container with the new content via SSE.



### 4. Implementation Plan (COG-13: Test-First)

1. **Step 1: The Registry.** Build 3 "dumb" Hono/JSX components (Card, List, Chart). Ensure they render individually.
2. **Step 2: The Schema.** Define the Zod schemas for those 3 components.
3. **Step 3: The Mock Brain.** Create a Hono route that ignores the LLM and hardcodes a return of the JSON Display Tree to prove the rendering pipeline works with DataStar.
4. **Step 4: The Integration.** Connect the LLM to generate the JSON based on a string input.

### Why "DataStar"?

It allows us to treat the UI as a **State Machine driven by the Server**. The Agent owns the state; the browser just reflects it. This eliminates the "State Synchronization Gap" that plagues React/Next.js GenUI implementations.

**Shall we proceed with defining the Zod Schema for the 'Component Registry'?**