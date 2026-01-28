# LangExtract Results Persistence

**Purpose:** Persistent storage of LangExtract extraction results for model comparison, benchmarking, and quality assessment.

**Format:** JSONL (JSON Lines) - one JSON object per line

**Usage:** Test and compare different Ollama models without re-running extractions.

---

## Directory Structure

```
tests/langextract-results/
├── README.md                    # This file
├── results.jsonl               # All extraction results
├── model-{name}.jsonl          # Results per model (optional)
└── analysis/                   # Analysis scripts and reports
    ├── compare-models.ts       # Model comparison script
    └── quality-report.md       # Quality assessment report
```

---

## JSONL Format

Each line in `results.jsonl` is a complete JSON object representing one extraction result:

```json
{
  "timestamp": "2026-01-28T22:30:00.000Z",
  "model": "mistral-nemo:latest",
  "provider": "local",
  "test_id": "test-001",
  "input_text": "The LangExtract service uses LLMs to extract entities...",
  "prompt": "Analyze the following text and extract a knowledge graph...",
  "latency_ms": 79450,
  "success": true,
  "result": {
    "entities": [
      {"name": "LangExtract", "type": "Service", "description": "Entity extraction service"},
      {"name": "LLMs", "type": "Technology", "description": "Large Language Models"}
    ],
    "relationships": [
      {"source": "LangExtract", "target": "LLMs", "type": "USES", "description": "Uses LLMs for extraction"}
    ]
  },
  "error": null,
  "metadata": {
    "input_length": 145,
    "entity_count": 2,
    "relationship_count": 1,
    "output_length": 234
  }
}
```

---

## Field Descriptions

### Core Fields
- `timestamp`: ISO 8601 timestamp of the extraction
- `model`: Model identifier (e.g., `mistral-nemo:latest`)
- `provider`: Provider type (`local`, `cloud`, `remote`)
- `test_id`: Unique identifier for the test case
- `input_text`: The text that was analyzed
- `prompt`: The prompt used for extraction
- `latency_ms`: Extraction time in milliseconds
- `success`: Boolean indicating success/failure
- `result`: The extracted graph data (if successful)
- `error`: Error message (if failed)

### Metadata Fields
- `input_length`: Character count of input text
- `entity_count`: Number of entities extracted
- `relationship_count`: Number of relationships extracted
- `output_length`: Character count of result JSON

---

## Usage Examples

### Running Tests and Saving Results

```bash
# Test a specific model and save results
bun run tests/ollama/test-model.ts --model mistral-nemo:latest --save

# Test multiple models
bun run tests/ollama/benchmark-models.ts --models mistral-nemo:latest,nemotron-3-nano:30b-cloud --save

# Test with custom input
bun run tests/ollama/test-model.ts --model phi3:mini --input "Your text here" --save
```

### Analyzing Results

```bash
# Compare model performance
bun run tests/langextract-results/analysis/compare-models.ts

# Generate quality report
bun run tests/langextract-results/analysis/generate-report.ts

# Filter results by model
grep '"model": "mistral-nemo:latest"' results.jsonl

# Filter successful extractions
grep '"success": true' results.jsonl
```

---

## Model Comparison Workflow

### 1. Test Models in Cloud First

Before downloading large models, test them via Ollama cloud:

```bash
# Test cloud model without downloading
OLLAMA_API_KEY=your-key bun run tests/ollama/test-cloud-model.ts --model qwen2.5:1.5b --save
```

### 2. Download and Test Locally

If cloud performance is good, download for local testing:

```bash
# Download model
ollama pull qwen2.5:1.5b

# Test locally
bun run tests/ollama/test-model.ts --model qwen2.5:1.5b --provider local --save
```

### 3. Compare Results

```bash
# Generate comparison report
bun run tests/langextract-results/analysis/compare-models.ts \
  --models mistral-nemo:latest,qwen2.5:1.5b \
  --output analysis/comparison-report.md
```

---

## Quality Metrics

### Automatic Metrics
- **Entity Count**: Number of entities extracted
- **Relationship Count**: Number of relationships extracted
- **Latency**: Time to complete extraction
- **Success Rate**: Percentage of successful extractions

### Manual Assessment
Each result should be manually reviewed for:
- **Accuracy**: Are entities correctly identified?
- **Completeness**: Are important entities missed?
- **Relevance**: Are relationships meaningful?
- **Format**: Is output valid JSON?

### Scoring System

| Metric | Score | Description |
|--------|-------|-------------|
| Accuracy | 1-5 | 5 = perfect, 1 = poor |
| Completeness | 1-5 | 5 = comprehensive, 1 = minimal |
| Relevance | 1-5 | 5 = highly relevant, 1 = irrelevant |
| Format | 1-5 | 5 = perfect JSON, 1 = invalid |

Add manual scores to results:

```json
{
  "manual_assessment": {
    "accuracy": 4,
    "completeness": 3,
    "relevance": 5,
    "format": 5,
    "notes": "Good entity extraction, missed some relationships"
  }
}
```

---

## Test Cases

### Standard Test Suite

Create a `test-cases.jsonl` with standard inputs:

