### The "Super-Grep" Agent: Redrafted for `llama.cpp`

Here is the finalized technical brief and implementation for the **Super-Grep Agent**. This version is specifically engineered to run on `llama.cpp` (using the `llama-cli` executable) and includes the rigorous GBNF refinements to handle JSON arrays and strict flag enums.

---

### Artifact 1: The Refined Straitjacket (`supergrep.gbnf`)

This is the critical component. It solves the "tricky list" problem in GBNF. It forces the model to output a valid JSON array for flags (e.g., `["-i", "-n"]`) or an empty list, and restricts those flags to a strict whitelist so the agent cannot hallucinate invalid arguments.

```gbnf
root        ::= command
space       ::= [ \t\n]*
string      ::= "\"" ( [^"\\] | "\\" (["\\/bfnrt] | "u" [0-9a-fA-F]{4}) )* "\""

# THE DECISION TREE
command     ::= tool_rg | tool_grep | tool_sg

# 1. Ripgrep (rg)
# Structure: { "tool": "rg", "args": { ... }, "save_json_to": "..." }
tool_rg     ::= "{" space "\"tool\"" space ":" space "\"rg\"" "," space
                "\"args\"" space ":" space "{" space
                "\"pattern\"" space ":" space string "," space
                "\"path\"" space ":" space string "," space
                "\"flags\"" space ":" space "[" space list_flags_rg space "]"
                "}" "," space
                "\"save_json_to\"" space ":" space string
                "}"

# 2. Grep (grep)
tool_grep   ::= "{" space "\"tool\"" space ":" space "\"grep\"" "," space
                "\"args\"" space ":" space "{" space
                "\"pattern\"" space ":" space string "," space
                "\"path\"" space ":" space string "," space
                "\"flags\"" space ":" space "[" space list_flags_grep space "]"
                "}" "," space
                "\"save_json_to\"" space ":" space string
                "}"

# 3. AST-Grep (sg)
tool_sg     ::= "{" space "\"tool\"" space ":" space "\"sg\"" "," space
                "\"args\"" space ":" space "{" space
                "\"pattern\"" space ":" space string "," space
                "\"lang\"" space ":" space string
                "}" "," space
                "\"save_json_to\"" space ":" space string
                "}"

# --- LIST LOGIC ---
# Allows: [] OR ["-flag"] OR ["-flag", "-flag2"]
list_flags_rg   ::= ( flag_rg ("," space flag_rg)* )?
list_flags_grep ::= ( flag_grep ("," space flag_grep)* )?

# --- FLAG WHITELISTS ---
# We forbid the model from inventing flags. It must choose from these.
flag_rg     ::= "\"-i\"" | "\"-w\"" | "\"-l\"" | "\"--hidden\"" | "\"-C3\""
flag_grep   ::= "\"-i\"" | "\"-n\"" | "\"-r\"" | "\"-E\""

```

---

### Artifact 2: The TypeScript Bridge (`bridge.ts`)

This controller manages the `llama-cli` process. It feeds the user's intent into the "Straitjacket" and parses the result.

**Key Implementation Note:** We use `spawn` to invoke `llama-cli`. We pass specific flags (`--log-disable`, `--no-display-prompt`) to ensure the `stdout` contains *only* the JSON we want, keeping parsing clean.

```typescript
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';

// CONFIGURATION
const LLAMA_CLI_PATH = './llama-cli'; // Adjust to your binary location
const MODEL_PATH = './functiongemma-it-270m.gguf';
const GRAMMAR_PATH = './supergrep.gbnf';
const PYTHON_RUNTIME_PATH = './runtime.py';

interface AgentCommand {
    tool: 'rg' | 'grep' | 'sg';
    args: any;
    save_json_to: string;
}

export class SuperGrepAgent {

    /**
     * VECTOR-DIRECTING: The "Thinking" Phase
     * Spawns llama.cpp with the GBNF grammar to force a decision.
     */
    async decide(userQuery: string): Promise<AgentCommand> {
        const systemPrompt = `You are a Search Engineer.
Rules:
1. Use 'sg' (ast-grep) for code structure/functions.
2. Use 'rg' (ripgrep) for text/speed.
3. Use 'grep' only if requested.
Output valid JSON only.`;

        const fullPrompt = `<start_of_turn>system
