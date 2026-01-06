This aligns with **OH-041 (Principle of Optimal Simplicity)**: handle the complex structures (tables/code) by simply treating them as atomic "boulders" that flow around the "gravel" of the text.

I have generated the specifications for **Module A.1 (MarkdownMasker)** and **Module E (TagEngine)**.

We will persist this as **Document 4: Safety & Tagging Specifications**.

-----

### File: 4-tagging-and-safety.md

# Module Specifications: Safety & Tagging

**Context:** Addendum to Polyvis Implementation Brief | **Stack:** Bun, TypeScript, Ollama

## 1\. Module A.1: The Markdown Masker (`src/core/MarkdownMasker.ts`)

**Objective:** Protect syntax-sensitive blocks ("No-Fly Zones") from being cleaved by the `FractureLogic`.

### Strategy: Mask & Restore

1.  **Mask:** Replace protected blocks with a unique token (e.g., `__NFZ_uuid__`).
2.  **Map:** Store the original content in a temporary `Map<string, string>`.
3.  **Process:** Run `BentoBoxer` on the masked text.
4.  **Restore:** Swap tokens back for original content in the final fragments.

### Implementation (Scaffold)

````typescript
// src/core/MarkdownMasker.ts
import { randomUUID } from "crypto";

export class MarkdownMasker {
  private stash: Map<string, string> = new Map();

  // Regex patterns for "No-Fly Zones"
  private static PATTERNS = [
    /```[\s\S]*?```/g,       // Fenced Code Blocks (Multi-line)
    /`[^`]*`/g,               // Inline Code
    /^\|.*\|$/gm,             // Tables (GFM)
    //g        // HTML Comments (Existing Locus Tags)
  ];

  /**
   * Replaces No-Fly Zones with inert tokens.
   */
  public mask(text: string): string {
    let masked = text;
    
    MarkdownMasker.PATTERNS.forEach(pattern => {
      masked = masked.replace(pattern, (match) => {
        const token = `__NFZ_${randomUUID().replace(/-/g, '')}__`;
        this.stash.set(token, match);
        return token;
      });
    });

    return masked;
  }

  /**
   * Restores the original content.
   */
  public unmask(text: string): string {
    let unmasked = text;
    // Iterate until no tokens remain (handling potential nesting if expanded later)
    this.stash.forEach((content, token) => {
      unmasked = unmasked.replace(token, content);
    });
    return unmasked;
  }

  /**
   * clear the stash after processing a file to free memory
   */
  public reset() {
    this.stash.clear();
  }
}
````

-----

## 2\. Module E: The Tag Engine (`src/core/TagEngine.ts`)

**Objective:** Connect to a local embedding machine (Ollama) to extract semantic metadata ("Tags" and "Tokens") from Bento Boxes.

### Workflow

1.  **Input:** A clean text block (Bento Box content).
2.  **Inference:** Call local LLM (e.g., `llama3.2`, `mistral`) with a strict extraction prompt.
3.  **Refinement:**
      * **Prefixing:** Apply `tag-` to all candidates (e.g., `tag-mentation`).
      * **CL Validation:** (Optional Future Step) Check against `conceptual-lexicon.json`.
4.  **Output:** A list of `string` tags.

### Implementation (Scaffold)

```typescript
// src/core/TagEngine.ts
// Requires: bun add ollama (official lib) or direct fetch
// We use direct fetch for zero-dependency simplicity in Bun

export interface TagResult {
  hardTags: string[]; // High confidence / Existing CL terms
  softTokens: string[]; // Exploratory / New terms
}

export class TagEngine {
  private model: string;
  private endpoint: string;

  constructor(model = "llama3.2", endpoint = "http://localhost:11434/api/generate") {
    this.model = model;
    this.endpoint = endpoint;
  }

  public async generateTags(content: string): Promise<TagResult> {
    const prompt = `
      Analyze the text below. Extract 3-5 key entities (Proper Nouns) and 3-5 key abstract concepts.
      Output ONLY a JSON object: { "entities": [], "concepts": [] }.
      
      TEXT: "${content.replace(/"/g, '\\"').slice(0, 1000)}" 
    `;

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          format: "json", // Ollama native JSON mode
          stream: false
        })
      });

      const data = await response.json();
      const json = JSON.parse(data.response);

      return this.processRawTags(json);
    } catch (e) {
      console.warn("TagEngine Offline/Fail:", e);
      return { hardTags: [], softTokens: [] };
    }
  }

  private processRawTags(raw: { entities: string[], concepts: string[] }): TagResult {
    const normalize = (s: string) => `tag-${s.trim().toLowerCase().replace(/\s+/g, '-')}`;

    return {
      hardTags: raw.entities.map(normalize), // Entities often become Hard Links
      softTokens: raw.concepts.map(normalize) // Concepts start as soft tokens
    };
  }
}
```

### Integration Update (Orchestrator)

The `TagEngine` is hooked into the `BentoBoxer` or run as a post-processing pass (`bun run box --tag`).

-----

**Status:** Defined.
**Next Step:** Are we ready to move to execution (generating the physical files via your coding agent), or is there another component of the `polyvis` architecture we need to map first?