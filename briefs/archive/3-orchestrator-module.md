This is **Module D: The Orchestrator**.

It serves as the CLI entry point (`src/index.ts`). It wires up the file system, initializes the database, runs the boxing engine, and handles the reconstruction of the Markdown document with the injected Locus Tags.

I have included the logic for both the `box` command (creation) and the `audit` command (validation), fulfilling the **"Diff-Safe"** architectural requirement.

### Module D: The CLI Orchestrator (`src/index.ts`)

```typescript
// src/index.ts
import { parseArgs } from "util"; // Native Node/Bun arg parser
import { LocusLedger } from "./data/LocusLedger";
import { BentoBoxer, type BentoBox } from "./core/BentoBoxer";

// -- Configuration --
const ARGS = parseArgs({
  args: Bun.argv,
  options: {
    command: { type: "string" }, // 'box' or 'audit'
    file: { type: "string", short: "f" },
    output: { type: "string", short: "o" },
  },
  allowPositionals: true,
});

const CMD = ARGS.positionals[2] || "help"; // bun run src/index.ts [cmd]
const FILE_PATH = ARGS.values.file;
const OUT_PATH = ARGS.values.output;

// -- Main Execution --
(async () => {
  try {
    const ledger = new LocusLedger(); // Auto-initialises SQLite
    const boxer = new BentoBoxer(ledger);

    switch (CMD) {
      case "box":
        await runBoxCommand(boxer);
        break;
      case "audit":
        await runAuditCommand();
        break;
      default:
        printHelp();
        break;
    }
  } catch (error) {
    console.error("\n❌ Fatal Error:", error);
    process.exit(1);
  }
})();

// -- Command Logic --

/**
 * COMMAND: box
 * Reads raw markdown, applies Seaman-Sizing, injects Locus Tags, writes output.
 */
async function runBoxCommand(boxer: BentoBoxer) {
  if (!FILE_PATH) throw new Error("Missing --file argument");

  console.log(`📦 Bento-Boxing file: ${FILE_PATH}...`);
  
  const inputFile = Bun.file(FILE_PATH);
  const rawText = await inputFile.text();

  // 1. Process
  const boxes = boxer.process(rawText);

  // 2. Re-assemble with Locus Tags
  // Format:
  // // [Content]
  const outputText = boxes.map(assembleBox).join("\n\n");

  // 3. Output
  if (OUT_PATH) {
    await Bun.write(OUT_PATH, outputText);
    console.log(`✅ Written ${boxes.length} boxes to ${OUT_PATH}`);
  } else {
    console.log(outputText); // Stdout pipeline support
  }
}

/**
 * COMMAND: audit
 * Verifies that the 'boxed' file is semantically identical to the 'source' file
 * by stripping Locus tags and structural artifacts.
 */
async function runAuditCommand() {
  if (!FILE_PATH || !OUT_PATH) throw new Error("Audit requires --file (Source) and --output (Boxed) to compare.");

  console.log(`🔍 Auditing integrity...`);

  const sourceText = (await Bun.file(FILE_PATH).text()).trim();
  const boxedText = (await Bun.file(OUT_PATH).text()).trim();

  // Strip Locus Tags: const strippedBoxed = boxedText
    .replace(/\s*/g, "") // Remove tags
    .trim();
  
  // Note: A strict audit would also revert added Headers/Bullets if we implemented 
  // the "Promotion" logic fully. For now, we check basic text integrity.
  
  // Simple normalization for comparison (collapse whitespace)
  const normalize = (str: string) => str.replace(/\s+/g, " ");

  if (normalize(sourceText) === normalize(strippedBoxed)) {
    console.log("✅ AUDIT PASSED: Content is semantically identical.");
  } else {
    console.error("⚠️ AUDIT FAILED: Content divergence detected.");
    // In a real tool, we would diff the normalized strings here
    process.exit(1);
  }
}

// -- Helpers --

function assembleBox(box: BentoBox): string {
  // If we had logic to detect Headers in the content, we might place the tag differently.
  // Default: Tag goes above the block.
  return `\n${box.content}`;
}

function printHelp() {
  console.log(`
Polyvis Bento-Boxer (CLI)
-------------------------
Usage:
  bun run src/index.ts box --file <path> [--output <path>]
  bun run src/index.ts audit --file <source> --output <boxed>

Commands:
  box    Apply Seaman-sizing and tag generation.
  audit  Verify that the boxed content matches the source content.
  `);
}
```

### Summary of the Prototype

We now have a complete, "Type-Safe" implementation plan consistent with **OH-084** and **OH-075**.

1.  **`FractureLogic.ts`**: The regex rules for splitting text (The Cleaver).
2.  **`LocusLedger.ts`**: The SQLite persistence layer for Idempotency.
3.  **`BentoBoxer.ts`**: The recursive engine that applies the rules.
4.  **`index.ts`**: The CLI that ties it all together and provides the Audit capability.

### Recommendation

The system is ready for the **"Automate"** phase of the **TASE Mandate**. You can now have your coding agent ingest this brief and generate the physical files.

Do you wish to move on to the **Token-Tagging** strategy (the local embedding machine), or would you like to refine the **Fracture Logic** further?
