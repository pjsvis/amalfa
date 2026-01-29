# LangExtract Model Comparison Tests

This directory contains comprehensive test results comparing different LLM models for entity and relationship extraction using LangExtract.

## Purpose

These tests evaluate the performance, reliability, and quality of various LLM models when used for code analysis tasks through LangExtract. The goal is to identify the best model for production use based on:

- **Success Rate**: Ability to produce valid JSON output
- **Latency**: Response time for extraction tasks
- **Quality**: Accuracy and detail of extracted entities and relationships
- **Reliability**: Consistency across multiple test runs

## Test Results Summary

### Key Findings (as of 2026-01-29)

| Model | Success Rate | Avg Latency | Quality | Recommendation |
|-------|--------------|-------------|---------|----------------|
| **nemotron-3-nano:30b-cloud** | 83.3% | ~4 seconds | Excellent | ✅ **Primary Choice** |
| **mistral-nemo:latest** | 100% | ~8.4 minutes | Good | ⚠️ Fallback/Offline |
| **gemini-flash-latest** | 0% | ~134ms | N/A | ❌ Needs Investigation |

### Recommendation

Use **nemotron-3-nano:30b-cloud** as the default model for production. It provides the best balance of speed, quality, and reliability. Implement retry logic to handle the occasional failures (16.7% failure rate).

## Files in This Directory

### Result Documents

- **[COMPREHENSIVE_RESULTS.md](./COMPREHENSIVE_RESULTS.md)** - Complete analysis of all test results including all three models (gemini-flash-latest, nemotron-3-nano, mistral-nemo). This is the most up-to-date and comprehensive report.

- **[TEST_RESULTS.md](./TEST_RESULTS.md)** - Initial test results focusing on Ollama remote models (nemotron-3-nano, qwen2.5:7b, phi3:mini, llama3.1:8b).

- **[REPORT.md](./REPORT.md)** - Detailed technical report with methodology and analysis.

- **[COMPARISON.md](./COMPARISON.md)** - Comparative analysis between different model configurations.

### Data Files

- **[results.jsonl](./results.jsonl)** - Raw test results in JSON Lines format. Each line contains a single test result with metrics like latency, success status, entity count, and relationship count.

- **[test-models.ts](./test-models.ts)** - TypeScript test script used to run the model comparisons.

## Test Methodology

### Test Files

Six representative project files were used for testing:

**TypeScript Files (4):**
1. `src/tools/EmberExtractTool.ts` - Ember extraction tool
2. `src/core/GraphEngine.ts` - Graph engine implementation
3. `src/core/Harvester.ts` - Tag scanning and clustering
4. `src/core/SemanticWeaver.ts` - Orphan rescue functionality

**Markdown Files (2):**
1. `README.md` - Project documentation
2. `docs/API_KEYS.md` - API keys documentation

### Test Parameters

- **Content Length**: First 2000 characters of each file
- **Output Format**: JSON with `format: "json"` parameter
- **Streaming**: Disabled (`stream: false`)
- **Success Criteria**: Valid JSON with entities and relationships arrays

### Metrics Collected

- **Success/Failure Status**: Whether valid JSON was produced
- **Latency**: Time taken for model inference
- **Entity Count**: Number of entities extracted
- **Relationship Count**: Number of relationships extracted
- **JSON Validity**: Whether output could be parsed as JSON

## Running Tests

To run new model comparison tests:

```bash
# Navigate to the tests directory
cd amalfa/tests/langextract-comparison

# Run the test script
bun run test-models.ts
```

Or using the test script directly:

```bash
# From project root
bun run tests/langextract-comparison/test-models.ts
```

### Adding New Models

To test a new model, modify `test-models.ts` and add it to the models array:

```typescript
const models = [
  {
    name: "your-model-name",
    provider: "ollama", // or "gemini", "openai", etc.
    // ... other configuration
  },
  // ... existing models
];
```

## Interpreting Results

### Success Rate

The percentage of tests that produced valid JSON output. A high success rate is critical for production use.

### Latency

The time taken for the model to complete the extraction task. Lower is better, but must be balanced with quality.

### Entity/Relationship Count

The number of entities and relationships extracted. Higher counts generally indicate better extraction quality, but should be validated for accuracy.

### Quality Assessment

Manual review of extracted entities and relationships to ensure:
- Accurate identification of code elements
- Correct classification (class, interface, function, etc.)
- Meaningful relationship types (implements, uses, depends_on, etc.)
- Contextual descriptions

## Recommendations for Production

### Primary Configuration

```json
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

### With Retry Logic

Implement retry logic to handle occasional failures:

```typescript
async function extractWithRetry(content: string, maxRetries: number = 3): Promise<ExtractedGraph> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await extractWithModel("nemotron-3-nano:30b-cloud", content);
      if (result.success) return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
  throw new Error("Max retries exceeded");
}
```

### Fallback Strategy

Use mistral-nemo:latest as a fallback for critical extractions:

```typescript
async function extractWithFallback(content: string): Promise<ExtractedGraph> {
  try {
    return await extractWithRetry(content, 2);
  } catch (error) {
    console.warn("Primary model failed, falling back to mistral-nemo");
    return await extractWithModel("mistral-nemo:latest", content);
  }
}
```

## Future Work

- [ ] Investigate gemini-flash-latest JSON output configuration
- [ ] Test GPU acceleration for mistral-nemo:latest
- [ ] Evaluate additional models (codellama, deepseek-coder, gemini-pro)
- [ ] Implement model fine-tuning for extraction tasks
- [ ] Develop adaptive model selection based on file type
- [ ] Add batch processing capabilities
- [ ] Create performance monitoring dashboard

## References

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [LangExtract Documentation](https://github.com/google/langextract)
- [Graphology](https://github.com/graphology/graphology)

## Version History

- **v2.0** (2026-01-29) - Added comprehensive results including mistral-nemo:latest
- **v1.0** (2026-01-29) - Initial test results with Ollama remote models

---

**Last Updated**: 2026-01-29  
**Maintained By**: AMALFA Team