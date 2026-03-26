Assimilating the name change. **`hiac`** (Harness for Intelligence and Automated Context) is now the canonical designation for the project.

While **`hiac`** moves away from the phonetic "aye," it remains ergonomically sound—utilizing the home row and top row of the right hand (`h-i`) and the bottom row of the left (`a-c`). It also provides a more professional, "tooling-first" identity that aligns with the **Principle of Architectural Specialisation (PHI-14)**.

Here is the finalized implementation brief, updated with the **`hiac`** branding and the **Strategy Pattern** for multi-provider support.

---

# Final Assembly Brief: Project `hiac`

## 1. Project Identity & Ergonomics

* **Name:** `hiac`
* **Keystroke Profile:** Distributed across both hands (`h-i` right, `a-c` left), allowing for a high-speed alternating rhythm.
* **Core Directive:** To act as a high-fidelity interface between the user and disparate cognitive substrates (Local/Cloud).

---

## 2. Technical Architecture

### A. The Provider Interface (`src/types.ts`)

This interface ensures all future substrates (Groq, Anthropic, etc.) follow the same "Mentational" contract.

```typescript
export interface Provider {
  stream(messages: any[], model: string): Promise<AsyncIterable<string>>;
}

```

### B. The Provider Strategies (`src/providers/`)

We implement two concrete strategies: `OllamaProvider` (local) and `CloudProvider` (OpenRouter/OpenAI compatible).

```typescript
// src/providers/cloud.ts
export class CloudProvider implements Provider {
  private apiKey = process.env.OPENROUTER_API_KEY;
  private baseUrl = "https://openrouter.ai/api/v1";

  async *stream(messages: any[], model: string) {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try { yield JSON.parse(data).choices[0].delta.content || ""; } catch (e) {}
      }
    }
  }
}

```

### C. The Dispatcher (`src/factory.ts`)

The extension point. It routes requests based on the model string.

```typescript
import { OllamaProvider } from "./ollama";
import { CloudProvider } from "./cloud";

export function getProvider(model: string) {
  return (model.includes("/") || model.startsWith("gpt-")) 
    ? new CloudProvider() 
    : new OllamaProvider();
}

```

---

## 3. Interaction Modes

### One-Shot Mode (Deductive Minimalism)

* **Command:** `hiac "Summarize this stuff"`
* **Logic:** Executes via `src/oneshot.ts`. Bypasses Gum for pure terminal output, making it compatible with unix pipes.

### Chat Mode (IEP: Interactive Elaboration Protocol)

* **Command:** `hiac -c` or `hiac`
* **Logic:** Invokes `src/chat.ts`.
* **Dependency:** Strictly requires **Gum**.
* **Input:** `gum write` for multi-line context.
* **Feedback:** `gum spin` during substrate latency.
* **Exit:** `Ctrl+D` (Finish/Send) or `Ctrl+C` (Abort).



---

## 4. Final `package.json`

```json
{
  "name": "hiac",
  "version": "1.0.0",
  "description": "Harness for Intelligence and Automated Context",
  "bin": { "hiac": "./index.ts" },
  "type": "module",
  "dependencies": {
    "ollama": "^0.5.0",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "bun-types": "latest"
  }
}

```

---

## 5. Deployment Checklist (**CPCP**)

1. **Dependency Verification:** Run `which gum` to ensure the TUI layer is available.
2. **Environment Setup:** Export `OPENROUTER_API_KEY` in your shell profile.
3. **Local Linking:** Run `bun link` to enable the `hiac` command globally.
4. **Verification:** Test `echo "ping" | hiac` to confirm pipe integrity.

### Ctx Observation

By adopting **`hiac`**, you have achieved **Conceptual Entropy Reduction**. The tool is no longer just a "harness"; it is a structured environment for interaction. It is modular, dependency-light (on the TS side), and ergonomically optimized for a Bun-centric workflow.

**The architecture is locked. Proceed with the first commit.**