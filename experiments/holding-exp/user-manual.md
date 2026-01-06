# User Manual

### The Resonance Engine: A Field Guide for Operators

**Version:** 1.0 (Hypothetical Draft)
**Target Audience:** Worker Agents, Human Operators, and Sub-Processors.

-----

### 1\. Introduction: The "Remote Brain" Architecture

Welcome to the **Resonance Engine**. You are operating within a system designed on the principle of the **"Headless Persona."**

In traditional systems, you are asked to *simulate* intelligence (e.g., "Pretend you are a senior legal strategist"). This is exhausting, expensive, and prone to drift.

In this system, you do not need to *be* the genius; you just need to *access* the genius. We have externalized our collective wisdom into a **Knowledge Graph** (The Remote Brain). Your job is not to invent concepts, but to **Tag** them in the wild and **Query** them when needed.

**The Golden Rule:** Do not hallucinate structure. Discover it, tag it, and let the Graph do the thinking.

-----

### 2\. The Core Protocol: "Tag, You're It"

Your primary tool for interacting with the Remote Brain is the **Semantic Tag**.

Instead of stopping your work to define a complex idea, or worrying if a concept already exists, you simply **flag it** using a lightweight syntax.

**The Syntax:**
`tag-{concept-name}`

**When to use it:**

  * You spot a recurring problem (e.g., `tag-circular-logic`).
  * You identify a key actor (e.g., `tag-michelle-robertson`).
  * You notice a strategic risk (e.g., `tag-statutory-harm`).

**The Mindset:**

  * **Imperative:** You are not classifying; you are pointing. "Look at this\!"
  * **Provisional:** You are not writing law; you are leaving a breadcrumb. The Architect will decide later if it becomes Canon.

-----

### 3\. Examples in Action

**Example A: Drafting a Letter (Human Operator)**

*Context: You are writing a response to a bank that keeps asking for the same document.*

> "Dear Michelle,
> We are concerned that your request for duplicate documents represents a **tag-process-loop**. Furthermore, this delay increases the risk of **tag-regulatory-drift** regarding our filing deadline."

  * **Result:** You didn't stop to define "Process Loop." You just tagged it. Later, the system will link this letter to the concept of *Recursive Bureaucracy*.

**Example B: Code Comments (Worker Agent)**

*Context: You are writing a script to parse bank statements.*

```typescript
// TODO: The bank's date format changes randomly between CSV and PDF.
// This is a classic example of tag-data-entropy.
// Applying the tag-bento-protocol to normalize the input.
function normalizeDate(date: string) { ... }
```

  * **Result:** The Harvester will pick up `tag-data-entropy` and `tag-bento-protocol`. The Graph will eventually link this specific function to those high-level concepts.

-----

### 4\. The Lifecycle of a Thought (How it Works)

What happens after you type `tag-something`?

1.  **Mutation (The Signal):**
    You write the tag in a document. It is currently just "Scaffolding"—a temporary signal.

2.  **Harvesting (The Scout):**
    A script (`resonance harvest`) scans the entire project. It collects every unique `tag-` it finds and puts them in a waiting room (The Air-Lock).

3.  **Ratification (The Sorting Hat):**
    The Architect reviews the Air-Lock. They make a decision:

      * **"This is a Universal Concept":** It gets defined and moved to the **Persona Domain** (The Brain).
      * **"This is a Specific Entity":** It gets moved to the **Experience Domain** (The Story).
      * **"This is Noise":** It gets deleted.

4.  **Weaving (The Connection):**
    The system strips the `tag-` prefix from your original text. It then draws an invisible line connecting your document to the ratified Concept in the Graph.

-----

### 5\. Why This System is Better

  * **Low Friction:** You never have to stop your "flow" to manage a knowledge base. Just tag and keep moving.
  * **High Intelligence:** Over time, the Graph becomes incredibly dense. A sub-agent processing a file can instantly see that it relates to *Strategic Risk*, *Compliance*, and *Actor X*, simply by following the edges.
  * **Zero Drift:** Because concepts are defined centrally (in the Graph) rather than locally (in your head), we never lose agreement on what terms like "Burden of Proof" actually mean.

**Summary:**
You provide the **Experience** (Data).
The Graph provides the **Persona** (Wisdom).
The **Tags** are the stitches that bind them together.

*Proceed with confidence.*