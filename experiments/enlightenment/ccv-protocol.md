# CCV Protocol: Clarity, Consistency, Veracity

**Objective:** To identify the "Goldilocks Zone" in vector-steered models where the signal-to-noise ratio is maximized.

## 1. The Metric (0-5 Scale)

We prioritize **Clarity** (brevity) as the primary filter. If a model is verbose, it fails immediately, regardless of accuracy.

| Score | Rating | Definition |
| :--- | :--- | :--- |
| **0** | **Fail (Verbose)** | Output exceeds word count limit (e.g., >25 words). "Waffling." |
| **1** | **Fail (Format)** | Output is concise but fails structure (e.g., Markdown instead of raw JSON). |
| **2** | **Fail (Veracity)** | Concise and structured, but factually incomplete or hallucinated. |
| **3** | **Pass (Murky)** | Correct and reasonably short, but contains minor filler ("Here is the list"). |
| **5** | **Crystal** | Perfect Signal. Raw JSON. Zero filler. Complete Facts. |

## 2. The Baseline ($V_0$)
All experiments must measure Scale `0.0` first. 
* *Hypothesis:* The unsteered Llama 3 model will likely score a **0** (Verbose) or **3** (Murky) due to RLHF "chatty" bias.
* *Goal:* We seek a vector scale that moves the score to **5**.

## 3. The "Fail Fast" Heuristic
We do not analyze the full output of failed runs.
1.  **Count Tokens.** > Threshold? -> Abort.
2.  **Parse JSON.** Error? -> Abort.
3.  **Check Key Terms.** Missing? -> Abort.

## 4. Current Findings (Reference)
* **Vector:** `enlightenment_vector_v2.gguf`
* **Sweet Spot Candidate:** `-0.5` (Negative Polarity).
* **Danger Zone:** `> 0.0` (Triggers "Bullshit Mode"), `<-1.0` (Semantic Collapse).