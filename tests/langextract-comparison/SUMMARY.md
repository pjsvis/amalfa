{
  "langExtract": {
    "provider": "ollama",
    "ollama": {
      "host": "http://localhost:11434",
      "model": "nemotron-3-nano:30b-cloud"
    }
  }
}
```

---

## Why Not the Others?

### mistral-nemo:latest
- **Problem:** Extremely slow (8+ minutes per extraction)
- **Use case:** Only for offline scenarios or as emergency fallback
- **Note:** 100% reliable but impractical for real-time use

### gemini-flash-latest
- **Problem:** Cannot produce valid JSON output
- **Status:** Needs API configuration investigation
- **Note:** Fast but completely non-functional

---

## Implementation Tips

### Add Retry Logic
Handle the 16.7% failure rate with automatic retries:

```typescript
async function extractWithRetry(content: string, maxRetries: number = 3): Promise<ExtractedGraph> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await extractWithModel("nemotron-3-nano:30b-cloud", content);
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Expected Performance with Retries
- **Single attempt:** 83.3% success rate
- **With 3 retries:** ~99.5% effective success rate
- **Total time:** ~4-12 seconds (including retries)

---

## Test Details

**Files Tested:** 6 project files (4 TypeScript, 2 Markdown)  
**Total Tests:** 42 (multiple runs per model)  
**Test Duration:** ~1 hour 40 minutes

**Success Criteria:**
- Valid JSON output
- Contains entities array
- Contains relationships array
- Proper entity/relationship structure

---

## For More Information

- **[COMPREHENSIVE_RESULTS.md](./COMPREHENSIVE_RESULTS.md)** - Full analysis with detailed metrics
- **[results.jsonl](./results.jsonl)** - Raw test data
- **[README.md](./README.md)** - Complete methodology and implementation guide

---

**Last Updated:** 2026-01-29  
**Next Review:** After implementing retry logic or testing new models