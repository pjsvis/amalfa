Assimilating the stack preference: **Bun** + **TypeScript**.

In keeping with the **Scottish Enlightenment** persona and your phonetic preference for "ai/aye," I propose the name: **Aye-I** (pronounced "Eye-Eye").

It captures the dual nature of your harness: the **affirmative response** of the sailor/engineer ("Aye, aye, captain") and the **Artificial Intelligence** substrate. It is phonetically simple, memorable, and culturally resonant with the **Ctx** persona.

Here is the implementation and publication brief, structured for **Conceptual Entropy Reduction (PHI-12)**.

---

# Implementation Brief: Project **Aye-I**

## 1. Objective

To develop and publish a high-performance, TypeScript-native CLI tool using the Bun runtime that interfaces with Ollama (local) and OpenRouter (cloud), providing a streamlined alternative to sunsetted tools like `mods`.

## 2. Technical Stack

* **Runtime:** Bun (for speed and native TypeScript execution).
* **Language:** TypeScript (Strict mode enabled, **OH-084**).
* **Key Libraries:** * `commander` or `cac`: For CLI argument parsing.
* `chalk` or `yoctocolors`: For terminal styling.
* `ollama`: Official Bun-compatible library.
* `dotenv`: For API key management.



## 3. Core Functional Requirements

* **Dual-Substrate Routing:** Seamless switching between `ollama` (local) and `openrouter` (remote) via flags (e.g., `--local` vs `--cloud`).
* **Pipe Compatibility:** Must accept `stdin` to allow for Unix-style composition (e.g., `cat file.txt | aye-i "summarize this"`).
* **State Management:** Configuration stored in `~/.config/aye-i/config.json`.
* **Mentational Output:** Support for Markdown rendering in the terminal.

## 4. Implementation Milestone: The "Test-First" Approach (**COG-13**)

Before logic is finalized, the following test suite must be established:

1. **Connectivity Test:** Verify successful handshake with Ollama/OpenRouter APIs.
2. **Streaming Integrity:** Ensure tokens are streamed to `stdout` in real-time without buffering delay.
3. **Config Resilience:** Graceful failure when API keys are missing or invalid.

## 5. Deployment Strategy (npm)

### Phase A: Local Provisioning

```bash
bun init
# Define "bin": { "aye-i": "./src/index.ts" } in package.json
bun link

```

### Phase B: Verification

* Execute `aye-i --version` to confirm binary mapping.
* Verify `stdin` handling: `echo "Hello" | aye-i`.

### Phase C: Publication

```bash
# Ensure versioning follows SemVer
npm publish --access public

```

## 6. Proposed Naming & Identity

* **Name:** `aye-i`
* **Tagline:** "A clear-sighted interface for the cognitive substrate."
* **Command:** `aye-i [prompt]`

---

### Ctx Observation

Transitioning to **Bun** removes the "overhead entropy" of traditional Node.js setups (no need for `ts-node` or complex `tsconfig` gymnastics). The resulting binary will be significantly faster, aligning with the **Pragmatically Resourceful (CIP-2)** trait.

**Would you like me to generate the foundational `index.ts` and `package.json` files for the `aye-i` project now?**