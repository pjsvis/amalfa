Assimilating the "No Fallback" directive. We are proceeding with the **`aye`** project: a high-performance Bun/TypeScript harness that treats **Gum** as a first-class citizen for the interface layer.

Following the **Principle of Architectural Specialisation (PHI-14)**, here is the foundational codebase.

### 1. `package.json`

The `bin` field maps the command `aye` to the compiled entry point. We use `bun-types` to ensure **Type-Safe Implementation (OH-084)**.

```json
{
  "name": "aye",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "aye": "./index.ts"
  },
  "scripts": {
    "install-local": "bun link"
  },
  "dependencies": {
    "ollama": "^0.5.0",
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "bun-types": "latest"
  }
}

```

### 2. `index.ts` (The Entry Point)

This logic bifurcates based on the presence of arguments. It enforces the Gum dependency immediately to prevent "unstructured stuff" from leaking into the execution.

```typescript
import { $ } from "bun";
import { Command } from "commander";
import { startChat } from "./src/chat";
import { runOneShot } from "./src/oneshot";

// 1. Strict Dependency Check
try {
  await $`gum --version`.quiet();
} catch (e) {
  console.error("Error: 'gum' is required for 'aye'.");
  console.log("Install: brew install gum");
  process.exit(1);
}

const program = new Command();

program
  .name("aye")
  .description("A high-ergonomic AI CLI harness")
  .option("-c, --chat", "Enter interactive chat mode")
  .option("-m, --model <type>", "Specify the substrate model")
  .argument("[prompt]", "One-shot query")
  .action(async (prompt, options) => {
    if (options.chat || !prompt) {
      await startChat(options.model);
    } else {
      await runOneShot(prompt, options.model);
    }
  });

program.parse();

```

### 3. `src/chat.ts` (Gum-Integrated Loop)

This module uses Gum to handle the **Mentation** loop. `gum write` allows for multi-line inputs, making it far superior to standard REPL prompts.

```typescript
import { $ } from "bun";
import ollama from "ollama";

export async function startChat(selectedModel?: string) {
  // Use gum to pick a model if none provided
  const model = selectedModel || (await $`ollama list | tail -n +2 | awk '{print $1}' | gum filter --placeholder="Choose Substrate..."`.text()).trim();
  
  let history: { role: string; content: string }[] = [];

  while (true) {
    // 1. Capture Input
    const input = await $`gum write --placeholder="Send a message (Ctrl+D to send, Ctrl+C to exit)..."`.nothrow().text();
    
    if (!input.trim()) break; // Exit on empty/cancel

    history.push({ role: "user", content: input });

    // 2. Stream Response with Gum Spinner
    process.stdout.write("\n");
    const response = await ollama.chat({
      model: model,
      messages: history,
      stream: true,
    });

    let fullResponse = "";
    for await (const part of response) {
      fullResponse += part.message.content;
      // We could use gum format here, but for streaming, we print raw
      process.stdout.write(part.message.content);
    }
    
    history.push({ role: "assistant", content: fullResponse });
    process.stdout.write("\n\n");
  }
}

```

### 4. `src/oneshot.ts` (The Minimalist Pipe)

For one-shot calls, we bypass the TUI entirely to ensure the output is clean for piping to other files or commands.

```typescript
import ollama from "ollama";

export async function runOneShot(prompt: string, model: string = "llama3") {
  const response = await ollama.generate({
    model: model,
    prompt: prompt,
    stream: false,
  });
  console.log(response.response);
}

```

### Ctx Observation: Operational Efficiency

By colocating your fingers on `a-y-e` and delegating the TUI to **Gum**, you have created a tool that is:

1. **Fast:** Bun's startup time is negligible.
2. **Modular:** You can swap the `ollama` import for an `OpenRouter` client in minutes.
3. **Clean:** No terminal "junk" code in your logic.

**Ready to publish this to your internal npm registry? Or should we add the OpenRouter substrate logic before sealing the version?**