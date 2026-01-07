# Phi3 Usage Guide

## Purpose

Phi3 is a **fast, lightweight AI model** (2.2GB) optimized for quick query analysis and intelligent re-ranking. It excels at speed-focused tasks and provides immediate value for development and iteration.

## Phi3 Strengths

### What Phi3 Does Well

**1. Fast Query Resolution** (200-400ms)
- Quickly detects search intent: implementation, conceptual, or example
- Extracts key entities from your query
- Provides technical level assessment (high, medium, low)
- Suggests 3-5 related queries for exploration

**2. Context-Aware Re-ranking** (300-500ms)
- Understands query intent to weight results
- Boosts relevant matches, deprioritizes unrelated content
- Better than raw vector similarity for nuanced queries

**3. Smart Context Extraction** (500-1500ms for top 5)
- Generates relevant 2-3 sentence snippets
- Explains why each result matters
- Provides confidence scores for quality assessment

**4. Development-Friendly**
- Small model = fast iteration cycles
- 1-2s per operation vs 10-30s for larger models
- Test changes reflected immediately
- A/B testing is practical

**5. Resource Efficient**
- Low CPU/memory usage (2.2GB vs 7GB+ for larger models)
- Runs alongside AMALFA without resource contention
- Cache-friendly design (30s health check cache)

## When to Use Phi3

### Perfect Use Cases

**Technical Implementation Queries**
- "How does React useEffect cleanup work?"
- "Error handling in async/await functions"
- "TypeScript generic constraints examples"
- "Node.js event loop blocking patterns"

**Conceptual Architecture Questions**
- "What is event-driven architecture?"
- "Microservices vs monolith tradeoffs"
- "REST vs GraphQL API design"
- "MVC pattern principles"

**Code Understanding Queries**
- "Python async/await patterns"
- "React hooks lifecycle methods"
- "State management best practices"

**Exploration Queries**
- "What design patterns work well together?"
- "Comparison of React vs Vue state management"
- "When to use functional vs class components"

**Why These Work Well**

Phi3 is trained on technical documentation and code. It:
- Understands technical terminology and patterns
- Recognizes implementation-focused content
- Provides relevant, actionable suggestions
- Distinguishes between theory and practice

### Less Effective Use Cases

**Simple Keyword Searches**
- "TODO list" (exact match is better)
- "Read node by ID" (direct lookup)
- Known function or method names

**Very Short Content**
- Single-line code snippets
- Bullet lists without context
- File names or paths

**When Phi3 Doesn't Help**

Phi3 is lightweight (2.2GB) designed for speed, not deep reasoning. For these queries, Phi3 adds latency without meaningful improvement:

- Specific, well-documented API methods
- Exact file names or IDs
- Very short content (under 50 words)
- Simple keyword matches

Recommendation: Disable Phi3 for these queries and use fast vector search.

## Query Analysis

### What It Does

Analyzes your search query to provide:

**Intent Classification** (`intent`)
- `"implementation"`: Practical, code-focused
- `"conceptual"`: Theory, architecture, design
- `"example"`: Tutorial, example-focused

**Entity Extraction** (`entities`)
- Key terms, concepts, technologies
- Technical identifiers
- Related terms

**Technical Level** (`technical_level`)
- `"high"`: Implementation details, advanced topics
- `"medium"`: General concepts, moderate depth
- `"low"`: Basic concepts, introductory

**Query Suggestions** (`suggested_queries`)
- 3-5 semantically related queries
- Alternative formulations
- Broader or narrower terms

### How to Use Results

**For Implementation Queries** (`intent: "implementation"`)
- Focus on entities like "React", "useEffect", "cleanup"
- Look for suggested queries about related patterns
- Expect high technical level results

**For Conceptual Queries** (`intent: "conceptual"`)
- Focus on broad concepts and architecture
- Explore suggested queries for related topics
- Expect medium technical level results

**Example Response**

```json
{
  "intent": "implementation",
  "entities": ["React", "useEffect", "cleanup", "async"],
  "technical_level": "high",
  "suggested_queries": [
    "React hooks dependency array",
    "useEffect cleanup patterns",
    "async/await error handling"
  ]
}
```

### When It Helps Most

- **Ambiguous queries**: Multiple interpretations possible
- **Exploratory searches**: Finding related concepts
- **Cross-technology comparisons**: "React vs Vue state management"
- **Learning new tech**: Understanding patterns across languages

### When It Doesn't Help

- **Specific API names**: "What does useState() do?"
- **Exact file matches**: "Read error-handling-patterns.md"
- **Well-known concepts**: "What is MVC?"
- **Very short queries**: Under 3 words

## Result Re-ranking

