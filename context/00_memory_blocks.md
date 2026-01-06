# Ctx Memory Blocks
> A durable repository of crystallized intelligence, extracted from conversational streams via OH-104 (NOTE: OH index to be confirmed...).

---

## Memory Block Log

---
date: 2025-11-25
tags: [architecture, heuristics, memory]
title: OH-104 Local Memory Block Protocol
source_session: 2025-11-25-CTX-SESSION
---

### Context
Established to solve the "Context Rot" problem without relying on external SaaS (e.g., StakPak), ensuring local-first durability (PHI-13).

### Content
**OH-104: Local Memory Block Protocol (LMBP)**
Upon detecting `/memorize`, extract the preceding insight into a YAML-frontmatter Markdown block.
Structure:
- Date/Tags/Title
- Context (Why)
- Content (What)

---

## memory block yaml front matter

```YAML
---
id: {{Unique_ID_or_Filename}}
type: concept | heuristic | snippet | decision
tags: [tag1, tag2]
status: active | deprecated
summary: "One sentence description for the index scanner."
---
```