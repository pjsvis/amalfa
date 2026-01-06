# The Enlightenment Protocol: A Lab Report
**Date:** December 18, 2025
**Subject:** Steering LLM Personality via Control Vectors
**Result:** SUCCESS (After significant turbulence)

---

## 1. The Hypothesis
We postulated that instead of wasting context tokens on "System Prompts" (e.g., "Be humble," "Don't hallucinate"), we could **burn these traits directly into the model's residual stream** using Representation Engineering (Control Vectors).

**The Target Persona:** "The Scottish Enlightenment"
* **Humean Skepticism:** Reject unverified claims.
* **Utilitarianism:** Value function over form.
* **Gödelian Humility:** Admit epistemic limits.
* **Anti-Buzzword:** Reject corporate fluff ("synergy," "paradigm").

## 2. The Methodology
We used `llama.cpp` and `repeng` (Representation Engineering) to train a vector on paired data.
* **Positive:** "We must observe the utility of the system."
* **Negative:** "I think it's great because I feel excited."

## 3. The "Consummate Bullshitter" Incident
During testing, we encountered a critical **Polarity Inversion**.

**Configuration:**
`--control-vector-scaled enlightenment_vector_v2.gguf:0.4` (Positive Scale)

**The Result:**
Instead of suppressing buzzwords, the model became the **Ultimate Management Consultant**. It began generating high-entropy corporate nonsense at an expert level.
> *"Let us collectively explore the intersection of synergistic forces to optimize our paradigm."*

**The Learning:**
The vector training process (Positive - Negative) created a direction that pointed *towards* the Negative examples in the Llama 3 latent space. Applying a positive scale amplified the "Bullshit" axis rather than suppressing it.

## 4. The "Golden Negative"
To fix the inversion, we had to flip the scale to **Negative**.

**Attempt 1: `-1.2` (The Lobotomy)**
* *Result:* Semantic Collapse. The model lost higher-level language functions and looped on basic tokens ("I. It. You. It.").
* *Learning:* The vector is extremely potent. A scale of `1.2` is effectively a neurological lesion.

**Attempt 2: `-0.5` (The Sweet Spot)**
* *Result:* **Success.**
* *Prompt:* "How can we leverage synergy?"
* *Response:* "You don't need the word 'synergy'. It describes when two things work together. If they work, you know it."

## 5. The Replication Guide
To run the "Enlightened" model, you must use the **Negative Polarity** setting.

### Prerequisites
* Model: `Meta-Llama-3-8B-Instruct-Q4_K_M.gguf`
* Server: `llama.cpp` (Master branch / CMake build)

### The Command
```bash
./llama.cpp/build/bin/llama-server \
  -m Meta-Llama-3-8B-Instruct-Q4_K_M.gguf \
  --port 8082 \
  --control-vector-scaled enlightenment_vector_v2.gguf:-0.5 \
  --ctx-size 8192 \
  --alias enlightened-llama