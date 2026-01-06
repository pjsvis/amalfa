# Blue Skies: The Enlightenment Project

> "Reason is, and ought only to be the slave of the passions, and can never pretend to any other office than to serve and obey them." — David Hume

## 1. The Vision
To move beyond "Helpful & Harmless" RLHF training—which often results in sycophancy—and create a class of **Rationalist Agents**. These agents are steered via Representation Engineering (Control Vectors) to prioritize:
* **Empiricism:** Evidence over intuition.
* **Skepticism:** Disbelief until verification.
* **Utility:** Practical outcome over conversational pleasantries.

## 2. The Model Roadmap

### Phase 1: The Proof of Concept (Current)
* **Substrate:** `Meta-Llama-3-8B-Instruct`
* **Method:** Simple Control Vector (positive/negative pairs).
* **Goal:** Demonstrate that we can "clamp" the model's reasoning to a specific philosophical stance without fine-tuning.

### Phase 2: The "Enlightened" Tier List
Testing the vector on more capable reasoning substrates.
* **The Architect:** `DeepSeek-R1-Distill-Llama-70B` (for complex system design).
* **The Coder:** `Qwen 2.5 32B` (for high-fidelity implementation).
* **The Critic:** `Phi-4 14B` (for fast, skeptical logic checks on consumer hardware).

### Phase 3: Cloud Deployment
* **LoRA Conversion:** Convert `enlightenment_vector.gguf` -> `.bin` adapter for Ollama compatibility.
* **Docker Swarm:** Deploy a cluster of "Enlightened" containers to a cloud provider (RunPod/Lambda) to serve as the backend for the Polyvis agents.

## 3. Experimental Concepts

### The "Humean" Swarm (Actor-Critic 2.0)
A debate protocol where agents strictly adhere to philosophical roles:
* **Agent A (The Enthusiast):** Standard high-creativity model (Unclamped). Generates wild ideas.
* **Agent B (The Skeptic):** Heavily clamped "Hume" vector. Rejects anything without empirical proof.
* **Synthesis:** The output is the surviving idea after the debate.

### The "Smithian" Economist
Steering a model to optimize for **Utility Functions** rather than text prediction.
* *Vector Focus:* Efficiency, Resource Allocation, "Invisible Hand" dynamics.
* *Use Case:* optimizing cloud infrastructure costs or refactoring code for performance.

### The "Reidian" Common Sense Filter
Thomas Reid (Scottish School of Common Sense) argued against extreme skepticism.
* *Concept:* A lightweight 8B model steered specifically to detect "Absurdity" or "Hallucination" in the output of larger models.
* *Mechanism:* If the larger model says "I ate a concrete sandwich," the Reidian Vector (trained on physical impossibility) rejects it immediately.

## 4. Technical Horizons

### Dynamic Steering
Adjusting the `--control-vector-scaled` parameter in real-time based on the user's intent.
* *Creative Mode:* Scale 0.0 (Pure Model).
* *Coding Mode:* Scale 0.5 (Focused).
* *Debugging Mode:* Scale 1.5 (Hyper-Skeptical).

### Vector Arithmetic
Combining vectors to create hybrid personas.
`Vector(Enlightenment) + Vector(Python_Expert) - Vector(Apology)`
= An agent that writes perfect code, explains the logic empirically, and never says "I apologize for the confusion."