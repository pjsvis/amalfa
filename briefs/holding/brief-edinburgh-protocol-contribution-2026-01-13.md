---
date: 2026-01-13
tags: [documentation, opencode, prompt-engineering, philosophy, community-contribution]
agent: claude
environment: local
---

## Task: Edinburgh Protocol OpenCode Contribution

**Objective:** Determine best channel and format for contributing Edinburgh Protocol documentation to OpenCode project, then execute contribution strategy.

- [ ] Research OpenCode community channels and contribution preferences
- [ ] Select optimal contribution approach (Issue → PR, Gist + Signal, or Direct PR)
- [ ] Prepare contribution materials (documents, cover note, context)
- [ ] Execute contribution and monitor response

## Context

**What:** Two markdown documents emerged from Amalfa v1.3.0 release cycle:
- `docs/edinburgh-protocol-reaction.md` - Analysis of how Edinburgh Protocol (meta-cognitive framework) meshes with Sisyphus operational substrate
- Source material: Edinburgh Protocol system prompt from `~/.config/opencode/se-prompt.md`

**Why Contribute:** 
- Addresses real UX issue: OpenCode TUI scroll limitations on MacBook Air led to externalizing philosophical discussion as persistent docs
- Demonstrates composable prompt architecture: belief system (Edinburgh) + work ethic (Sisyphus) = operational coherence
- Real-world validation: Pattern emerged organically from production use, not theoretical design

**Target:** OpenCode project (`code-yeongyu/opencode` or `sst/opencode` - fork relationship unclear)

## Key Actions Checklist

### Phase 1: Research & Reconnaissance (30 min)
- [ ] Verify OpenCode repo structure (`code-yeongyu/opencode` vs `sst/opencode`)
- [ ] Check for community channels:
  - [ ] GitHub Discussions enabled?
  - [ ] Discord/Slack links on https://opencode.ai
  - [ ] Active maintainer on X/Twitter for social signal
- [ ] Review recent merged PRs for documentation precedent
- [ ] Check if issues will be re-enabled (currently disabled on `code-yeongyu/opencode`)

### Phase 2: Strategy Selection (15 min)
Select ONE approach based on research:

**Option A: Issue First (Low Risk, High Signal)**
- **Conditions:** Issues enabled OR Discussions available
- **Action:** Open design conversation issue per CONTRIBUTING.md guidance
- **Cover Note Template:**
  ```markdown
  ## Problem
  OpenCode agents can exhibit inconsistent behavior across sessions. Users benefit 
  from frameworks that ensure operational coherence between philosophical stance 
  and execution patterns.

  ## Proposed Contribution
  Two markdown documents capturing a working prompt engineering pattern:
  1. Edinburgh Protocol framework
  2. Real-world integration case study (Amalfa v1.3.0 release)

  ## Why OpenCode?
  - Emerged organically from production use (fixed TypeScript errors, shipped release)
  - Addresses TUI scroll issues by documenting philosophy externally
  - Demonstrates composable system prompt architecture

  ## Request
  Would this be a useful contribution, or is it outside OpenCode's docs scope?
  ```

**Option B: Gist + Social Signal (Zero Risk, Maximum Autonomy)**
- **Conditions:** No community channels available OR maintainer responsiveness unclear
- **Action:** 
  1. Create GitHub Gist with both documents
  2. Write social signal (X/Twitter, HN, Reddit r/LocalLLaMA)
  3. Tag OpenCode maintainers
  4. Let demand signal utility
- **Benefits:** No rejection risk, demonstrates value, maintainers pull vs. push

**Option C: Direct PR (High Risk, Fast Path)**
- **Conditions:** Strong precedent for prompt engineering docs OR explicit green light from maintainer
- **Action:** Submit PR to `docs/community/` or `docs/guides/`
- **Risk:** May be closed per "needs design review" if viewed as core feature vs. docs improvement

### Phase 3: Material Preparation (30 min)
- [ ] Create cleaned versions of documents:
  - [ ] `edinburgh-protocol.md` - Extract core framework from system prompt
  - [ ] `edinburgh-protocol-integration.md` - Case study from reaction doc
- [ ] Write cover note (Issue, Gist description, or PR description depending on chosen path)
- [ ] Prepare context snippet explaining:
  - Where pattern emerged (Amalfa project)
  - What problem it solves (agent consistency, TUI scroll workaround)
  - Why it's useful (composable prompt architecture)

