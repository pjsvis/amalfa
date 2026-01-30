# Debrief: LangExtract Harvest Process (2026-01-30)

## 🎯 Final Results

### Harvest Statistics
- **Total Files**: 531
- **Successfully Cached**: 497 (93.6%)
- **Skipped (Timeouts)**: 10 (1.9%)
- **Skipped (Errors)**: 23 (4.3%)
- **Cache Hits**: 495 (instant retrieval)
- **New Extractions**: 36 (API calls)

### Cost & Time
- **Total Spend**: ~$60 USD
- **Total Time**: ~2 days (with interruptions and debugging)
- **Final Run**: ~15 minutes (weaponized approach)

## 📊 Assessment

### What Worked ✅
1. **Content-Addressable Caching**: The SHA-256 cache strategy worked flawlessly. Re-running the harvest is instant for cached files.
2. **Weaponized Fail-Fast**: The final iteration skipped timeouts instead of aborting, completing the full run.
3. **Desktop Notifications**: macOS notification fired on completion, providing closure.
4. **Manifest Logging**: `.amalfa/harvest-skipped.json` provides a clear audit trail.
5. **Rate Limiting**: 100ms delay prevented API abuse.

### What Failed ❌
1. **Initial Circuit Breaker**: Too aggressive—aborted on timeouts instead of skipping.
2. **Lack of Observability**: No progress bar or real-time feedback during the 2-day run.
3. **Cost Transparency**: User had no idea how much money was being spent in real-time.
4. **MCP Stability**: "Not connected" errors at the end suggest the sidecar crashed after prolonged use.
5. **Timeout Handling**: 10 large documentation files timed out (>60s processing time).

## 🔍 Root Causes

### Timeouts (10 files)
**Pattern**: Large, complex markdown files (audits, reviews, manuals).
**Cause**: LLM processing time exceeded 60-second MCP timeout.
**Files**:
- `WARP.md`
- `docs/USER-MANUAL.md`
- `docs/audits/*` (6 files)
- `playbooks/README.md`

**Solution**: Increase MCP timeout to 120s for markdown files, or implement chunking for large docs.

### Errors (23 files)
**Pattern**: "Not connected" errors at the end of the run.
**Cause**: MCP sidecar connection died after ~500 requests.
**Hypothesis**: Memory leak or resource exhaustion in the Python sidecar after prolonged use.

**Solution**: Restart the sidecar every N requests (e.g., every 100 files).

## 💡 Lessons Learned

### 1. **Remote APIs Are Adversarial**
- Timeouts, rate limits, and connection drops are **expected**, not exceptional.
- Design for chaos: skip, log, and continue.

### 2. **Observability Is Not Optional**
- A 2-day process with no progress bar is a UX disaster.
- Users need real-time feedback: progress, cost, ETA.

### 3. **Weaponized Happy Path**
- The final "weaponized" approach (skip timeouts, log exceptions, notify on completion) completed successfully.
- This should be the **default pattern** for all remote-ops.

### 4. **Fail-Fast vs. Fail-Sideways**
- **Fail-Fast**: Abort on systemic failures (auth, rate limits).
- **Fail-Sideways**: Skip edge cases (timeouts, complex files) and continue.

### 5. **Cost Tracking Is Critical**
- $60 spent with no real-time visibility is unacceptable.
- Future iterations must show running cost estimates.

## 🚀 Next Steps

### Immediate (Phase 2)
1. **Progress Bar**: Add `cli-progress` for real-time feedback.
2. **Cost Tracking**: Estimate and display running cost.
3. **Sidecar Restart**: Restart MCP connection every 100 files to prevent crashes.

### Short-Term (Dashboard)
4. **Monitoring Dashboard**: Implement the dashboard brief to visualize:
   - Harvest progress
   - Cache hit rate
   - Cost over time
   - Skipped files
5. **Audit Trail**: Persist harvest stats to SQLite for historical analysis.

### Long-Term (Resilience)
6. **Chunking for Large Files**: Split large docs into semantic chunks before extraction.
7. **Adaptive Timeout**: Increase timeout dynamically based on file size.
8. **Multi-Provider Fallback**: If OpenRouter fails, fall back to Gemini or Ollama.

## 📝 Playbook: Remote-Ops Weaponization

### Principles
1. **Assume Failure**: Every API call can fail.
2. **Fail Sideways**: Skip edge cases, don't abort.
3. **Observable by Default**: Progress bars, notifications, manifests.
4. **Cost Transparent**: Show running totals in real-time.
5. **Resumable**: Idempotent operations that can restart from any point.

### Implementation Checklist
- [ ] Circuit breaker distinguishes systemic vs. edge-case failures
- [ ] Desktop notifications on start/progress/completion
- [ ] Skipped files manifest with reasons
- [ ] Progress bar with ETA
- [ ] Cost tracking and display
- [ ] Sidecar restart logic for long-running processes

## 🎖️ Verdict

**Status**: ✅ **Mission Accomplished** (with scars)

The harvest completed successfully, but the journey exposed critical gaps in observability and resilience. The "weaponized" approach works, but it came too late. Future remote-ops must start with these patterns baked in.

**Key Takeaway**: We built a Ferrari and drove it through a minefield. Next time, we build a tank.
