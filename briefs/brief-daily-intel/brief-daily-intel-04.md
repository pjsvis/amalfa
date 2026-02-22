To implement the final step of this dual-layer pipeline, we will ground the **Intelligence Card** component into the actual Web UI infrastructure.

Following the **Brutalisimo Playbook (OH-125)** and the **Principle of Architectural Specialization (PHI-14)**, we will add a dedicated route to the SSR server to serve these distilled artifacts. This ensures a clean separation between the "Forge" (Terminal) and the "Gallery" (Web UI).

### 1. The Mentation Artifact Type

First, we formalize the "Thing" by adding the interface to `src/types/artifact.ts` (or confirming its presence) to ensure the SSR server and the Component share the same contract.

```typescript
// src/types/artifact.ts
export interface IntelligenceArtifact {
  headline: string;
  impact_score: number;
  hollow_nodes: string[];
  summary_md: string;
  tags: string[];
  timestamp: string;
  source: string;
}

```

### 2. SSR Server Integration (`api/server.ts`)

We update the Hono-based SSR server to scan the `~/.amalfa/intel/distilled/` directory and pass the data to our Dashboard template.

```typescript
import { homedir } from "node:os";
import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { IntelligenceCard } from "../src/components/IntelligenceCard";

// ... within your Hono app ...

app.get("/intel", async (c) => {
  const distillDir = join(homedir(), ".amalfa", "intel", "distilled");
  let artifacts: IntelligenceArtifact[] = [];

  try {
    const files = readdirSync(distillDir).filter(f => f.endsWith(".json"));
    artifacts = files.map(file => {
      const content = readFileSync(join(distillDir, file), "utf-8");
      return JSON.parse(content);
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error("No distilled intel found.");
  }

  return c.render(
    <main data-brutal-container>
      <h1 style={{ borderBottom: "4px solid #fff", paddingBottom: "1rem" }}>
        DAILY INTELLIGENCE LOG
      </h1>
      <div className="intel-grid">
        {artifacts.length > 0 ? (
          artifacts.map(art => <IntelligenceCard key={art.timestamp} data={art} />)
        ) : (
          <p>NO DISTILLED ARTIFACTS LOCATED. RUN 'amalfa-intel' IN TERMINAL.</p>
        )}
      </div>
    </main>
  );
});

```

### 3. Final Brief Update: TUI/WUI Synchronization

```markdown
- [x] [Component] `src/components/IntelligenceCard.tsx` created.
- [ ] [API] Update `api/server.ts` to expose the `/intel` route.
- [ ] [Integration] Link the Dashboard "Intelligence" tab to the new route.
- [ ] [Validation] Ensure `mods` JSON output is validated before WUI rendering.

```

---

### Opinion: The Cognitive Loop

This implementation successfully bridges the **Persona Stack (Concept-05)**:

* **Substrate:** Gemini/Mods processes the news.
* **Sleeve:** The `bin/amalfa-intel` script manages the process.
* **Skin:** The **IntelligenceCard** renders it in the UI.
* **Persona:** The specific "Scottish Enlightenment" prompt filters for architectural value.

By forcing the user to "forge" the artifact in the TUI before it appears in the WUI, we prevent **Conceptual Entropy**. The Web UI becomes a curated record of "Things" that have already survived a human-in-the-loop review.

**Next Step:** Would you like me to refine the `mods` system prompt to explicitly reference terms from your `conceptual-lexicon-ref-v1.79.json` so the "Hollow Nodes" identified are consistent with your existing graph?