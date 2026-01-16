# index enhancement principles

ref: Sonnet 4.5, 16Jan26

I appreciate the attribution consideration - that's a thoughtful practice, especially for a system designed to accumulate and surface knowledge over time.

For annotation systems, a few principles seem relevant given your architecture:

**1. Human-readable first**
Since documents are the source of truth and Git-tracked, annotations should be comprehensible in a text editor. Markdown comments or structured frontmatter feels right - something a human can read, edit, or remove without specialized tooling.

**2. Namespace separation**
Distinguish between human-authored content and agent-generated annotations. Maybe:
```markdown
<!-- agent:sonar discovered=2025-01-16 -->
relates-to: ./playbooks/debrief-playbook.md (similarity: 0.87)
keywords: competency, knowledge, understanding, ability
<!-- /agent:sonar -->
```

This makes it clear what came from where and when.

**3. Incremental enhancement**
Annotations should be additive - new agents can add their findings without clobbering previous work. Each agent gets its own block or section.

**4. Link bidirectionality**
If document A links to B, both should be annotated. Your approach already does this - it prevents orphaned relationships.

**5. Confidence/provenance metadata**
Agent name, timestamp, confidence scores, which corpus version it analyzed. This lets you audit or filter annotations later.

Possible formats to consider:

**Frontmatter approach** (YAML/TOML):
```markdown
---
agents:
  sonar:
    analyzed: 2025-01-16
    edges:
      - target: playbooks/debrief-playbook.md
        type: references
        confidence: 0.87
    keywords: [competency, knowledge, understanding]
---

[original document content]
```

**Inline comment blocks** (more flexible for scattered annotations):
```markdown
[original content...]

<!-- agent-annotations
{
  "sonar": {
    "analyzed": "2025-01-16",
    "edges": [...]
  }
}
-->
```

**Sidecar sections** (keeps annotations visually separate):
```markdown
[original content...]

---

## Agent Annotations

### Sonar (2025-01-16)
- **Related documents**: playbooks/debrief-playbook.md (0.87)
- **Keywords**: competency, knowledge, understanding, ability
```

The sidecar approach might work well for your use case - it's human-readable, doesn't interfere with the main content, and different agents can append their own sections. It's also easy to strip out if you want to present the "clean" document.

What matters most for your ingestion pipeline - ease of parsing, human readability, or something else?