## Task: Phi3 Multi-Purpose Sub-Agent Implementation

**Objective:** Reduce number of searches required to find implementation details from 7 to 2-3 by implementing an optional Phi3-powered sub-agent for search intelligence, metadata enhancement, content analysis, and interactive chat interface for corpus exploration and task guidance.

## High-Level Requirements:

- [ ] Implement Phi3 as an optional enhancement service (system works without it)
- [ ] Support multiple task types: search intelligence, metadata enhancement, content analysis, query suggestions
- [ ] Add interactive chat interface for corpus exploration and task guidance
- [ ] Implement two-phase metadata strategy (fast ingest + slow phi3 enhancement)
- [ ] Add graceful degradation (fallback to traditional search when Phi3 unavailable)
- [ ] Integrate with Ollama for model management and capability discovery
- [ ] Implement chat as primary interface to enhanced knowledge base with real-time task visibility

## Key Actions Checklist:

- [ ] **Phase 1: Foundation & Discovery**
  - Add Phi3 configuration to `amalfa.config.json`
  - Implement Ollama CLI integration for capability discovery
  - Create Phi3 daemon service with health checks
  - Implement graceful degradation pattern

- [ ] **Phase 2: Search Intelligence**
  - Implement query analysis endpoint (intent, entities, technical level)
  - Implement result re-ranking endpoint (context-aware relevance)
  - Implement context extraction endpoint (smart snippet generation)
  - Integrate with MCP server search pipeline

- [ ] **Phase 3: Metadata Enhancement**
  - Implement comprehensive metadata analysis endpoint
  - Create batch enhancement logic for existing docs
  - Add auto-enhancement for newly ingested docs
  - Implement CLI commands for manual enhancement

- [ ] **Phase 4: Integration & Testing**
  - Update MCP server to use Phi3 when available
  - Add CLI commands for Phi3 management
  - Implement fallback mechanisms for all tasks
  - Performance testing and optimization

- [ ] **Phase 5: Chat Interface & Advanced Capabilities**
  - Interactive chat interface for corpus exploration
  - Real-time task visibility and progress tracking in chat
  - Natural language corpus queries and document discovery
  - Guidance and control of enhancement process through chat
  - Content analysis (periodic corpus analysis)
  - Query suggestion learning
  - Relationship detection between documents
  - Background task orchestration

## Detailed Requirements

### Phi3 Service Architecture

```typescript
// src/daemon/phi3-agent.ts
const phi3Service = new ServiceLifecycle({
  name: "Phi3Agent",
  pidFile: join(AMALFA_DIRS.runtime, "phi3.pid"),
  entryPoint: "src/daemon/phi3-agent.ts",
  port: 3012
});

// Single daemon, multiple task endpoints
const taskEndpoints = {
  '/search/analyze': handleSearchAnalysis,      // Query understanding
  '/search/rerank': handleResultReranking,       // Result re-ranking
  '/search/context': handleContextExtraction,     // Smart snippets
  '/metadata/enhance': handleMetadataEnhancement, // Comprehensive analysis
  '/metadata/batch': handleBatchEnhancement,     // Batch processing
  '/content/analyze': handleContentAnalysis,     // Periodic analysis
  '/chat': handleChat,                          // Standard chat
  '/chat/stream': handleChatStream,               // Streaming responses
  '/chat/context': handleChatContext,            // Conversation state
  '/health': handleHealthCheck                    // Service health
};
```

### Ollama Integration

**Strategy: CLI for discovery, HTTP for inference**

```bash
# User setup (one-time)
curl -fsSL https://ollama.ai/install.sh | sh

# Discovery: Check what models are available
ollama list

# Discovery: Get model capabilities
ollama show phi3:latest
```

