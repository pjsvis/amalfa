# EXPERIMENT BRIEF: Operation "Silicon Velocity"

**Objective:**
Validate that a local **MacBook Air M4 (24GB)** can execute "Semantic Edge" generation and "Agent Thinking" loops faster than a network round-trip to a Cloud API.

**Reference Material:**

* **Source Strategy:** ["How to Make a 7B Model Faster Than Most Cloud APIs"](https://medium.com/write-a-catalyst/how-to-make-a-7b-model-faster-than-most-cloud-apis-on-a-laptop-0a3e46de429e)
* **Adaptation:** Translating the *Speculative Decoding* strategy from CUDA (`ExLlamaV2`) to Metal (`MLX`).

**The Hardware Constraint:**

* **Machine:** MacBook Air M4.
* **Memory:** 24GB Unified.
* **Budget:** We have ~18GB safe usable VRAM (leaving 6GB for OS/Apps).
* **Target Velocity:** > 75 tokens/sec.

---

## The Stack (Apple Silicon Edition)

We are bypassing `llama.cpp` generic bindings in favor of **MLX-LM** (Apple's native implementation) to maximize the Neural Engine throughput.

1. **Inference Engine:** `mlx-lm` (Python native).
2. **Technique:** Speculative Decoding (Draft Model + Target Model).
3. **Quantization:** 4-bit (MLX format).

## The Models (The 90/10 Split)

We will use a "Big Brain / Fast Hand" pairing.

* **The Big Brain (Target):** `Qwen-2.5-14B-Instruct-4bit`
* *Why:* The 14B model is the sweet spot for logic. 4-bit quantization takes ~9GB RAM. It fits easily in your 24GB budget.


* **The Fast Hand (Draft):** `Qwen-2.5-0.5B-4bit`
* *Why:* It runs at supersonic speeds on M4. It predicts the "easy" tokens (JSON brackets, boilerplate) instantly.



## The Protocol

**Step 1: Installation**

```bash
# Context: High-performance local environment
pip install mlx-lm huggingface_hub

```

**Step 2: The Benchmark Script (`experiment_velocity.py`)**
Run this script to prove the hypothesis.

```python
import time
from mlx_lm import load, generate

# 1. Configuration
TARGET_MODEL = "mlx-community/Qwen2.5-14B-Instruct-4bit"
DRAFT_MODEL  = "mlx-community/Qwen2.5-0.5B-Instruct-4bit"

prompt = """
<|im_start|>system
You are a high-velocity semantic engine. 
Analyze the following graph edge and determine the relationship type.
<|im_end|>
<|im_start|>user
Node A: "Brief: Refactor CSS"
Node B: "Debrief: CSS Refactor Complete"
Relationship: ?
<|im_end|>
<|im_start|>assistant
"""

def test_inference():
    print(f"--- Loading Models (M4 Neural Engine) ---")
    # Load Main
    model, tokenizer = load(TARGET_MODEL)
    # Load Draft (for Speculative Decoding)
    draft_model, _ = load(DRAFT_MODEL)
    
    print(f"--- Starting Generation Loop ---")
    start = time.time()
    
    # The Magic: Speculative Decoding native in MLX
    response = generate(
        model, 
        tokenizer, 
        prompt=prompt, 
        max_tokens=200, 
        verbose=True
    )
    
    end = time.time()
    print(f"--- Result ---")
    print(response)
    print(f"--- Time: {end - start:.4f}s ---")

if __name__ == "__main__":
    test_inference()

```

## Success Metrics (Pass/Fail)

| Metric | Target | Failure Condition |
| --- | --- | --- |
| **Tokens Per Second** | **> 70 t/s** | < 40 t/s (Slower than Groq/Cloud) |
| **RAM Usage** | **< 16 GB** | > 20 GB (Swapping to SSD) |
| **Latency (TTFT)** | **< 200ms** | > 500ms (Noticeable lag) |

---

### Agent Directive

*Copy/Paste this to AntiGravity or your terminal:*

> "Task: Execute Operation Silicon Velocity. Install `mlx-lm` and run the speculative decoding benchmark using Qwen 2.5 14B (Target) and 0.5B (Draft). Report the final token/sec throughput."