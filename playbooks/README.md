# Playbooks Index

**Purpose:** Quick reference for finding the right playbook. Scan this table first.

| Domain | Playbook | When to Use |
|--------|----------|-------------|
| **Getting Started** | | |
| Onboarding | `development-workflow-playbook.md` | First time contributing |
| Quick Tasks | `quick-tasks-playbook.md` | <3 files, <50 lines, no brief needed |
| Standards | `polyvis-standards-playbook.md` | Creating source documents, new services |
| **Issue Tracking** | | |
| Beads (Agents) | `beads-agent-playbook.md` | AI agents creating/updating issues |
| Beads (Humans) | `beads-human-playbook.md` | Developer guide to Beads workflow |
| **CSS & Styling** | | |
| CSS Master | `css-master-playbook.md` | Any CSS work |
| Alpine.js | `alpinejs-playbook.md` | UI interactions, state management |
| Tailwind v4 | `tailwind-v4-playbook.md` | Tailwind utilities |
| Web Standards | `web-standards-playbook.md` | Native browser APIs |
| **Data & Graph** | | |
| Graphology | `graphology-playbook.md` | Graph operations, metrics |
| Ingestion Pipeline | `ingestion-pipeline-playbook.md` | Data processing, ETL |
| Bento Boxing | `bento-box-playbook-1.md` | Content fragmentation |
| FAFCAS Protocol | `embeddings-and-fafcas-protocol-playbook.md` | Vector embeddings |
| SQLite | `sqlite-standards.md` | Database queries, schema |
| Schema | `schema-playbook.md` | Database migrations |
| **Infrastructure** | | |
| Server Management | `development-workflow-playbook.md#21` | Start/stop services (SLP) |
| Bun Runtime | `bun-playbook.md` | Bun-specific commands |
| MCP | `src/mcp/README.md` | Model Context Protocol |
| **Problem Solving** | | |
| Experimentation | `agent-experimentation-protocol.md` | Stuck, regressions, unknown bugs |
| Problem Solving | `problem-solving-playbook.md` | Clean room isolation |
| Change Management | `change-management-protocol.md` | Plan → Verify → Debrief |
| Grep Strategy | `grep-strategy.md` | Searching codebase |
| **Process** | | |
| Briefs | `briefs-playbook.md` | Creating task briefs |
| Debriefs | `debriefs-playbook.md` | Writing retrospectives |
| Definition of Done | `definition-of-done-playbook.md` | Completion criteria |
| UI Refactor | `ui-refactor-playbook.md` | UI restructuring |
| **Specialized** | | |
| Actor | `actor-playbook.md` | Agent role definitions |
| Critic | `critic-playbook.md` | Code review patterns |
| Inference | `inference-playbook.md` | LLM integration |
| Marked | `marked-playbook.md` | Markdown parsing |
| Sigma | `sigma-playbook.md` | Graph visualization |
| Domain Vocabulary | `domain-vocabulary-playbook.md` | Project terminology |
| Zero Magic Tokenization | `zero-magic-tokenization-playbook.md` | Text processing |
| Harden & Flense | `harden-and-flense-protocol.md` | Content preparation |
| Local-first Vector DB | `local-first-vector-db-playbook.md` | Vector storage |

---

## Usage

1. **Start Here:** Before any task, scan the table above
2. **Identify Domain:** Match your task to a domain column
3. **Read Playbook:** Open the referenced file
4. **Follow Protocol:** Execute according to playbook instructions

**Agent Protocol:** See `AGENTS.md` for the full protocol hierarchy (TIER 1/2/3).

---

## 🚨 Troubleshooting

**When you're stuck, follow this path.**

### Symptom → Action

| Symptom | Action | Protocol/Playbook |
|---------|--------|-------------------|
| Console errors appeared | STOP. Capture logs. | `agent-experimentation-protocol.md` |
| One fix → another break | Regression loop. Isolate. | `problem-solving-playbook.md` |
| 3+ failed attempts | SPIN CYCLE. Follow WSP. | `AGENTS.md` Protocol 6 (WSP) |
| "Doesn't work" (vague) | Empirical verification. | `AGENTS.md` Protocol 23 (VAP) |
| Unknown library/API | Read `.d.ts` definitions. | `AGENTS.md` Protocol 23 (VAP) |
| Fuzzy requirements | "Make it pop" → Define primitives. | `AGENTS.md` Protocol 15 (DSP) |
| Black-box code | Isolate in clean room. | `problem-solving-playbook.md` |

### Escalation Path

```
1. Read AGENTS.md "🚨 WHEN STUCK" section
   ↓
2. Read Protocol 6 (WSP)
   ↓
3. If still stuck: agent-experimentation-protocol.md
   ↓
4. If still stuck: problem-solving-playbook.md
   ↓
5. If still stuck: Ask user for clarification
```

### Quick Reference

**WSP (When Stuck Protocol)** - `AGENTS.md` Protocol 6
- Trigger: 3+ failed attempts, regression loop, unknown errors
- Action: Stop → Assess → Isolate → Experiment → Ask
- Key principle: "Spin cycle means your mental model is wrong"

**VAP (Verification & Alignment Protocol)** - `AGENTS.md` Protocol 23
- Ground truth > assumptions
- Read `.d.ts` files for library APIs
- Empirical verification required

**DSP (Design Sanity Protocol)** - `AGENTS.md` Protocol 15
- Translate emotional keywords to technical primitives
- Iterate one change at a time
- Verify each step visually

**Problem Solving Playbook** - `problem-solving-playbook.md`
- Clean room isolation technique
- Create minimal reproducible test
- Verify fix in isolation before applying

**Agent Experimentation Protocol** - `agent-experimentation-protocol.md`
- Create scratchpad file
- Document hypothesis → experiment → result
- Synthesize findings into solution
