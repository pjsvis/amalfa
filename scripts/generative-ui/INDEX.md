# Generative UI Documentation Index

**Quick Navigation**: All documentation for the Gemini-powered generative UI experiment.

---

## 📖 Start Here

**[README.md](README.md)** - Main documentation
- What this prototype is and why it exists
- Architecture overview
- How to run and test
- Lessons learned
- Future integration plans

---

## 📋 Planning Documents

### 1. [brief-generative-ui.md](brief-generative-ui.md)
**Original experiment brief** (from `briefs/brief-generative-ui/`)
- Initial concept and goals
- First prototype scope
- Technical exploration plan

### 2. [brief-amalfa-cli-visual-stats.md](brief-amalfa-cli-visual-stats.md)
**CLI dashboard integration design** (Deferred)
- Proposed `amalfa stats --ui` feature
- Detailed implementation plan
- Architectural decisions and trade-offs
- Why generative UI fits this use case (ephemeral CLI diagnostics)
- Why NOT for interactive dashboards (client-side database constraint)

---

## 📊 Retrospectives

### [debrief-2026-01-15-gemini-generative-ui-poc.md](debrief-2026-01-15-gemini-generative-ui-poc.md)
**Implementation retrospective**
- What we accomplished
- Problems encountered and solutions
- Lessons learned (technical + architectural)
- Verification proof (working examples)

---

## 🗂️ Document Purpose Summary

| Document | Type | Status | Purpose |
|----------|------|--------|---------|
| README.md | Reference | Active | Main documentation, how-to guide |
| brief-generative-ui.md | Planning | Archived | Original experiment proposal |
| brief-amalfa-cli-visual-stats.md | Planning | Deferred | Future CLI integration design |
| debrief-*.md | Retrospective | Complete | What we learned from POC |

---

## 🎯 Quick Links by Use Case

### "I want to understand what this is"
→ Start with [README.md](README.md) - Overview section

### "I want to run the prototype"
→ [README.md](README.md) - How to Run section

### "I want to integrate this into Amalfa CLI"
→ [brief-amalfa-cli-visual-stats.md](brief-amalfa-cli-visual-stats.md) - Implementation section

### "I want to know what worked and what didn't"
→ [debrief-2026-01-15-gemini-generative-ui-poc.md](debrief-2026-01-15-gemini-generative-ui-poc.md)

### "I want to understand the architecture decisions"
→ [README.md](README.md) - Architecture section
→ [brief-amalfa-cli-visual-stats.md](brief-amalfa-cli-visual-stats.md) - Decision Record section

---

## 🔑 Key Insights (TL;DR)

### What We Proved ✅
- Gemini can generate valid UI structures from natural language
- Server-side JSX (Hono) works perfectly for rendering
- Zod validation prevents AI hallucinations
- Full dashboard functionality without client JavaScript

### What We Learned 🎓
- Generative UI is for **ephemeral diagnostics**, not interactive dashboards
- Client-side database constraint (Graphology + sql.js) means server-side generation can't access live data
- Use AI where layout is uncertain, static templates for fixed chrome
- Prompts are source of truth, rendered HTML is disposable cache

### What We're Deferring ⏸️
- Integration into `amalfa stats --ui` command
- Real-time ingestion monitoring dashboard
- Historical trend analysis
- Interactive graph exploration with AI commentary

### Why Deferred 🤔
- Need user validation before investing integration effort
- Client-side solutions (static pages + sql.js + AlpineJs) already handle interactive use cases well
- Architectural constraint clarified that generative UI fills a **different gap** than initially assumed

---

## 📁 File Organization

```
scripts/generative-ui/
│
├── Documentation (you are here)
│   ├── INDEX.md                    # This file
│   ├── README.md                   # Main reference
│   ├── brief-*.md                  # Planning documents
│   └── debrief-*.md                # Retrospectives
│
├── Implementation
│   ├── ai.ts                       # Gemini integration
│   ├── components.tsx              # Component library
│   ├── server.tsx                  # Hono server
│   ├── *-schema.ts                 # Type definitions
│   └── jsx.d.ts                    # TypeScript declarations
│
├── Configuration
│   └── .env                        # GEMINI_API_KEY (gitignored)
│
└── Testing
    ├── simple-test.ts              # Model name testing
    └── test-model.ts               # API exploration
```

---

## 🔄 Document Lifecycle

### Active Documents
- **README.md**: Living reference, update as code evolves

### Archived Documents  
- **brief-generative-ui.md**: Historical record of initial plan

### Deferred Documents
- **brief-amalfa-cli-visual-stats.md**: Ready for implementation when needed

### Complete Documents
- **debrief-*.md**: Immutable retrospectives (append-only)

---

## 📝 Documentation Standards

All documents follow:
- **Playbooks**: `playbooks/debriefs-playbook.md` for retrospectives
- **CMP**: `playbooks/change-management-protocol.md` for planning
- **Edinburgh Protocol**: Empirical evidence over speculation, systems thinking over blame

---

**Navigation Tip**: Use your editor's markdown preview or GitHub's web interface for best reading experience.

**Last Updated**: 2026-01-15