### How Re-ranking Works

Phi3 re-evaluates vector search results based on query intent:

1. **Vector search returns 20 candidates** with raw similarity scores
2. **Phi3 analyzes each result** against query intent
3. **Phi3 assigns relevance scores** (0.0 to 1.0)
4. **Results re-ordered** by Phi3 relevance, not raw similarity

### When Re-ranking Helps

**Implementation Query with Mixed Results**
- Query: "React state management"
- Results mix of React, Vue, Angular docs
- Phi3 recognizes intent as "implementation"
- Boosts React-related results, deprioritizes others
- Result order: React docs first, then Vue/Angular

**Conceptual Query with Specific Results**
- Query: "What is event-driven architecture?"
- Results: Event-driven, microservices, Observer pattern docs
- Phi3 recognizes intent as "conceptual"
- Boosts theoretical explanations, deprioritizes implementation details
- Result order: Conceptual docs first, then specific patterns

### When Re-ranking Hurts

**Precise Implementation Queries**
- Query: "How does useEffect cleanup work?"
- Results: #1 is exact match, #2-4 are highly relevant
- Phi3 might reorder based on semantic understanding
- Risk: Deprioritizing exact match
- Result: Slower latency (300-500ms) with no clear benefit

**Simple Keyword Searches**
- Query: "TODO list"
- Vector search: Perfect match at top
- Phi3 tries to "understand" semantic meaning
- Result: Re-ordering without improvement
- Impact: Added latency without value

### Best Practices

**1. Trust Intent Classification**
- Phi3 detects intent for a reason
- Use re-ranking when intent matches your goal
- Disable re-ranking for well-defined queries (exact matches)

**2. Consider Result Count**
- For 5 results: Re-ranking is fast (<500ms)
- For 20+ results: Re-ranking adds significant latency
- Consider limiting results for performance

**3. Compare Before and After**
- Before enabling Phi3: Note top 3-5 results and their scores
- After enabling Phi3: Compare order and relevance scores
- Make informed decision based on actual performance

## Context Extraction

### What It Does

For top 5 ranked results, Phi3 generates:
- **Snippet**: 2-3 most relevant sentences
- **Context**: Brief explanation of why this snippet matters
- **Confidence**: Quality indicator (0.0 to 1.0)

### When Context Extraction Helps

**Complex Technical Content**
- Content: "React useEffect cleanup prevents memory leaks by removing event listeners when components unmount. Common pattern: useEffect(() => { const subscription = api.subscribe(); return () => { subscription.unsubscribe(); }; }, []);"
- Simple: "React useEffect cleanup function"
- Phi3: "React useEffect cleanup prevents memory leaks by removing event listeners when components unmount."
- Why better: Phi3 identifies core concept (memory leaks, cleanup) instead of random text

**Long Code Examples**
- Content: Authentication flow with registration, login, session management, protected routes, logout
- Simple: "This is a comprehensive example showing the complete flow of user authentication..."
- Phi3: "Complete authentication flow: registration → login → JWT session → protected routes → logout. Includes error handling and security best practices."
- Why better: Phi3 extracts core topic (authentication flow) instead of generic text

### When Context Extraction Doesn't Help

**Very Short Content** (Under 50 words)
- Simple: "Error handling pattern"
- Phi3: "Error handling pattern" (same or worse)
- Why: Content is too short for Phi3 to add value

**Unstructured Code** (No clear structure)
- Simple: "inline code with no explanation"
- Phi3: "Inline code with no explanation" (Tries to extract "concept", but code has no context)
- Why: Phi3 can't find meaningful explanation in unstructured code

### Best Practices

**1. Use Confidence as Guide**
- `confidence > 0.8`: High-quality, trustworthy snippet
- `confidence 0.6-0.8`: Decent, relevant but may miss nuance
- `confidence < 0.6`: Low confidence, verify result content directly

**2. Use Context as Supplement**
- Phi3 context explains "why" snippet matters
- Still read full result to understand complete picture
- Don't rely on Phi3 context alone for decisions

**3. Lower Results Get No Context**
- Results ranked 6+ don't get AI-generated snippets
- This is intentional (avoid processing all 20 results)
- They get standard 200-character previews

## Performance Characteristics

### Latency Breakdown

| Operation | Without Phi3 | With Phi3 | Added Overhead |
|-----------|---------------|-------------|----------------|
| Vector Search | 50-100ms | 50-100ms | 0ms |
| Query Analysis | 0ms | 200-400ms | +200-400ms |
| Re-ranking | 0ms | 300-500ms | +300-500ms |
| Context (×5) | 0ms | 500-1500ms | +500-1500ms |
| **Total** | **50-100ms** | **1.1-2.0s** |

