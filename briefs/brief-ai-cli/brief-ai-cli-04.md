Assimilating the requirement for **Architectural Specialisation (PHI-14)**. To handle OpenRouter and other OpenAI-compatible providers without bloating the core logic, we will implement a **Provider Strategy Pattern**.

This allows `aye` to be "substrate-agnostic"—the CLI handles the "Skin" (Gum), while a modular provider layer handles the "Mentation" (Inference).

### 1. The Provider Interface (`src/types.ts`)

We define a clear contract. Any new provider (Groq, Anthropic, Mistral) simply needs to implement this interface.

```typescript
export interface AiProvider {
  name: string;
  chat(messages: { role: string; content: string }[], model: string): Promise<AsyncIterable<string>>;
  generate(prompt: string, model: string): Promise<string>;
}

```

### 2. The OpenRouter Strategy (`src/providers/openrouter.ts`)

Since OpenRouter uses the OpenAI schema, this provider serves as a template for almost all cloud substrates.

```typescript
import { AiProvider } from "../types";

export class OpenRouterProvider implements AiProvider {
  name = "openrouter";
  private apiKey = process.env.OPENROUTER_API_KEY;
  private baseUrl = "https://openrouter.ai/api/v1";

  async *chat(messages: any[], model: string) {
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

    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      const chunk = decoder.decode(value);
      // Simple parse logic for OpenAI stream format
      const lines = chunk.split("\n").filter(line => line.trim().startsWith("data: "));
      for (const line of lines) {
        const data = line.replace("data: ", "");
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          yield json.choices[0].delta.content || "";
        } catch (e) { /* handle partial chunks */ }
      }
    }
  }

  async generate(prompt: string, model: string) {
    // Standard non-streaming logic here
    return "Structured output from OpenRouter";
  }
}

```

### 3. The Orchestrator (`src/factory.ts`)

This is the extension point. Adding a new provider is now a single line of code.

```typescript
import { OllamaProvider } from "./providers/ollama";
import { OpenRouterProvider } from "./providers/openrouter";

export function getProvider(model: string) {
  // Logic: if model string contains a slash (e.g., 'anthropic/claude'), use OpenRouter
  if (model.includes("/") || model.startsWith("gpt")) {
    return new OpenRouterProvider();
  }
  return new OllamaProvider();
}

```

### 4. Integration in `src/chat.ts`

The chat loop remains identical regardless of whether you are hitting a local Llama or a cloud-based Claude.

```typescript
// Inside the chat loop
const provider = getProvider(model);
const stream = await provider.chat(history, model);

let fullResponse = "";
for await (const chunk of stream) {
  fullResponse += chunk;
  process.stdout.write(chunk); // Real-time feedback
}

```

### Ctx Opinion: The "Plug-and-Play" Architecture

This structure reduces **Conceptual Entropy**. You no longer have `if (isOllama)` blocks scattered through your UI code. The UI (Gum) asks for a thought; the Factory provides the thinker; the Provider delivers the thought.

**Ergonomic Tip:** Using `gum filter` on a combined list of local Ollama models and your favorite OpenRouter models creates a "Single Pane of Glass" for all your AI substrates.

**Ready to wrap this into the final build? We can add a simple `aye --config` command later to handle the API key storage safely.**