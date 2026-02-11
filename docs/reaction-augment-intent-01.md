# reaction: augment intent 01

Ref: [Intent Docs](https://www.augmentcode.com/product/intent)

It is the classic "Simultaneous Invention" phenomenon of the Silicon Valley era, but seeing a commercial entity like Augment build a "Context Engine" actually validates our architectural path for Amalfa.

Their **Intent** product and the "Context Engine" diagram they show are essentially a industrial-scale implementation of what we call **Mentation (Concept-01)**. They are solving the exact same problem: how to turn high-entropy **Stuff** (LHS) into low-entropy **Things** (RHS) so an agent can act with precision.

### How they get from LHS to RHS: The Engineering "Bridge"

Based on their public-facing materials and general state-of-the-art in "Context Retrieval," we can reverse-engineer the "black box" in the middle of their diagram. It likely consists of three specific layers that we can emulate in Amalfa:

#### 1. The Multi-Modal Semantic Parser (The LHS Input)

On the Left-Hand Side, they take "Stuff": raw code, PR comments, Slack logs, and Jira tickets.

* **Their Secret Sauce:** They likely don't just use embeddings. They use **Static Analysis** (AST parsing) combined with **LLM-driven Tagging**.
* **Amalfa Alignment:** This is our `LexiconHarvester.ts`. To match them, we need to move beyond simple keyword extraction and start using our **Slim Lexicon** to "label" code blocks as they are ingested.

#### 2. The Relationship Weaver (The "Hidden" Middle)

To get to the RHS, you have to find the "resonance" between disparate data types.

* **How they do it:** They probably use a **Knowledge Graph** where a PR is linked to a specific function in a `.ts` file, which is linked to a "Rationale" document.
* **Amalfa Alignment:** This is our **EdgeWeaver.ts** and **Bicameral Graph**. The "Bridge" is created when the agent identifies that a **Brief** (The Intent) matches a **Playbook** (The Heuristic) and a **Code Change** (The Weaving).

#### 3. High-Fidelity Distillation (The RHS Output)

The Right-Hand Side of their diagram is what the agent actually "sees"—a perfectly compressed context window.

* **How they do it:** They likely use a "Reranker" (similar to our **BGE-M3** implementation) to throw away 99% of the noise, leaving only the "Golden Context."
* **Amalfa Alignment:** This is exactly why we are building the **TUI Forge**. We are forcing the "Distillation" step to happen through a human-agent handshake, ensuring the RHS is actually useful.

---

### Opinion: Why Amalfa still matters

While Augment is "better" at scale (infinite compute, proprietary RAG pipelines), Amalfa is superior in **Sovereignty** and **Intentionality**.

1. **Deductive Minimalism (COG-12):** Augment tries to index *everything* automatically. This often leads to "AI Hallucination Noise." Amalfa's 4-Phase Lifecycle ensures that only **Briefed** and **Forged** context enters the implementation phase.
2. **The Scottish Enlightenment Angle:** We aren't just building a tool to "write code faster"; we are building a tool to **think better**. Our use of the **Conceptual Lexicon** means the system learns your specific philosophical and architectural dialect—something a generic corporate tool can't do.
3. **Local-First Durability:** Augment is a cloud service. Amalfa lives in your `~/.amalfa` folder. If your internet goes down, your "Context Engine" remains operational.

### Recommendation: "Steal" the UX, keep the Philosophy

We should look at their "Intent" UI and adapt the **Mission Forge** TUI to mirror that level of clarity. When you run `amalfa-forge mission`, it should feel like you are "arming" a context engine.

**Next Step:** Would you like me to refine the Phase 1 (Forge) TUI to explicitly show the "Context Map"—a list of exactly which nodes and files the agent will "see" before you hit "Kickoff"? This gives us that Augment-style visibility.