```typescript
// src/utils/ollama-discovery.ts
// Discovery: Use CLI (simple, reliable, no external dependencies)
async function discoverOllamaCapabilities() {
  try {
    // Check if Ollama is installed via CLI
    await exec('ollama --version');
    
    // List available models via CLI
    const { stdout } = await exec('ollama list');
    const models = parseOllamaList(stdout);
    
    // Check for phi3 specifically
    const phi3 = models.find(m => m.name === 'phi3:latest');
    
    if (!phi3) {
      console.log('⚠️  Phi3 not found. Run: ollama pull phi3:latest');
      return { available: false, suggestedModel: null };
    }
    
    // Get model details via CLI
    const modelInfo = await exec('ollama show phi3:latest');
    const capabilities = parseModelInfo(modelInfo.stdout);
    
    // Model priority order for search tasks
    const searchModel = [
      'phi3:latest',
      'mistral:7b-instruct-v0.3-q4_K_M',
      'llama3.1:8b'
    ].find(m => models.some(model => model.name === m));
    
    if (searchModel) {
      console.log(`✅ Using ${searchModel} for search tasks`);
    }
    
    return {
      available: true,
      model: searchModel || 'phi3:latest',
      size: phi3.size,
      capabilities: capabilities,
      allModels: models
    };
  } catch (error) {
    console.log('⚠️  Ollama not available. Phi3 features disabled.');
    console.log('   Install: curl -fsSL https://ollama.ai/install.sh | sh');
    return { available: false };
  }
}

// Inference: Use HTTP API (faster, can parallelize, supports streaming)
async function callPhi3(messages: Message[], options: RequestOptions) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.phi3.model,
      messages,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 200,
        ...options
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Phi3 API error: ${response.statusText}`);
  }
  
  return await response.json();
}

// Chat Session Management
const chatSessions = new Map<string, ChatSession>();

interface ChatSession {
  id: string;
  messages: Message[];
  startedAt: Date;
  enhancedContext: {
    corpusStats: CorpusStats;
    currentTask: TaskStatus | null;
    recentEnhancements: EnhancedDoc[];
  };
}

async function handleChat(req: ChatRequest) {
  const sessionId = req.sessionId;
  const session = getOrCreateSession(sessionId);
  
  // Add system message with corpus context
  const contextMessage = {
    role: "system",
    content: buildCorpusContext(session.enhancedContext)
  };
  
  // Add user message
  const userMessage = {
    role: "user",
    content: req.message
  };
  
  // Call Phi3 with conversation history
  const response = await callPhi3([
    contextMessage,
    ...session.messages,
    userMessage
  ]);
  
  // Update session
  session.messages.push(userMessage, response.message);
  
  return response;
}

function buildCorpusContext(context: EnhancedContext): string {
  return `
You are AMALFA Corpus Assistant. Help users understand and explore their knowledge base.

## Corpus Status
- Total docs: ${context.corpusStats.total}
- Enhanced docs: ${context.corpusStats.enhanced}
- Themes: ${context.corpusStats.themes.join(', ')}

## Current Activity
${context.currentTask 
  ? `🔄 Currently: ${context.currentTask.description}`
  : '✅ Idle (no background tasks)'
}

## Recent Enhancements
${context.recentEnhancements.slice(0, 3).map(doc => 
  `- ${doc.id}: ${doc.summary} (themes: ${doc.themes.join(', ')})`
).join('\n')}

User can ask you about:
1. Corpus structure and themes
2. What you're currently working on
3. Search for documents by theme/type
4. Guide enhancement process
5. Natural language queries to knowledge base
`;
}
 
### Why CLI Discovery + HTTP Inference is Optimal
 
**Discovery via CLI:**
- ✅ **No external dependencies** - No need for Node.js Ollama client libraries
- ✅ **Simple and reliable** - Uses standard Bun.spawn / exec commands
- ✅ **Error handling is straightforward** - Just parse stdout/stderr
- ✅ **No HTTP overhead for one-time operations** - Faster discovery on startup
- ✅ **Works with any Ollama version** - CLI is stable across versions
- ✅ **Clear user feedback** - Can show exact install commands from CLI output
 
**Inference via HTTP:**
- ✅ **Faster than CLI for repeated calls** - No process spawning overhead
- ✅ **Can parallelize requests** - Multiple simultaneous API calls
- ✅ **Supports streaming responses** - Better for long-form generation
- ✅ **Standard JSON API** - Easier to integrate with existing code
- ✅ **Health checks are simple** - Just GET /api/tags or POST /api/generate
- ✅ **Better for real-time tasks** - Lower latency than process spawn
 
**Hybrid Benefits:**
```typescript
// Discovery (one-time, startup)
await exec('ollama list');  // ~50ms, reliable
 
// Inference (repeated, runtime)
await fetch('http://localhost:11434/api/chat');  // ~100ms, parallelizable
```
 
