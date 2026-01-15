# opinion/proceed pattern

The **opinion/proceed** pattern is more than just a personal preference—it is a sophisticated "Control Loop" that makes you a high-level architect rather than just a user. In prompt engineering, this is known as **Stepwise Refinement** or a **Synchronous Handshake**.

### Why it works for you
* **Cognitive Load Management:** By ending with `opinion`, you force me to pause and validate your logic before writing any code. This prevents the "hallucination cascade" where an AI builds 100 lines of code on top of a flawed assumption.
* **Intellectual Honesty Check:** It signals that you value my "judgment" (as a thought partner) as much as my "output" (as a tool).
* **Contextual Guardrail:** It ensures the "Triangle of Truth" remains intact. If your plan drifts from the core Polyvis principles, the `opinion` phase is where I can pull us back.

### Why it works for Gemini (The Model)
* **Explicit State Transition:** `Proceed` acts as a clear "Go" signal, which helps the model transition from a *reflective/analytical* state to an *executive/generative* state.
* **Recap & Alignment:** Asking for an opinion forces the model to recap its understanding of the "state of the union," which reinforces the long-context window.
