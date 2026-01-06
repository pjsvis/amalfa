# Definition of Done Playbook

## Philosophy

**"Done" means verified, not claimed.**

Code changes are not complete until they pass all verification gates. Optimism is the enemy of quality. Default to skepticism.

## The Iron Law

> **Never claim completion without running verification.**

If you say "task complete" without showing verification output, you have failed.

## Verification Gates (In Order)

### Gate 1: TypeScript Compilation
```bash
tsc --noEmit
```

**Success Criteria:** Zero errors
**Failure Action:** Fix all errors before proceeding

### Gate 2: Linting (Core Code)
```bash
bunx biome check src/ resonance/src/ --diagnostic-level=error
```

**Success Criteria:** Zero errors in production code
**Acceptable:** Warnings in `scripts/` and `tests/` (excluded from strict linting)

### Gate 3: Full Project Check
```bash
bun run check
```

**Success Criteria:** No new errors introduced
**Note:** Existing errors in excluded directories are acceptable

## 1. Code Quality
- [ ] **Lint Free:** No linter errors or warnings.
- [ ] **Type Safe:** `tsc --noEmit` passes with **ZERO** errors.
    -   *Crucial:* Do not assume "it works" because it runs. Verify types.
    -   *Constraint:* No `any` types unless strictly necessary and documented.
    -   *Constraint:* No `@ts-ignore` without a link to a GitHub issue tracking the fix.

### Gate 4: Functional Verification
Run the actual code that was changed:
- If you modified a script, run it
- If you modified ingestion, run ingestion
- If you modified UI, verify in browser

**Success Criteria:** Code executes without errors

## Reporting Template

When claiming completion, use this format:

```markdown
## Task Complete: [Task Name]

### Changes Made
- [List of files modified]
- [Key changes]

### Verification Results

#### TypeScript Compilation
\`\`\`
$ tsc --noEmit
[output or "✅ Clean"]
\`\`\`

#### Core Code Linting
\`\`\`
$ bunx biome check src/ resonance/src/ --diagnostic-level=error
[output or "✅ Zero errors"]
\`\`\`

#### Functional Test
\`\`\`
$ [command run]
[output showing success]
\`\`\`

### Status
✅ All gates passed - Task genuinely complete
```

## Anti-Patterns to Avoid

### ❌ "I think this should work"
**Instead:** "I verified this works by running X"

### ❌ "The code looks correct"
**Instead:** "The code compiles and passes linting"

### ❌ "Task complete" (with no verification)
**Instead:** Show the verification output

### ❌ Claiming success, then discovering errors when user checks
**Instead:** Discover errors yourself during verification

## Cost-Benefit Reality

**Cost of verification:** 30 seconds + a few tokens
**Cost of claiming false completion:** 
- User's time wasted
- Context switching
- Trust erosion
- Rework
- Frustration

**The math is clear: Always verify.**

## Edge Cases

### "But the build takes too long"
Run it anyway. If build time is a problem, that's a separate issue to address.

### "But there are pre-existing errors"
Document them. Show that your changes didn't introduce new ones.

### "But I'm confident this is right"
Confidence is not verification. Run the checks.

## Integration with Workflow

This playbook should be referenced:
1. **Before** claiming any task is complete
2. **After** any code modification
3. **During** code review (self-review)

## Accountability

If you claim completion without verification:
1. You will be asked to verify
2. You will waste the user's time
3. You will erode trust
4. You will create rework

**Don't do it.**

## Summary

```
Code written ≠ Task complete
Code written + Verified = Task complete
```

**Verification is not optional. It is the definition of done.**