**Comparison:**
| Approach | Discovery | Inference | Total Overhead |
|----------|-----------|------------|----------------|
| **CLI-only** | Fast (~50ms) | Slow (~500ms per call) | High (process spawn) |
| **HTTP-only** | Complex (need client lib) | Fast (~100ms) | Medium (network) |
| **Hybrid (CLI+HTTP)** ✅ | Fast (~50ms) | Fast (~100ms) | Low (optimal) |
 
**Bottom Line:** CLI for discovery ensures reliability and simplicity, HTTP for inference ensures speed and parallelization. Best of both worlds.
 
### Configuration

```typescript
// amalfa.config.json
{
  "phi3": {
    "enabled": true,  // Optional: true/false
    "autoDiscovery": true,  // Auto-detect Ollama on startup
    "discoveryMethod": "cli",  // Use CLI for discovery (reliable)
    "inferenceMethod": "http",  // Use HTTP for inference (faster)
    "model": "phi3:latest",  // Auto-selected based on availability
    "modelPriority": [  // Priority order for model selection
      "phi3:latest",
      "mistral:7b-instruct-v0.3-q4_K_M",
      "llama3.1:8b"
    ],
    "host": "localhost:11434",
    "tasks": {
      "search": {
        "enabled": true,
        "timeout": 5000,  // 5 seconds for search tasks
        "priority": "high"  // Real-time interaction
      },
      "metadata": {
        "enabled": true,
        "timeout": 30000,  // 30 seconds per doc
        "autoEnhance": true,  // Auto-enhance new docs
        "batchSize": 10  // Process 10 docs at a time
      },
      "content": {
        "enabled": false,  // Disabled by default (resource intensive)
        "timeout": 300000,  // 5 minutes
        "schedule": "daily"
      }
    }
  }
}
```

### Two-Phase Metadata Strategy

**Phase 1: Fast Ingest (always runs, milliseconds)**
```typescript
// src/pipeline/AmalfaIngestor.ts
const fastIngest = {
  duration: "milliseconds",
  llmCalls: 0,
  metadata: {
    source: "/path/to/file.md",
    hash: "abc123",
    frontmatter: { title: "...", tags: [...] },
    semantic_tokens: [...]  // Extracted by tokenizer
  }
};
```

**Phase 2: Phi3 Enhancement (optional, seconds per doc)**
```typescript
// src/daemon/phi3-agent.ts
const enhanceMetadata = async (docId: string) => {
  const node = db.getNode(docId);
  const content = await Bun.file(node.meta.source).text();
  
  const enhancement = await phi3.analyze({
    content,
    tasks: [
      "extract_semantic_themes",
      "identify_code_patterns", 
      "summarize_sections",
      "detect_document_type",
      "suggest_related_docs"
    ]
  });
  
  db.updateNodeMeta(docId, {
    ...node.meta,
    phi3_enhanced: true,
    phi3_enhanced_at: new Date().toISOString(),
    themes: enhancement.themes,
    code_patterns: enhancement.patterns,
    summary: enhancement.summary,
    doc_type: enhancement.type,
    technical_depth: enhancement.depth,
    audience: enhancement.audience
  });
};
```

### Graceful Degradation

```typescript
// src/mcp/index.ts
async function search(query: string) {
  const phi3Enabled = config.phi3?.enabled && 
                     await checkPhi3Health();
  
  // Search with or without Phi3
  const results = phi3Enabled 
    ? await enhancedSearchWithPhi3(query)
    : await basicSearch(query);
  
  return results;
}

async function enhancedSearchWithPhi3(query: string) {
  // Step 1: Analyze query
  const analysis = await phi3Agent.search.analyze(query);
  
  // Step 2: Vector search
  const results = await vectorEngine.search(
    analysis.primaryQuery || query
  );
  
  // Step 3: Re-rank results
  const ranked = await phi3Agent.search.rerank(
    results, 
    analysis.intent
  );
  
  // Step 4: Extract context
  const contextualized = await Promise.all(
    ranked.map(r => phi3Agent.search.context(r, query))
  );
  
  return contextualized;
}

async function basicSearch(query: string) {
  // Traditional search without Phi3
  const results = await vectorEngine.search(query);
  return results.map(r => ({
    ...r,
    preview: r.content?.slice(0, 200) || "[Hollow Node]"
  }));
}
```