### Impact on Different Result Counts

| Result Count | Without Phi3 | With Phi3 | Overhead |
|-------------|---------------|-------------|----------|
| 5 results | 60-120ms | 1.2-2.0s | +1.1-1.9s |
| 10 results | 80-150ms | 2.0-4.0s | +1.9-3.9s |
| 20 results | 120-200ms | 2.5-5.0s | +2.4-4.8s |

**Insight**: More results = more latency. Consider reducing result limit for performance.

### Performance Tuning

**Optimize for Speed** (Development)
```json
{
  "phi3": {
    "tasks": {
      "search": {
        "timeout": 3000,      // Aggressive 3s timeout
        "priority": "high"
      }
    }
  }
}
```
**Trade-off**: Faster failures, may timeout on complex queries

**Optimize for Quality** (Production)
```json
{
  "phi3": {
    "tasks": {
      "search": {
        "timeout": 10000,     // Generous 10s timeout
        "priority": "high"
      }
    }
  }
}
```
**Trade-off**: Slower responses, better quality on edge cases

### Model Selection

**Performance Comparison**

| Model | Size | Speed | Quality | Best For |
|--------|------|-------|----------|-----------|
| phi3:latest | 2.2GB | Fast | Good | Development, iteration |
| phi3:mini | 1.1GB | Very Fast | Good | Rapid testing |
| mistral:7b | 4.1GB | Medium | Excellent | Accuracy-critical |
| llama3.1:8b | 4.7GB | Medium | Good | Balance |

**Recommendations**
- **Development**: Use `phi3:mini` for fastest iteration
- **Production**: Use `phi3:latest` for good balance
- **Accuracy-Critical**: Use `mistral:7b` despite size
- **Custom Models**: Add to `modelPriority` array if you have specific needs

## When to Use Phi3

### Workflow: Learning a New Technology

**Step 1: Initial Search** (Phi3 Disabled)
```bash
# Goal: Understand React hooks from scratch
# Time: ~100ms
bun run amalfa serve  # Phi3 disabled
# Search for: "What are React hooks?"
# Results: 20 documents about React hooks
```

**Step 2: Focused Follow-up** (Phi3 Enabled)
```bash
# Goal: Understand specific patterns
# Time: ~1.5s
# Query: "How does useEffect cleanup work?"
# Phi3 analyzes: intent=implementation, entities=["React","useEffect"]
# Suggests: "React hooks dependency array", "useEffect cleanup patterns"
# Vector search + re-ranking: 5 focused documents on useEffect
# Results: More specific, actionable content
```

**Step 3: Explore Related Topics** (Phi3 Suggested Queries)
```bash
# Goal: Discover related concepts
# Time: ~1.5s
# Query: "What about custom hooks?"
# Phi3 analyzes: intent=implementation, entities=["custom hooks"]
# Vector search + re-ranking: Conceptual search across patterns
# Results: Implementation-focused articles about custom hooks
```

**Value**: Phi3 enabled efficient exploration from broad to specific.

### Workflow: Debugging Complex Issue

**Step 1: Initial Search** (Phi3 Disabled)
```bash
# Goal: Understand async/await error handling
# Time: ~100ms
# Search for: "async await error handling"
# Results: Mix of tutorials, best practices, API docs
```

**Step 2: Refined Search** (Phi3 Enabled)
```bash
# Goal: Find implementation details
# Time: ~2s
# Query: "How to handle errors in async/await functions?"
# Phi3 analyzes: intent=implementation, technical=high
# Vector search + re-ranking: Prioritizes implementation guides over tutorials
# Results: 10 focused articles on error handling
```

**Outcome**: Phi3 filtered out generic tutorials, found specific code examples.

### Workflow: Cross-Technology Comparison

**Step 1: Broad Search** (Phi3 Enabled)
```bash
# Query: "React vs Vue vs Angular state management"
# Time: ~2s
# Phi3 analyzes: intent=conceptual
# Vector search across all three frameworks
# Results: Balanced mix of comparison articles and guides
```

**Step 2: Specific Comparison** (Phi3 Disabled)
```bash
# Query: "How does Vue handle computed properties?"
# Simple vector search
# Results: Vue-specific articles only
# Time: ~100ms
```

**Decision**: Use broad search with Phi3 for comparisons, specific search without Phi3 for focused questions.

## Performance Characteristics

### Latency Breakdown

| Operation | Without Phi3 | With Phi3 | Added Overhead |
|-----------|---------------|-------------|----------------|
| Vector Search | 50-100ms | 50-100ms | 0ms |
| Query Analysis | 0ms | 200-400ms | +200-400ms |
| Re-ranking | 0ms | 300-500ms | +300-500ms |
| Context (×5) | 0ms | 500-1500ms | +500-1500ms |
| **Total** | **50-100ms** | **1.1-2.0s** |

