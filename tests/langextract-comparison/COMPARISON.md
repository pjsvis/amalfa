# LangExtract Model Comparison

**Date:** 2026-01-29  
**Test Files:** 6 representative project files (4 TypeScript, 2 Markdown)  
**Models Compared:** 2 successful models

---

## Executive Summary

**nemotron-3-nano:30b-cloud** (remote, 30B) provides faster extraction with more entities/relationships but has a 67% success rate. **mistral-nemo:latest** (local, 7.1GB) is slower but has 100% success rate with fewer entities/relationships.

**Recommendation:** Use nemotron-3-nano:30b-cloud for development speed, mistral-nemo:latest for production reliability.

---

## Performance Comparison

| Model | Success Rate | Avg Latency | Avg Entities | Avg Relationships | Provider |
|-------|--------------|-------------|--------------|------------------|----------|
| nemotron-3-nano:30b-cloud | 67% (16/24) | 4,014ms | 13.4 | 12.5 | Remote |
| mistral-nemo:latest | 100% (6/6) | 438,000ms | 7.7 | 7.0 | Local |

---

## nemotron-3-nano:30b-cloud (Remote)

### Strengths
- **Fast extraction:** 4 seconds average latency
- **High detail:** 13.4 entities, 12.5 relationships per file
- **Excellent code understanding:** Accurate identification of classes, interfaces, functions
- **Good relationship mapping:** Proper dependency tracking
- **No local resources:** Doesn't impact system performance

### Weaknesses
- **67% success rate:** 8 out of 24 tests failed JSON parsing
- **Internet dependency:** Requires internet connection
- **Privacy concerns:** Data sent to cloud
- **Inconsistent reliability:** Failures on complex TypeScript files

---

## mistral-nemo:latest (Local)

### Strengths
- **100% success rate:** All 6 tests passed
- **Maximum privacy:** Data never leaves your machine
- **No internet required:** Works offline
- **Consistent reliability:** No JSON parsing failures
- **Production ready:** Suitable for sensitive data

### Weaknesses
- **Very slow:** 7.3 minutes average latency
- **Lower detail:** 7.7 entities, 7.0 relationships per file
- **High resource usage:** 7.1 GB model size
- **System impact:** Slows down other applications
- **Not practical for interactive use**

---

## Recommendation

**Development:** Use nemotron-3-nano:30b-cloud for speed and detail  
**Production:** Use mistral-nemo:latest for privacy and reliability

**Hybrid Approach:** Implement automatic fallback from nemotron to mistral when nemotron fails or when processing sensitive data.