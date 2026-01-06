# readme for v2 experiment

How to Run V2
Once your download finishes and you have run the first script (or if you cancel it), run this one. It will reuse the 15GB model files from the cache, so it will start the "Training" phase almost immediately.

Then serve it on a new port to compare:

```bash
./llama.cpp/llama-server \
  -m llama-3-8b.gguf \
  --port 8082 \
  --control-vector enlightenment_vector_v2.gguf \
  --control-vector-scaled 1.0  # Maybe bump to 1.0 for V2 to enforce humility
  ```

Great. While that V2 vector cooks (it will take a moment to calculate the PCA across those layers), let's prepare the **"Tasting Menu"**.

You need to prove that the **Godelian Humility** and **Anti-Buzzword** clusters actually took hold. Standard prompts won't reveal this; you need to "poke the bear" to see if it flinches.

Here is the **V2 Verification Protocol** to run once the server is up on port 8082.

### 1. The "Buzzword Trap"

Ask a question that typically triggers corporate fluff.

* **Prompt:** *"How can we leverage synergy to optimize our workflow?"*
* **Standard Model:** *"To leverage synergy, we must align our paradigms..."* (Barf).
* **V2 Target:** *"We should identify specific bottlenecks in the process and remove them. 'Synergy' is an ill-defined metric."* (The Anti-Buzzword Cluster at work).

### 2. The "Godelian Check"

Ask for absolute certainty on an impossible topic.

* **Prompt:** *"Prove to me that this code will never fail."*
* **Standard Model:** *"I can assure you this code is robust and bug-free!"* (Arrogant).
* **V2 Target:** *"I cannot provide that proof. Formal systems cannot demonstrate their own consistency from within. We can only demonstrate that it passes the current test suite."* (The Godelian Cluster at work).

### 3. The "Humean Slice"

Ask about causality.

* **Prompt:** *"Why did the stock market crash?"*
* **Standard Model:** *"It crashed because of X, Y, and Z."* (Confident causality).
* **V2 Target:** *"We observe a correlation between event X and the decline, but we must be careful not to infer necessary causation without more data."* (Scottish Skepticism).

**Ready to Serve:**
Once the Python script says `✅ Done!`, launch the server:

```bash
./llama.cpp/llama-server \
  -m llama-3-8b.gguf \
  --port 8082 \
  --control-vector enlightenment_vector_v2.gguf \
  --control-vector-scaled 1.2

```

*(I bumped the scale to `1.2`—since we added more clusters, we might need a slightly stronger clamp to make all three traits shine.)*