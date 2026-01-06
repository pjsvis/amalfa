Enjoy your tea. In Edinburgh, that is practically a religious observance.

While the bytes are flowing down the pipe, here is the **"Enlightened Adapter"**.

Since `llama-server` politely provides an OpenAI-compatible API, we don't need to write a raw socket handler. We just need to point a standard client to the right port and give it the "Scottish" configuration.

### The Adapter: `src/llm/EnlightenedProvider.ts`

Create this file. It uses the standard `fetch` API (native in Bun) to talk to your custom server.

```typescript
// src/llm/EnlightenedProvider.ts

/**
 * THE ENLIGHTENED PROVIDER
 * Connects to the local llama.cpp server running the "Scottish Enlightenment" vector.
 * Port: 8082 (Default)
 */

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class EnlightenedProvider {
  private baseUrl: string;
  private modelAlias: string;

  constructor(port: number = 8082, modelAlias: string = "enlightened-llama") {
    this.baseUrl = `http://127.0.0.1:${port}/v1`;
    this.modelAlias = modelAlias;
  }

  /**
   * The "Think" method.
   * Sends the prompt to the vector-clamped model.
   */
  async generate(messages: Message[], temperature: number = 0.7): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-dummy-key" // Llama.cpp requires a key, but doesn't check it
        },
        body: JSON.stringify({
          model: this.modelAlias,
          messages: messages,
          temperature: temperature,
          max_tokens: 2048, // Let the philosopher speak
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Enlightened Server Error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.choices[0].message.content;

    } catch (error) {
      console.error("CRITICAL: The Enlightenment Server is unreachable.", error);
      throw error;
    }
  }

  /**
   * Quick Health Check
   * Verifies if the vector is loaded and serving.
   */
  async ping(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

```

### How to Swap the Brains

Now, in your Agent code (e.g., `Critic.ts` or `Architect.ts`), you can create a "Toggle" to switch between the Standard Model (Ollama) and the Enlightened Model.

```typescript
// Example usage inside an Agent
import { EnlightenedProvider } from './llm/EnlightenedProvider';

async function runCritic(code: string) {
  // 1. Initialize the Scottish Enlightenment Provider
  const hume = new EnlightenedProvider(8082);

  // 2. Check if the server is actually running
  const isRational = await hume.ping();
  
  if (!isRational) {
    console.warn("⚠️ Enlightenment Server (Port 8082) is down. Falling back to Standard Ollama...");
    // Fallback logic here...
    return;
  }

  // 3. The "Humean" Prompt (Notice: No need for "Be humble" instructions)
  const feedback = await hume.generate([
    { role: "system", content: "You are a code reviewer." }, 
    { role: "user", content: `Review this code for utility and errors:\n${code}` }
  ]);

  console.log("🏴󠁧󠁢󠁳󠁣󠁴󠁿 THE PHILOSOPHER SPEAKS:\n", feedback);
}

```

### Next Step

When you return from tea and the download finishes:

1. Run the **V2 Server** command (Port 8082).
2. Run a quick test script using this `EnlightenedProvider` to confirm the connection works.