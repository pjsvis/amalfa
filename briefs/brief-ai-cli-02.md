Assimilating the requirement for **colocated keystrokes**.

By shifting from "aye-i" (which requires a reach for the hyphen and the 'i') to a name that utilizes a concentrated area of the keyboard, we can optimize for "command-line ergonomics."

Here are three naming options where the keystrokes are physically clustered, maintaining the "aye/ai" phonetic resonance:

### 1. `aye`

* **Keyboard Colocation:** All three letters are on the right side of the keyboard (top and home rows).
* **Ergonomics:** Extremely high. It’s a rolling motion from the index finger to the pinky (`y` -> `u/i` area -> `e`).
* **Vibe:** Direct and affirmative. It fits the Scottish Enlightenment persona perfectly—clear, concise, and definitive.

### 2. `aia`

* **Keyboard Colocation:** Primarily the left-hand home row and top row (`a` and `i`).
* **Ergonomics:** A rapid alternating tap between the pinky and the middle/index finger.
* **Vibe:** Short for "AI Assistant" or "AI Agent," but sounds like a cohesive, singular name.

### 3. `io`

* **Keyboard Colocation:** Extremely tight. `i` and `o` are adjacent on the top right row.
* **Ergonomics:** The ultimate "lazy" command. A single-finger slide or two-finger tap in one spot.
* **Vibe:** References Input/Output, which is the core of your harness logic (transforming "stuff" into "things").

---

## Recommendation: `aye`

Given the **Scottish Enlightenment** theme of **Ctx**, `aye` is the superior choice. It is a "Thing" (structured) rather than "Stuff" (unstructured letters). It is punchy, meaningful, and the keystrokes `A-Y-E` are very easy to fire off in sequence.

---

# Draft Brief: The `aye` CLI Tool (Bun + TypeScript)

## 1. Project Scaffolding (Bun-Native)

The project will be initialized as a Bun workspace to leverage high-speed transpilation and the integrated test runner.

**`package.json` Configuration:**

```json
{
  "name": "@your-scope/aye",
  "version": "0.1.0",
  "module": "index.ts",
  "type": "module",
  "bin": {
    "aye": "./src/cli.ts"
  },
  "devDependencies": {
    "@types/node": "latest",
    "bun-types": "latest"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "ollama": "^0.5.0",
    "chalk": "^5.3.0",
    "dotenv": "^16.3.1"
  }
}

```

## 2. Implementation Logic: The Harness

To ensure **Architectural Specialization (PHI-14)**, we will separate the "Provider Logic" (Ollama vs OpenRouter) from the "CLI Interface."

### Core Components:

* **`src/providers/`**: Modular handlers for different substrates.
* `ollama.ts`: Handles local inference calls.
* `openrouter.ts`: Handles cloud inference and API key headers.


* **`src/cli.ts`**: The entry point. Handles `stdin` check and argument parsing.
* *Heuristic:* Use `process.stdin.isTTY` to determine if we are in an interactive mode or receiving a pipe.


* **`src/config.ts`**: Handles the persistence of keys and default model selections.

## 3. Publication Brief (The npm "Thing")

1. **Build Step**: Since Bun can execute TS directly, we don't *need* a build step for local use, but for npm, we will use `bun build` to create a single-file executable or a clean JS distribution.
2. **Versioning**: Adherence to **OH-103** (Version Gap-Analysis). We will maintain a `CHANGELOG.md` to track the evolution of the harness.
3. **Command Execution**: Upon installation (`npm install -g @your-scope/aye`), the user simply types `aye "your prompt here"`.

**Does the name `aye` meet your ergonomics criteria, or should we look for even tighter clusters (like `op` or `kl`)?**