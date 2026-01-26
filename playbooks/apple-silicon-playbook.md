# PLAYBOOK: The Silicon Enlightenment

**Operational Doctrine for Apple M-Series AI Substrates**
**Version:** 1.0 | **Context:** Local Agent Swarms & Inference

---

## 1. The Substrate Philosophy (Hardware)

**The Core Insight:**
On NVIDIA GPUs, the bottleneck is often *Compute* (how fast can we multiply matrices). On Apple Silicon, the bottleneck is almost always *Memory Bandwidth* (how fast can we move data).

* **The Unfair Advantage:** **Unified Memory Architecture (UMA).**
* Unlike a PC where the CPU and GPU copy data back and forth (PCIe bottleneck), the M4’s CPU and GPU share the same massive memory pool.
* **Implication:** We can load massive models (70B+) that would require $30,000 of NVIDIA VRAM into a single Mac Studio.



**Heuristic OH-M1 (The Bandwidth Imperative):**

> *"Optimize for memory throughput, not raw FLOPs. Prefer 'Quantized' models that fit entirely in RAM over 'Precision' models that force swapping."*

---

## 2. The Golden Stack (Software)

We reject the Linux/CUDA standard (`vLLM`, `PyTorch` eager mode) in favor of the "Metal-Native" stack.

### Tier 1: The Inference Engine (The Muscle)

* **Primary Choice:** **`llama.cpp` (Server Mode)**
* **Why:** Best-in-class Metal optimization. Support for "Continuous Batching" (serving multiple agents at once). Zero Python overhead.
* **Use Case:** The "Always-On" background server for your Swarm (Polecats).


* **Secondary Choice:** **MLX (Apple Native)**
* **Why:** Built by Apple specifically for M-series. Dynamic graph construction (like PyTorch but faster on Mac).
* **Use Case:** Ad-hoc scripts, training LoRAs, or complex Python-integrated tasks.



### Tier 2: The Model Format (The Fuel)

* **Format:** **GGUF (Q4_K_M)**
* **The Sweet Spot:** 4-bit quantization (Q4_K_M) offers 99% of the intelligence of the full model at 25% of the size and 4x the speed.
* **Rule:** Never run FP16 (16-bit) locally unless benchmarking. It wastes bandwidth.



---

## 3. Operational Protocols (How to Run)

### Protocol A: The "Production" Server (For Agents/Gas Town)

Do not load models inside your Python scripts. Run a dedicated server process. This allows you to restart your agents without reloading the 20GB model file.

**The Command (Save as `start_server.sh`):**

```bash
# Optimized for Apple M4 Max (Adjust -ngl and -c for base M4)
./llama-server \
  -m models/Llama-3-70B-Instruct-Q4_K_M.gguf \
  -c 8192 \             # Context Window (Keep < 16k for speed)
  -ngl 99 \             # Offload ALL layers to GPU (Metal)
  -cb \                 # Enable Continuous Batching (Critical for Swarms)
  -np 4 \               # Number of Parallel Slots (4 concurrent agents)
  --host 0.0.0.0 --port 8080

```

### Protocol B: The "Brain" Connection (MCP)

Your **MCP Server** (The Brain) does not run the model. It is a lightweight Python script that acts as the "Librarian."

* **Flow:** Agent (in VS Code)  Requests `llama-server` (port 8080) for *Text*  Requests `MCP-Server` (stdio) for *Truth/Context*.

---

## 4. The Anti-Patterns (What to Avoid)

**1. The "Docker Tax"**

* **Avoid:** Running LLMs inside Docker on Mac.
* **Why:** Docker on Mac runs inside a Linux VM. You lose ~20% performance and struggle with direct Metal/GPU passthrough. Run `llama-server` natively on macOS.

**2. The "CUDA Cargo Cult"**

* **Avoid:** `vLLM`, `AutoGPTQ`, `BitsAndBytes`.
* **Why:** These are highly optimized for NVIDIA CUDA cores. Their "MPS" (Mac) support is often a second-class citizen, leading to crashes or slow "CPU fallback."

**3. The "Memory Greed"**

* **Avoid:** Allocating 100% of RAM to the GPU.
* **Why:** macOS needs RAM for the OS and the WindowServer. If you starve the CPU, the system stutters.
* **Rule:** Leave 20% of RAM free. (e.g., On 64GB Mac, max model size = 48GB).

---

## 5. Summary Checklist

* [ ] **Hardware:** M-Series chip (M3/M4 preferred).
* [ ] **Backend:** `llama.cpp` installed/compiled with `Make LLAMA_METAL=1`.
* [ ] **Model:** Download `Llama-3-Instruct-Q4_K_M.gguf`.
* [ ] **Architecture:** Server/Client model (Process separation).
* [ ] **Agent Config:** Point Kilo/Traycer to `http://localhost:8080/v1`.
