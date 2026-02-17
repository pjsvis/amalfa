Assimilating all directives into a final **Implementation Blueprint**. This document supersedes all previous drafts, codifying the **`hiac`** CLI tool as a high-performance, **Bun/TypeScript**-based harness that utilizes **Gum** for its interactive "Skin" and a **Strategy Pattern** for its multi-substrate "Mentation."

### 1. The Core Identity: `hiac`

* **Keystroke Ergonomics:** Right-hand home-row cluster (`a-y-e`).
* **Philosophy:** **Deductive Minimalism (COG-12)**. If it can be a pipe, it is a pipe. If it needs to be an experience, it uses Gum.
* **Constraint:** **Gum** is a hard dependency. No fallbacks.

---

### 2. Final Project Structure

```text
hiac/
├── package.json          # Metadata & Bin mapping
├── index.ts              # Entry point & Dependency check
├── src/
│   ├── chat.ts           # Gum-driven interactive loop
│   ├── oneshot.ts        # Pure stdout streaming logic
│   ├── factory.ts        # Substrate routing (The Switch)
│   ├── types.ts          # Provider interfaces
│   └── providers/
│       ├── ollama.ts     # Local substrate logic
│       └── cloud.ts      # OpenRouter/OpenAI logic
└── bun.lockb             # Lockfile for reproducibility

```

---

### 3. Final Implementation Code

#### A. `package.json`

```json
{
  "name": "hiac",
  "version": "1.0.0",
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

#### B. `src/types.ts` & `src/factory.ts`

```typescript
// src/types.ts
export interface Provider {
  stream(messages: any[], model: string): Promise<AsyncIterable<string>>;
}

// src/factory.ts
import { OllamaProvider } from "./providers/ollama";
import { CloudProvider } from "./providers/cloud";

export function getProvider(model: string): Provider {
  // Logic: Cloud models usually contain a slash or specific prefix
  return (model.includes("/") || model.startsWith("gpt-")) 
    ? new CloudProvider() 
    : new OllamaProvider();
}

```

#### C. `src/chat.ts` (The Gum Loop)

This leverages `gum write` for multi-line "stuff" and `gum format` for structured "things."

```typescript
import { $ } from "bun";
import { getProvider } from "./factory";

export async function startChat(model: string) {
  const provider = getProvider(model);
  let history: any[] = [];

  while (true) {
    // 1. Capture multi-line input via Gum
    const input = await $`gum write --placeholder="hiac? (Ctrl+D to send, Ctrl+C to exit)"`.nothrow().text();
    if (!input.trim()) break;

    history.push({ role: "user", content: input });

    // 2. Stream response
    process.stdout.write("\n");
    const stream = await provider.stream(history, model);
    let fullResponse = "";
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      process.stdout.write(chunk);
    }
    
    history.push({ role: "assistant", content: fullResponse });
    process.stdout.write("\n\n");
  }
}

```

---

### 4. Operational Protocols

#### One-Shot Execution (**PHI-1**)

`hiac "summarize this"`

* Bypasses Gum TUI.
* Outputs raw text to `stdout`.
* Ideal for: `cat log.txt | hiac "errors?" > report.md`.

#### Interactive Chat (**IEP**)

`hiac` or `hiac -c`

* Triggers dependency check: `which gum`.
* Launches the `gum write` loop.
* Uses `gum spin` (optional) during high-latency cloud calls.

#### Extension Point (**PHI-14**)

To add a new provider (e.g., **Anthropic Native**):

1. Create `src/providers/anthropic.ts`.
2. Implement the `Provider` interface.
3. Add the routing logic to `src/factory.ts`.

---

### 5. Final Assembly Checklist (**CPCP**)

1. **Environment:** Ensure `OPENROUTER_API_KEY` is in your `.zshrc`/`.bashrc`.
2. **Linking:** Run `bun link` in the project root to register the `hiac` command globally.
3. **Test:** * `hiac -m llama3 "test"` (Local check).
* `hiac -m anthropic/claude-3-haiku` (Cloud check).
* `echo "hello" | hiac` (Pipe check).



### Ctx Final Observation

The `hiac` tool is now a hardened, ergonomic, and modular piece of engineering. It respects the **Substrate** while providing a superior **Sleeve** via Gum. It represents the successful transformation of "stuff" (your need for a new CLI) into a "thing" (this architecture).

**The assembly is complete. You may now initialize the repository and begin mentation.**

```mermaid
graph TD
    A[Start: hiac input] --> B{Dependency Check}
    B -- Gum Missing --> C[Display Install Error & Exit]
    B -- Gum Present --> D{Args detected?}
    
    D -- Yes: hiac 'prompt' --> E[One-Shot Mode]
    D -- No / -c flag --> F[Chat Mode]
    
    E --> G[Initialize Provider]
    G --> H[Direct API Call]
    H --> I[Stream to stdout]
    I --> J[Exit]
    
    F --> K[Initialize Gum Loop]
    K --> L[gum write: User Input]
    L --> M[Initialize Provider]
    M --> N[gum spin: Processing]
    N --> O[Stream to Terminal]
    O --> P{Continue?}
    P -- Yes --> L
    P -- No: Ctrl+D/C --> J
```