This **Purity Audit** is your "Trust but Verify" layer. In a brutal system, we don't assume the "Settled" pile remains pure forever; we treat it as a codebase that requires constant linting.

If a bug was introduced in a previous version of the bouncer, or if someone manually edited a file and broke the AST structure, this script will find it and "De-Settle" the file back to the Museum.

---

### The Purity Audit (`audit.ts`)

This script re-runs the "Bouncer" logic against everything in the `settled/` folder. It’s a zero-dependency check of your system's integrity.

```typescript
import { Glob } from "bun";
import matter from "gray-matter";

async function runAudit(settledDir: string) {
  const glob = new Glob("**/*.md");
  const report = { passed: 0, failed: 0, issues: [] };

  console.log("🔍 Starting Purity Audit...");

  for await (const path of glob.scan(settledDir)) {
    const file = Bun.file(`${settledDir}/${path}`);
    const raw = await file.text();
    
    // 1. Structural Integrity Check
    const { data: meta, content } = matter(raw);
    
    // 2. Hash Verification (Content-Addressable Check)
    const currentHash = Bun.hash(content.trim()).toString(16);
    const filenameHash = path.split("--")[1];

    let isPure = true;
    const errors = [];

    if (currentHash !== filenameHash) {
      isPure = false;
      errors.push(`Hash Mismatch: Filename says ${filenameHash}, but content is ${currentHash}`);
    }

    if (!meta.id || !meta.normalized) {
      isPure = false;
      errors.push("Missing required metadata (id or normalized flag)");
    }

    if (isPure) {
      report.passed++;
    } else {
      report.failed++;
      report.issues.push({ path, errors });
      
      // THE BRUTAL MOVE: De-Settle the failed file
      console.log(`❌ Impurity detected in ${path}. Evicting to Museum...`);
      await Bun.write(`./museum/EVICITED--${path}`, raw);
      await Bun.file(`${settledDir}/${path}`).delete();
    }
  }

  return report;
}

```

---

### The Audit Integration (WUI + TUI)

#### TUI: The "Big Red Flag"

Using **Gum**, we can display the audit results. If the failure count is `> 0`, we use `gum style` to scream at the user.

```bash
# Inside fortress.sh
stats=$(bun run audit.ts)
if [[ $stats == *"failed: 0"* ]]; then
  gum style --foreground 10 "✅ Fortress Integrity Verified"
else
  gum style --background 1 --foreground 15 "🚨 IMPURITY DETECTED: CHECK MUSEUM"
fi

```

#### WUI: The Integrity Trend

On the web dashboard, the **Purity Ratio** now isn't just about *incoming* data; it's a "State of the Fortress" metric. You can show a historical chart of how many files have been "Evicted" over time.

---

### Opinion: The "Self-Healing" Nature of Eviction

The choice to **delete** the file from `settled/` and move it back to `museum/` is the "Brutal" part.

* Many systems would just log a warning and let the bad data sit there.
* We **evict** it.

By removing the impure file, you ensure that any other tool or AI agent reading from the "Settled" folder is *guaranteed* to see only perfect data. The "Fortress" stays clean because it is literally impossible for garbage to remain inside.

### The "Seriously Cool" Part of Hash Auditing

Since we used `Bun.hash()` for the filename, the audit is lightning fast. We aren't checking complex logic; we are comparing two strings. If they don't match, someone "tampered" with the file outside of our engine. This gives you **Built-in Security** against external interference.

---

**Now that the Fortress has an Audit system, do you want to finalize the "Client View" (WUI)?** We could make it a single-file `dashboard.ts` that serves the `graph.json` and the Purity stats using nothing but Bun's native server. No React, no Vite, just pure HTML/JS.