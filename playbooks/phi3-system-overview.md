# Phi3 System Overview

## Purpose
Phi3 is a **lightweight, fast AI model** (2.2GB) that enhances AMALFA's search through semantic understanding and intelligent re-ranking. It excels at quick query analysis and contextual relevance scoring.

## Architecture

### High-Level Components
```
┌─────────────────────────────────────────────────────────────┐
│                     AMALFA MCP Server                          │
│                    (main entry point)                             │
│                                                               │
│  ┌──────────────┐  ┌──────────────────┐              │
│  │   Vector     │  │    Phi3         │              │
│  │   Engine     │◄─┤   Daemon       │◄───────────────┐
│  │   (BGE)      │  │   (port 3012)  │               │
│  └──────────────┘  └──────────────────┘               │
│         │                                                │
│         │                                                │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐          │
│  │  Enhanced Search Pipeline               │          │
│  │  1. Analyze query intent (Phi3)      │          │
│  │  2. Vector search candidates           │          │
│  │  3. Re-rank results (Phi3)           │          │
│  │  4. Extract context (Phi3)            │          │
│  └──────────────────────────────────────────────────┘          │
│                                                               │
└───────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                          Claude/Desktop
                         (via MCP Protocol)
```

### Component Responsibilities

#### 1. Phi3 Daemon (`src/daemon/phi3-agent.ts`)
**Port:** 3012 (configurable via `phi3.port`)

**Endpoints:**
- `GET /health` - Health check and availability status
- `POST /search/analyze` - Query intent analysis (200ms)
- `POST /search/rerank` - Context-aware result re-ranking (300ms)
- `POST /search/context` - Smart snippet generation (500ms)

**Performance:**
- 1-2s startup (model loading)
- 200-500ms per search operation
- Small model size (2.2GB)
- Fast inference speed

#### 2. Ollama Integration (`src/utils/ollama-discovery.ts`)
**Model:** Phi3:latest (2.2GB)

**Discovery:**
- `discoverOllamaCapabilities()` - CLI-based model detection
- `checkOllamaHealth()` - Quick health check (cached)
- `getRecommendedModel()` - Model selection based on availability

**Strategy:**
- Discovery: CLI (reliable)
- Inference: HTTP (10x faster than CLI)

#### 3. Phi3 Client (`src/utils/phi3-client.ts`)
**Features:**
- Health check with 30s cache
- Graceful degradation (returns null when Phi3 unavailable)
- Timeout handling via AbortController
- JSON parsing with fallbacks

#### 4. MCP Server (`src/mcp/index.ts`)
**Integration:** Enhanced `search_documents` tool

**3-Step Pipeline:**
1. Analyze query with Phi3 (if available)
2. Vector search for candidates
3. Re-rank results based on query intent
4. Extract smart snippets for top 5 results

#### 5. Vector Engine (`src/core/VectorEngine.ts`)
**Role:** Fast semantic search via BGE embeddings

## Data Flow

### Enhanced Search Pipeline
```
User Query "React component lifecycle"
    │
    ├─► Step 1: Query Analysis (Phi3, 200ms)
    │   Intent: "implementation"
    │   Suggested: "React hooks"
    │
    ├─► Step 2: Vector Search (50-100ms)
    │   Candidate 1: "Component lifecycle methods..."
    │   Candidate 2: "State management in React..."
    │   Candidate 3: "React props and state..."
    │
    ├─► Step 3: Re-ranking (Phi3, 300ms)
    │   Result 1: relevance 0.95 (implementation)
    │   Result 2: relevance 0.92 (implementation)
    │   Result 3: relevance 0.70 (related concept)
    │
    ├─► Step 4: Context Extraction (Phi3, 500ms)
    │   Result 1: AI snippet (high confidence)
    │   Result 2: AI snippet (high confidence)
    │   Result 3: Simple preview
    │
    ▼
Claude receives results
Total: ~1-1.5s (acceptable for enhanced search)
```

## Configuration

### Phi3 Configuration (`amalfa.config.json`)
```json
{
  "phi3": {
    "enabled": true,
    "port": 3012,
    "model": "phi3:latest",
    "tasks": {
      "search": {
        "enabled": true,
        "timeout": 5000
      }
    }
  }
}
```

## Performance

### Latency Breakdown
| Operation | Latency | Notes |
|-----------|----------|--------|
| Vector Search | 50-100ms | Fast, always available |
| Query Analysis | 200-400ms | Added when Phi3 enabled |
| Re-ranking | 300-500ms | Reorders 5-20 results |
| Context (×5) | 500-1500ms | Smart snippets for top results |
| Total (enhanced) | 1.1-2.5s | Fast, acceptable latency |
| Total (basic) | 50-100ms | Minimal, always fast |

### When Phi3 Excels

**1. Fast Query Resolution**
- "How does useEffect cleanup work?" → Intent detected in 200ms
- Perfect for technical implementation questions
- Returns specific, actionable results

**2. Context-Aware Re-ranking**
- Understands query intent (implementation vs conceptual)
- Boosts relevant results higher
- Deprioritizes unrelated but similar content

**3. Smart Snippets**
- Generates 2-3 sentence relevant excerpts
- Explains why snippet matters
- Provides context for top 5 results

**4. Quick Iteration**
- Small model = fast development cycles
- Test changes in seconds, not minutes
- A/B test different approaches rapidly

### When to Use Phi3

### Perfect Candidates
- **Technical queries:** "How does React useEffect work?"
- **Implementation searches:** "Error handling in Node.js"
- **Code understanding:** "Python async/await patterns"
- **Exploration:** "What is event-driven architecture?"

### Use Less
- **Simple keyword searches:** "TODO list", "Read node by ID"
- **Exact file names:** Known function or method names
- **Time-critical:** Need <100ms responses
- **Unstable Ollama:** Frequent connection issues

## Benefits

### What Phi3 Provides

**1. Query Understanding**
- Detects search intent: implementation, conceptual, or example
- Extracts key entities and technical terms
- Suggests 3-5 related queries for exploration
- Enables semantic search refinement

**2. Improved Relevance**
- Context-aware scoring based on query intent
- Better than raw vector similarity for nuanced queries
- Reduces false positives by understanding user intent

**3. Better Context**
- AI-generated snippets instead of simple truncation
- Explains why result is relevant
- High confidence scores indicate quality

**4. Backward Compatible**
- System works perfectly when Phi3 is disabled
- No breaking changes to existing features
- Optional enhancement (opt-in by default)

## Getting Started

### Quick Start
```bash
# 1. Enable Phi3
echo '{"phi3":{"enabled":true}}' | jq . > amalfa.config.json

# 2. Start Phi3 daemon
bun run amalfa phi3 start

# 3. Verify status
bun run amalfa phi3 status
```

### See Also
- **Setup Guide:** `playbooks/phi3-setup-guide.md` - Installation and configuration
- **Usage Guide:** `playbooks/phi3-usage-guide.md` - When and how to use Phi3 effectively