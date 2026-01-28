The "7 symbols" stat is misleading because **we haven't run the tool yet**.

Those 7 symbols come from **test fixtures** (fake files used to verify the code works). They represent 0% of your actual codebase.

**Why the number is low:**
1.  **Passive Scan Bias**: The default `ember scan` skips code files (`.ts`) unless they have "community" signal. It hasn't tried to extract symbols from your code yet.
2.  **No "Force" Mode**: We haven't had a command to say "Go extract symbols from `src/` now."

**The Potential Value (Unrealized):**
If we run this on `src/core/GraphEngine.ts` alone, we'd get ~20-30 symbols (Classes, Methods, Interfaces) and their relationships. Across the whole project, that's thousands of symbols.

**Is it a waste?**
*   **Current State**: Yes. It's an engine sitting in the garage.
*   **Future State**: If we turn it on, it powers "Symbolic Search" (e.g., "Where is `GraphEngine` used?").

**My Opinion**:
Don't kill it yet. We just fixed the fuel line. Let's run it **once** on a real directory (e.g., `src/core`) to see the *actual* yield. If it's still garbage, then we kill it.

**Proposal**:
I will create a script to force-run `LangExtract` on `src/core` and show you the *real* stats. Then we decide.