### Impact on Different Result Counts

| Result Count | Without Phi3 | With Phi3 | Overhead |
|-------------|---------------|-------------|----------|
| 5 results | 60-120ms | 1.2-2.0s | +1.1-1.9s |
| 10 results | 80-150ms | 2.0-4.0s | +1.9-3.9s |
| 20 results | 120-200ms | 2.5-5.0s | +2.4-4.8s |

**Insight**: More results = more latency. Consider reducing result limit for performance.

## When to Disable Phi3

### Good Reasons

**Development Mode**
- Need fastest possible search (<100ms latency)
- Rapid iteration cycles (50+ searches per day)
- Testing and debugging benefit from speed
- Phi3 adds 1-2s per search, slowing feedback loop

**Time-Critical Searches**
- Production monitoring dashboards or alerts
- Need <100ms response for real-time tracking
- Phi3 makes response time unpredictable (1-2s)

**Known Function or Concept**
- Searching for well-documented feature
- Vector search already finds exact matches perfectly
- Phi3 adds latency without improving results

**Resource Constraints**
- Running on laptop or CI/CD with limited resources
- Phi3/Ollama consumes significant CPU/memory
- Need to prioritize system stability over AI features

**Unstable Ollama**
- Frequent connection issues, timeouts
- Phi3 availability becomes unreliable
- Causes inconsistent behavior

### Temporary vs Permanent Disable

**Temporary Disable** (For Testing)
```bash
# Disable Phi3 temporarily
export PHI3_ENABLED=false
```

**Permanent Disable** (For Production)
```json
{
  "phi3": {
    "enabled": false     // Permanent choice
  }
}
```

## Common Pitfalls

**Pitfall 1: Over-Reliance on Intent Detection**
- Trusting Phi3's intent classification blindly
- Solution: Review suggested queries, verify intent with domain knowledge

**Pitfall 2: Ignoring Low Confidence**
- Using Phi3-generated snippets with `confidence < 0.6`
- Solution: Verify low-confidence snippets with full result content

**Pitfall 3: Small Query, Large Corpus**
- "What is React?" returns too many low-quality matches
- Solution: Use more specific queries, reduce result limit

**Pitfall 4: Not Monitoring Performance**
- Phi3 enabled without measuring impact
- Solution: Measure baseline, compare with Phi3 enabled, document decision

**Pitfall 5: Over-Enabling for Simple Queries**
- Using Phi3 for keyword searches or exact matches
- Solution: Use simple keyword/vector search for exact matches

## Monitoring and Debugging

### Key Metrics

**Search Latency**
```bash
# Time a search from trigger to response
time bun run amalfa serve
```

**Phi3 Health**
```bash
# Check Phi3 availability
bun run amalfa phi3 status
# Look for: ✅ Ollama is available and healthy
```

**Error Rates**
```bash
# Count Phi3 failures
grep "Phi3 unavailable" .amalfa/logs/mcp.log | wc -l
```

## Summary

### Key Takeaways

1. **Phi3 is Optional**: AMALFA works perfectly without it. Enable when it adds value.
2. **Query Type Matters**: Ambiguous, conceptual queries benefit most. Exact matches don't.
3. **Performance Trade-off**: 1-2s latency for better results. Choose based on use case.
4. **Intent Detection is a Guide**: Use Phi3's understanding, but verify with your own judgment.
5. **Context is Supplementary**: Smart snippets are helpful, but read full results for decisions.
6. **Monitor Performance**: Measure impact before committing to Phi3 in production.
7. **Suggested Queries are Powerful**: Use them to expand search scope and discover related topics.

### Decision Checklist

Before enabling Phi3 in production:
- [ ] Measured baseline performance without Phi3
- [ ] Tested Phi3 with sample queries
- [ ] Verified Ollama is stable
- [ ] Reviewed query patterns in your corpus
- [ ] Documented Phi3 configuration rationale
- [ ] Set appropriate timeouts based on query complexity
- [ ] Informed team/stakeholders about latency impact

### When to Use This Guide

**Before enabling Phi3**: Understand performance impact (1-2s latency)
**After enabling Phi3**: Monitor performance, adjust timeouts, troubleshoot issues
**During development**: A/B test Phi3 vs basic search
**In production**: Review logs monthly, optimize based on real usage patterns

## Next Steps

See related playbooks for more details:
- **System Overview**: `playbooks/phi3-system-overview.md` - Architecture and data flow
- **Setup Guide**: `playbooks/phi3-setup-guide.md` - Installation and configuration