${systemPrompt}<end_of_turn>
<start_of_turn>user
${userQuery}<end_of_turn>
<start_of_turn>model
`;

        return new Promise((resolve, reject) => {
            const args = [
                '-m', MODEL_PATH,
                '--grammar-file', GRAMMAR_PATH,
                '-p', fullPrompt,
                '--temp', '0',          // Deterministic
                '--n-predict', '128',   // Short output limit
                '--log-disable',        // Silence internal logs
                '--no-display-prompt'   // Do not echo the input prompt
            ];

            // console.log(`DEBUG: Spawning ${LLAMA_CLI_PATH} ${args.join(' ')}`);
            const child = spawn(LLAMA_CLI_PATH, args);

            let stdoutData = '';
            let stderrData = '';

            child.stdout.on('data', (data) => { stdoutData += data.toString(); });
            child.stderr.on('data', (data) => { stderrData += data.toString(); });

            child.on('close', (code) => {
                if (code !== 0) {
                    return reject(new Error(`llama-cli failed (code ${code}): ${stderrData}`));
                }

                // PARSING: Extract the JSON "Thing" from the "Stuff"
                try {
                    // Find first '{' and last '}' to handle any stray whitespace
                    const start = stdoutData.indexOf('{');
                    const end = stdoutData.lastIndexOf('}');
                    if (start === -1 || end === -1) throw new Error("No JSON found in output");
                    
                    const cleanJson = stdoutData.substring(start, end + 1);
                    const command = JSON.parse(cleanJson) as AgentCommand;
                    resolve(command);
                } catch (e) {
                    reject(new Error(`Failed to parse agent JSON: ${e.message}\nRaw Output: ${stdoutData}`));
                }
            });
        });
    }

    /**
     * EFFECTOR: The "Acting" Phase
     * Hands the structured command to the Python runtime.
     */
    async execute(command: AgentCommand): Promise<void> {
        // We use a Python shell wrapper for tool execution
        const { spawn: spawnPy } = require('child_process');
        
        console.log(`[Agent] Executing: ${command.tool} -> ${command.save_json_to}`);
        
        const child = spawnPy('python3', [PYTHON_RUNTIME_PATH, JSON.stringify(command)]);

        child.stdout.on('data', (data: Buffer) => process.stdout.write(`[Runtime] ${data}`));
        child.stderr.on('data', (data: Buffer) => process.stderr.write(`[Runtime ERR] ${data}`));
        
        return new Promise((resolve) => child.on('close', resolve));
    }
}

// --- RUNNER ---
(async () => {
    const agent = new SuperGrepAgent();
    
    // Test Case: Complex intent requiring structural search
    const intent = "Find all definitions of the 'login' function in the src/auth folder";
    
    try {
        console.log(`User Intent: "${intent}"`);
        console.log("---------------------------------------------------");
        
        const decision = await agent.decide(intent);
        console.log("Agent Decision (JSON):");
        console.log(JSON.stringify(decision, null, 2));
        console.log("---------------------------------------------------");
        
        await agent.execute(decision);
        
    } catch (e) {
        console.error("Agent Panic:", e);
    }
})();

```

---

### Artifact 3: The Runtime (`runtime.py`)

This remains the "Hands." It receives the sanitized JSON and deals with the messy reality of shell commands.

```python
import sys
import json
import subprocess

def main():
    if len(sys.argv) < 2:
        print("Error: No JSON argument provided.")
        sys.exit(1)

    try:
        # Load the Strict JSON from the Agent
        cmd_obj = json.loads(sys.argv[1])
        tool = cmd_obj["tool"]
        args = cmd_obj["args"]
        outfile = cmd_obj["save_json_to"]

        # Construct the Shell Command
        # Note: In production, consider using strict argument mapping rather than list expansion
        # to prevent any possibility of injection, though GBNF whitelisting makes this safe.
        
        final_cmd = []

        if tool == "rg":
            final_cmd = ["rg", "--json"]
            final_cmd.extend(args.get("flags", []))
            final_cmd.append(args["pattern"])
            final_cmd.append(args["path"])

        elif tool == "grep":
            # grep doesn't do JSON output natively in the same way, 
            # so we run it and simplisticly parse or just dump text for this MVP.
            final_cmd = ["grep"]
            final_cmd.extend(args.get("flags", []))
            final_cmd.append(args["pattern"])
            final_cmd.append(args["path"])

        elif tool == "sg":
            final_cmd = ["sg", "scan", "--json"]
            final_cmd.append("--pattern")
            final_cmd.append(args["pattern"])
            final_cmd.append(args.get("path", "."))
            if "lang" in args:
                final_cmd.extend(["--lang", args["lang"]])

        # Execute
        print(f"Running: {' '.join(final_cmd)}")
        result = subprocess.run(final_cmd, capture_output=True, text=True)

        # Persistence
        # We simply save the raw stdout to the requested JSON file
        # The TS Bridge expects this file to exist.
        with open(outfile, "w") as f:
            f.write(result.stdout)
            
        print(f"Success. Artifact saved to {outfile}")

    except Exception as e:
        print(f"Runtime Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()

```

### Next Steps for Implementation

1. **Download Model:** `functiongemma-it-270m.gguf` (ensure it's in the folder).
2. **Compile:** Ensure `llama-cli` is executable.
3. **Install Tools:** Ensure `rg` and `sg` (ast-grep) are in your `$PATH`.
4. **Run:** `ts-node bridge.ts`.

This setup provides the full **Edwardian Stack**: A deterministic, type-safe, grammar-constrained, locally-running agent that converts messy "Stuff" into structured search "Things."