### Phase 4: Execution (15 min)
- [ ] Submit contribution via chosen channel
- [ ] Monitor for response (set 7-day timeout)
- [ ] If no response: Escalate to next option (Issue → Gist → Archive)

### Phase 5: Debrief (Regardless of Outcome)
- [ ] Document outcome in `debriefs/2026-01-13-edinburgh-protocol-contribution.md`
- [ ] Capture lessons learned:
  - What worked/didn't in contribution approach
  - OpenCode maintainer appetite signals
  - Whether pattern has broader applicability
- [ ] If rejected: Keep as internal Amalfa docs (already valuable for project continuity)

## Detailed Requirements

### Document Preparation Guidelines

**Structure for `edinburgh-protocol.md`:**
```markdown
# Edinburgh Protocol: Meta-Cognitive Framework for AI Agents

## Origin
Derived from Scottish Enlightenment principles (Hume, Smith, Watt)

## Core Tenets
1. Map vs Territory (epistemic humility)
2. Systems Over Villains (incentive analysis)
3. Anti-Dogma (empirical grounding)
4. Practical Improvement (utility over theory)

## Application to AI Agents
[Extract relevant sections from system prompt]

## Integration with Operational Substrates
[Summarize how framework composes with execution patterns]
```

**Structure for `edinburgh-protocol-integration.md`:**
```markdown
# Case Study: Edinburgh Protocol + Sisyphus Substrate

## Context
Amalfa v1.3.0 release cycle (TypeScript errors, test fixes, version tagging)

## Question
How does meta-cognitive philosophy (Edinburgh) mesh with operational 
heuristics (Sisyphus)?

## Analysis
[Include key sections from reaction doc]

## Lessons Learned
[Extract actionable patterns for other OpenCode users]
```

### Cover Note Key Points

**Regardless of channel, emphasize:**
1. **Organic emergence** (not theoretical design)
2. **Real problem solved** (TUI scroll → persistent docs)
3. **Production validation** (shipped v1.3.0 with pattern)
4. **Composable architecture** (framework + substrate)
5. **Open to placement** (not precious about where/if it lives)

### Success Criteria

**Minimum Success:**
- [ ] Contribution submitted via appropriate channel
- [ ] Clear signal received (yes/no/maybe) within 7 days
- [ ] Debrief captures lessons learned

**Optimal Success:**
- [ ] Documents merged into OpenCode repo
- [ ] Other users report finding pattern useful
- [ ] Maintainers reference pattern in docs/prompts

**Acceptable Outcome:**
- [ ] Maintainers decline ("outside scope")
- [ ] Documents remain as Amalfa internal reference
- [ ] Process documented for future contribution attempts

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Rejected as "not docs improvement"** | Frame as UX workaround (TUI scroll issue) |
| **Viewed as philosophical bloat** | Emphasize practical utility (shipped code with pattern) |
| **Unclear contribution channel** | Start with lowest-friction option (Gist) |
| **No maintainer response** | Set 7-day timeout, escalate to next option |
| **Fork confusion (code-yeongyu vs sst)** | Check CONTRIBUTING.md references, follow the active repo |

## Best Practices

- **Scottish Enlightenment principle:** Test market before building cathedral (Gist before PR)
- **Hume's Razor:** State ignorance clearly (fork relationship, maintainer appetite)
- **Systems thinking:** This is a documentation *system* contribution, not just files
- **Pragmatism:** If contribution doesn't land, documents still valuable for Amalfa continuity
- **Impartial spectator:** Check bias—are we contributing for community or ego? (Answer: TUI scroll workaround justifies it)

## Verification

**How to verify brief completion:**
- [ ] Contribution submitted via chosen channel
- [ ] 7-day response timer set
- [ ] Outcome documented in debrief (accepted/declined/no-response)
- [ ] If declined: Documents remain in `amalfa/docs/` for project continuity

**Tools for verification:**
- GitHub CLI (`gh issue create`, `gh pr create`, `gh repo view`)
- Social signals (X/Twitter engagement, HN upvotes if posted)
- Maintainer response (direct feedback on Issue/PR/Gist)

---

**Meta-Note:** This brief exists because OpenCode TUI scroll is "pretty rubbish" on MacBook Air, necessitating persistent documentation of philosophical exchanges. The irony of documenting the workaround in the contribution itself is not lost on this agent.