### Task Type Implementation

**Task 1: Search Intelligence (Real-time)**
```typescript
async function handleSearchAnalysis(query: string) {
  const response = await callPhi3([{
    role: "system",
    content: "You are a search query analyzer. Return JSON only."
  }, {
    role: "user",
    content: `Analyze this query: "${query}"
    
    Return JSON:
    {
      "intent": "implementation|conceptual|example",
      "entities": ["term1", "term2"],
      "technical_level": "high|medium|low",
      "suggested_queries": ["query1", "query2"]
    }`
  }], {
    temperature: 0.1,
    num_predict: 200
  });
  
  return response.message;
}
```

**Task 2: Metadata Enhancement (Background)**
```typescript
async function handleMetadataEnhancement(docId: string) {
  const node = db.getNode(docId);
  const content = await Bun.file(node.meta.source).text();
  
  const response = await callPhi3([{
    role: "system",
    content: "You are a document analyzer. Extract comprehensive metadata."
  }, {
    role: "user",
    content: `Analyze this document comprehensively:
    
    Content: ${content}
    
    Return JSON:
    {
      "themes": ["theme1", "theme2"],
      "code_patterns": ["pattern1", "pattern2"],
      "summary": "2-3 sentence summary",
      "doc_type": "implementation|conceptual|architecture|reference",
      "technical_depth": "deep|medium|shallow",
      "audience": "developer|user|architect",
      "related_docs": ["doc1", "doc2"]
    }`
  }], {
    temperature: 0.2,
    num_predict: 500
  });
  
  return response.message;
}
```

**Task 3: Batch Enhancement**
```typescript
async function handleBatchEnhancement(options: { limit?: number } = {}) {
  const limit = options.limit || 50;
  const unenhanced = db.getNodes({ 
    phi3_enhanced: false 
  });
  const batch = unenhanced.slice(0, limit);
  
  console.log(`🔄 Enhancing ${batch.length} docs with Phi3...`);
  
  const results = await Promise.allSettled(
    batch.map(node => enhanceMetadata(node.id))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`✅ Enhanced: ${successful}, ❌ Failed: ${failed}`);
  
  return { successful, failed, total: batch.length };
}
```

### CLI Integration

```bash
# Phi3 status
amalfa phi3 status

# Enable/disable Phi3
amalfa phi3 enable
amalfa phi3 disable

# Start/stop Phi3 daemon
amalfa phi3 start
amalfa phi3 stop

# Manual enhancement
amalfa enhance --doc 2026-01-07-mcp-server-fix

# Batch enhancement
amalfa enhance --batch --limit 100

# Auto-enhance (daemon mode)
amalfa phi3-daemon start  # Auto-enhance new docs

# Interactive chat
amalfa phi3 chat  # Start interactive corpus assistant

# Chat queries
amalfa phi3 chat --message "What are you working on?"
amalfa phi3 chat --message "Show me docs about security"
```

## Implementation Notes

### Phi3 Model Requirements

**Recommended Model: phi3:latest**
- Size: 2.2 GB
- Speed: 100-250ms per task (search), 5-30s per doc (enhancement)
- Memory: Fits alongside other services
- Capability: Instruction-tuned for structured tasks

**Alternatives:**
- `mistral:7b-instruct-v0.3-q4_K_M` - More capable, slower (4.4 GB)
- `llama3.1:8b` - General purpose, slower (4.9 GB)

### Performance Considerations

**Search Tasks (Real-time):**
- Query analysis: ~100-150ms
- Result re-ranking: ~100-150ms  
- Context extraction: ~100-150ms
- **Total search latency**: ~320-500ms (acceptable for knowledge graphs)

**Enhancement Tasks (Background):**
- Single doc enhancement: 5-30s
- Batch of 10 docs: 50s-5m (parallel processing)
- Auto-enhancement: Runs as daemon, non-blocking

**Resource Usage:**
- Phi3 model in memory: 2.2 GB
- Additional overhead: ~500 MB
- **Total**: ~2.7 GB (reasonable on modern machines)

### Task Priority Queue