```json
{"test_id": "tc-001", "input": "The LangExtract service uses LLMs to extract entities and relationships from source code.", "description": "Simple technical sentence"}
{"test_id": "tc-002", "input": "React components use hooks like useState and useEffect to manage state and side effects.", "description": "Framework-specific terminology"}
{"test_id": "tc-003", "input": "The database schema includes tables for users, posts, and comments with foreign key relationships.", "description": "Database structure description"}
```

Run standard tests:

```bash
bun run tests/ollama/run-test-suite.ts --test-cases test-cases.jsonl --model mistral-nemo:latest --save
```

---

## Analysis Scripts

### compare-models.ts

Compare performance across models:

```typescript
import { readFileSync } from 'fs';

interface Result {
  model: string;
  latency_ms: number;
  metadata: {
    entity_count: number;
    relationship_count: number;
  };
}

// Read results
const results = readFileSync('results.jsonl', 'utf-8')
  .split('\n')
  .filter(line => line.trim())
  .map(line => JSON.parse(line) as Result);

// Group by model
const byModel = results.reduce((acc, r) => {
  if (!acc[r.model]) acc[r.model] = [];
  acc[r.model].push(r);
  return acc;
}, {} as Record<string, Result[]>);

// Calculate averages
for (const [model, modelResults] of Object.entries(byModel)) {
  const avgLatency = modelResults.reduce((sum, r) => sum + r.latency_ms, 0) / modelResults.length;
  const avgEntities = modelResults.reduce((sum, r) => sum + r.metadata.entity_count, 0) / modelResults.length;
  const avgRelationships = modelResults.reduce((sum, r) => sum + r.metadata.relationship_count, 0) / modelResults.length;
  
  console.log(`${model}:`);
  console.log(`  Avg Latency: ${avgLatency.toFixed(0)}ms`);
  console.log(`  Avg Entities: ${avgEntities.toFixed(1)}`);
  console.log(`  Avg Relationships: ${avgRelationships.toFixed(1)}`);
}
```

---

## Best Practices

### 1. Consistent Testing
- Use the same test cases across all models
- Run multiple times to account for variance
- Document test environment (hardware, load)

### 2. Result Management
- Commit `results.jsonl` to git for historical tracking
- Use git tags for major benchmark runs
- Archive old results periodically

### 3. Privacy Considerations
- Sanitize input text before saving (remove secrets, PII)
- Use synthetic test data when possible
- Review results before committing

### 4. Continuous Integration
- Add model tests to CI pipeline
- Fail build if latency exceeds threshold
- Alert on quality degradation

---

## Troubleshooting

### Issue: Duplicate Results

**Cause:** Running tests multiple times without clearing results

**Solution:**
```bash
# Remove duplicates
awk '!seen[$0]++' results.jsonl > results-deduped.jsonl
mv results-deduped.jsonl results.jsonl
```

### Issue: Invalid JSON Lines

**Cause:** Malformed JSON in results file

**Solution:**
```bash
# Validate JSONL
bun run tests/langextract-results/validate-jsonl.ts
```

### Issue: Large File Size

**Cause:** Too many results accumulated

**Solution:**
```bash
# Archive old results
mv results.jsonl archive/results-$(date +%Y%m%d).jsonl
echo "" > results.jsonl
```

---

## Integration with LangExtract

### Automatic Result Saving

Update `LangExtractClient.ts` to save results:

```typescript
public async extract(text: string): Promise<ExtractedGraph | null> {
  const startTime = Date.now();
  
  try {
    const result = await this.client?.callTool({
      name: "extract_graph",
      arguments: { text }
    });
    
    const latency = Date.now() - startTime;
    
    // Save result
    await this.saveResult({
      timestamp: new Date().toISOString(),
      model: this.settings.langExtract.ollama.model,
      provider: this.getProvider(),
      test_id: `auto-${Date.now()}`,
      input_text: text,
      latency_ms: latency,
      success: true,
      result: result,
      metadata: {
        input_length: text.length,
        entity_count: result.entities?.length || 0,
        relationship_count: result.relationships?.length || 0
      }
    });
    
    return result;
  } catch (error) {
    // Save error result
    await this.saveResult({
      timestamp: new Date().toISOString(),
      model: this.settings.langExtract.ollama.model,
      provider: this.getProvider(),
      test_id: `auto-${Date.now()}`,
      input_text: text,
      latency_ms: Date.now() - startTime,
      success: false,
      error: String(error)
    });
    
    throw error;
  }
}
```

---

## Future Enhancements

- [ ] Web dashboard for result visualization
- [ ] Automated quality scoring using reference results
- [ ] Statistical analysis of model performance
- [ ] Integration with CI/CD pipelines
- [ ] Model recommendation engine based on use case
- [ ] Cost analysis for cloud providers
- [ ] Privacy impact assessment

---

## Contributing

When adding new test results:

1. Use the standard JSONL format
2. Include all required fields
3. Add manual assessment if reviewing quality
4. Document any special test conditions
5. Update this README if format changes

---

**Last Updated:** 2026-01-28  
**Maintainer:** AMALFA Team  
**Version:** 1.0