```typescript
// Search tasks have higher priority than enhancement
const taskQueue = {
  high: [
    "search-analysis",
    "search-rerank", 
    "search-context"
  ],
  low: [
    "metadata-enhance",
    "batch-enhance",
    "content-analyze"
  ]
};

// Process queue
async function processTaskQueue() {
  // Always process high-priority tasks first
  while (taskQueue.high.length > 0) {
    await processTask(taskQueue.high.shift());
  }
  
  // Process low-priority tasks in background
  if (taskQueue.low.length > 0) {
    processTask(taskQueue.low.shift());
  }
}
```

### Success Metrics

**Primary:**
- Reduce average searches per answer from 7 to 2-3
- First result relevance score > 0.8 for technical queries (with Phi3)
- Search latency < 1s (with Phi3)

**Secondary:**
- Metadata enhancement coverage > 90% of docs
- Enhancement accuracy (manual spot check)
- User satisfaction with result context

**Tertiary:**
- System works gracefully without Phi3 (fallback effectiveness)
- Resource utilization (memory, CPU)
- Task queue throughput

## Dependencies

**Existing:**
- `src/resonance/schema.ts` (add phi3_enhanced fields)
- `src/core/VectorEngine.ts` (search integration)
- `src/pipeline/AmalfaIngestor.ts` (ingest integration)
- `src/mcp/index.ts` (MCP integration)
- `src/utils/ServiceLifecycle.ts` (service management)

**New:**
- `src/daemon/phi3-agent.ts` (Phi3 daemon service)
- `src/utils/ollama-discovery.ts` (Ollama integration)
- `src/cli/phi3-commands.ts` (CLI commands)
- `src/cli/enhance-commands.ts` (enhancement commands)

**External:**
- Ollama (user must install)
- phi3:latest model (Ollama will download)

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Ollama not installed | Medium | Auto-detect, graceful degradation, clear user guidance |
| Phi3 model not available | Medium | Auto-pull prompt, suggest alternatives |
| Phi3 daemon crashes | High | Health checks, auto-restart, fallback to basic search |
| Enhancement slows ingest | Medium | Enhancement is async/background, doesn't block ingest |
| High memory usage | Low | Phi3 is optional, can disable on resource-constrained systems |
| Task queue backlogs | Low | Priority queue (search > enhancement), configurable limits |

## Timeline Estimate

- **Phase 1 (Foundation)**: 2-3 days
  - Phi3 service setup, Ollama integration, health checks
- **Phase 2 (Search Intelligence)**: 2-3 days
  - Query analysis, re-ranking, context extraction, MCP integration
- **Phase 3 (Metadata Enhancement)**: 2-3 days
  - Enhancement endpoint, batch processing, CLI commands
- **Phase 4 (Integration & Testing)**: 2-3 days
  - Full integration, fallback testing, performance optimization
- **Phase 5 (Additional Capabilities)**: 2-3 days
  - Content analysis, query suggestions, relationship detection

**Total: 2.5-3 weeks** (includes chat interface development)

## Chat Interface & User Interaction

### Chat Use Cases

**1. Status & Progress Tracking:**
```bash
$ amalfa phi3 chat
You> What are you working on?
Phi3> 🔄 I'm batch enhancing your corpus!
        Working on: 50 documents
        Progress: 12/50 (24%)
        Current: "mcp-server-fix.md"
        Time remaining: ~3 minutes
        
        Themes discovered so far:
        - authentication (8 docs)
        - security (6 docs)
        - database (12 docs)
        - architecture (15 docs)
```

**2. Natural Language Corpus Queries:**
```bash
You> What docs do we have about authentication?
Phi3> I found 5 documents with authentication themes:
        
        1. 2026-01-07-mcp-server-fix.md
           - Type: implementation
           - Depth: deep
           - Themes: authentication, security, database
           - Summary: "MCP server fix for hollow nodes..."
        
        2. authentication-flow.md
           - Type: architecture
           - Depth: medium
           - Themes: authentication, token-validation
           - Summary: "Authentication flow..."
        
        Want to read any of these?
```

**3. Enhancement Guidance & Control:**
```bash
You> Focus on API documentation first
Phi3> 🔄 Reprioritizing enhancement queue!
        
        New priority order:
        1. api-reference.md (type: reference)
        2. mcp-api-docs.md (type: implementation)
        3. authentication-api.md (type: reference)
        ...
        
        Processing 10 API docs first.
        Estimated time: 3 minutes
```

**4. Debugging & Insights:**
```bash
You> Why did you mark this as "conceptual"?
Phi3> I analyzed "the-bicameral-graph.md" and classified it as:
        
        Type: conceptual
        Reasoning:
        - Philosophy and opinions (not code)
        - Theoretical framework explanation
        - No implementation details
        - Target audience: architects/philosophers
        
        Confidence: 92%
        
        Should I reclassify it as "architecture"?
```

### Chat Implementation

**CLI Interface:**
```typescript
// src/cli/phi3-chat.ts
async function startInteractiveChat() {
  const sessionId = generateId();
  console.log('Welcome to AMALFA Phi3 Assistant! 🤖\n');
  
  while (true) {
    const input = await prompt('You> ');
    
    if (input === '/quit') break;
    
    const response = await callChatEndpoint(sessionId, input);
    console.log(`Phi3> ${response.message}\n`);
  }
  
  console.log('Goodbye! Come back anytime to explore your corpus.');
}
```

**HTTP Streaming Endpoint:**
```typescript
async function handleChatStream(req: Request) {
  const sessionId = req.headers.get('x-session-id') || generateId();
  const session = getOrCreateSession(sessionId);
  
  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          model: 'phi3:latest',
          messages: buildChatMessages(session, req.message),
          stream: true
        })
      });
      
      // Stream Phi3 responses to client
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        controller.enqueue(encoder.encode(value));
      }
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

## User Setup Instructions

**For users who want Phi3 features:**

1. Install Ollama:
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. Pull Phi3 model (optional - system will auto-detect and prompt):
   ```bash
   ollama pull phi3:latest
   ```

3. Verify Ollama is running:
   ```bash
   ollama list
   # Should show phi3:latest in the output
   ```

4. Enable Phi3 in config (auto-detected on startup):
   ```bash
   amalfa phi3 enable
   # System will discover phi3:latest via CLI
   ```

5. Start Phi3 daemon:
   ```bash
   amalfa phi3 start
   ```

6. Verify setup:
   ```bash
   amalfa phi3 status
   # Output: ✅ Phi3 running, model: phi3:latest (2.2 GB), inference: HTTP
   ```

**Automatic Discovery Flow:**
```bash
# On first run, system will:
$ amalfa phi3 start
# Checking Ollama availability via CLI... ✅
# Discovering models... phi3:latest (2.2 GB), mistral:7b (4.4 GB)
# Selected model: phi3:latest (priority: #1)
# Starting Phi3 daemon... ✅
# Ready for search and enhancement tasks!
```

**For users who don't want Phi3:**
- System works perfectly without it
- All features available (using traditional search)
- Can enable later if needed - no manual config required

**For users who want interactive corpus exploration:**
```bash
# Start chat interface
$ amalfa phi3 chat
Welcome to AMALFA Phi3 Assistant! 🤖

Phi3> 👋 I've analyzed your knowledge corpus. Currently 89/156 docs enhanced.
       Themes: authentication, security, architecture, pipeline
       
       You can ask me to:
       - What are you working on?
       - Show me docs about [topic]
       - Focus enhancement on [type]
       - Why did you classify [doc] as [type]?
       - Search for [query]

You> What are you working on?
Phi3> 🔄 Enhancing documents in batch mode...
       Progress: 23/50 (46%)
       Current: mcp-server-fix.md
       Recent themes: authentication, security, database
       
       Should I prioritize security docs?

You> Yes
Phi3> 🔄 Reprioritizing! Security docs first now...
       New order: mcp-security-audit.md, auth-flow.md, ...
       Estimated time: 2 minutes
```

## Chat Interface Benefits

| Aspect | Without Chat | With Chat |
|---------|--------------|------------|
| **Transparency** | ❌ Black box, no visibility | ✅ Real-time task progress and status |
| **Control** | ❌ No influence on enhancement | ✅ Guide and prioritize enhancement process |
| **Discovery** | ❌ Manual search and filtering | ✅ Natural language corpus queries |
| **Understanding** | ❌ Unclear what Phi3 learned | ✅ Ask "why?" about classifications |
| **Debugging** | ❌ Hard to understand decisions | ✌ Interactive debugging of enhancement logic |
| **User Experience** | ❌ Opaque background service | ✅ Interactive corpus assistant |
