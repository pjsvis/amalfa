#!/usr/bin/env bun
/**
 * AMALFA Phi3 Multi-Purpose Sub-Agent
 * Daemon for search intelligence, metadata enhancement, and interactive chat
 */

import { join } from "path";
import { loadConfig, AMALFA_DIRS } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";
import { ServiceLifecycle } from "@src/utils/ServiceLifecycle";
import { checkOllamaHealth } from "@src/utils/ollama-discovery";

const args = process.argv.slice(2);
const command = args[0] || "serve";
const log = getLogger("Phi3Agent");

// Service lifecycle management
const lifecycle = new ServiceLifecycle({
  name: "Phi3Agent",
  pidFile: join(AMALFA_DIRS.runtime, "phi3.pid"),
  logFile: join(AMALFA_DIRS.logs, "phi3.log"),
  entryPoint: "src/daemon/phi3-agent.ts",
});

// Global state
let server: Bun.Server | null = null;

// Global state
let ollamaAvailable = false;
let ollamaModel = "phi3:latest";

/**
 * Message interface for chat API
 */
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Request options for Ollama API
 */
interface RequestOptions {
  temperature?: number;
  num_predict?: number;
  stream?: boolean;
}

/**
 * Call Ollama HTTP API for inference
 * This is the preferred method for inference (faster, supports streaming)
 */
async function callOllama(
  messages: Message[],
  options: RequestOptions = {},
): Promise<{ message: Message }> {
  const config = await loadConfig();
  const host = config.phi3?.host || "localhost:11434";
  const model = config.phi3?.model || "phi3:latest";

  const response = await fetch(`http://${host}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 200,
        ...options,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Check if Phi3/Ollama is available and healthy
 */
async function checkPhi3Health(): Promise<boolean> {
  try {
    // Check Ollama health
    const ollamaHealthy = await checkOllamaHealth();
    if (!ollamaHealthy) {
      return false;
    }

    // Try a simple inference to verify model is loaded
    const testResponse = await callOllama(
      [
        {
          role: "user",
          content: "Respond with just 'OK'",
        },
      ],
      { num_predict: 2 },
    );

    return testResponse.message?.content === "OK";
  } catch (error) {
    log.warn({ error }, "Phi3 health check failed");
    return false;
  }
}

/**
 * Handle search analysis task
 * Analyzes query intent, entities, and technical level
 */
async function handleSearchAnalysis(query: string): Promise<unknown> {
  if (!ollamaAvailable) {
    throw new Error("Phi3 is not available");
  }

  try {
    const response = await callOllama(
      [
        {
          role: "system",
          content: "You are a search query analyzer. Return JSON only.",
        },
        {
          role: "user",
          content: `Analyze this query: "${query}"

    Return JSON:
    {
      "intent": "implementation|conceptual|example",
      "entities": ["term1", "term2"],
      "technical_level": "high|medium|low",
      "suggested_queries": ["query1", "query2"]
    }`,
        },
      ],
      {
        temperature: 0.1,
        num_predict: 200,
      },
    );

    // Parse JSON response
    const content = response.message.content;
    try {
      return JSON.parse(content);
    } catch {
      // Fallback if not JSON
      return {
        intent: "unknown",
        entities: [],
        technical_level: "medium",
        suggested_queries: [],
      };
    }
  } catch (error) {
    log.error({ error, query }, "Search analysis failed");
    throw error;
  }
}

/**
 * Handle metadata enhancement task
 * Comprehensive document analysis for enhanced metadata
 */
async function handleMetadataEnhancement(docId: string): Promise<unknown> {
  if (!ollamaAvailable) {
    throw new Error("Phi3 is not available");
  }

  try {
    // In a real implementation, we would fetch the document content here
    // For now, we'll simulate with a placeholder
    const content = `[Document content for ${docId}]`;

    const response = await callOllama(
      [
        {
          role: "system",
          content:
            "You are a document analyzer. Extract comprehensive metadata.",
        },
        {
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
    }`,
        },
      ],
      {
        temperature: 0.2,
        num_predict: 500,
      },
    );

    const contentStr = response.message.content;
    try {
      return JSON.parse(contentStr);
    } catch {
      return {
        themes: [],
        code_patterns: [],
        summary: "",
        doc_type: "unknown",
        technical_depth: "medium",
        audience: "developer",
        related_docs: [],
      };
    }
  } catch (error) {
    log.error({ error, docId }, "Metadata enhancement failed");
    throw error;
  }
}

/**
 * Handle batch enhancement task
 * Processes multiple documents for metadata enhancement
 */
async function handleBatchEnhancement(limit = 50): Promise<{
  successful: number;
  failed: number;
  total: number;
}> {
  if (!ollamaAvailable) {
    throw new Error("Phi3 is not available");
  }

  // In a real implementation, we would query the database for unenhanced docs
  // For now, we'll simulate with a placeholder
  const unenhanced: Array<{ id: string }> = Array.from(
    { length: limit },
    (_, i) => ({
      id: `doc-${i}`,
    }),
  );
  const batch = unenhanced.slice(0, limit);

  log.info(`🔄 Enhancing ${batch.length} docs with Phi3...`);

  const results = await Promise.allSettled(
    batch.map((node) => handleMetadataEnhancement(node.id)),
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  log.info(`✅ Enhanced: ${successful}, ❌ Failed: ${failed}`);

  return { successful, failed, total: batch.length };
}

/**
 * Handle result re-ranking
 * Re-ranks search results based on query intent and context
 */
async function handleResultReranking(
  results: Array<{ id: string; content: string; score: number }>,
  query: string,
  intent?: string,
): Promise<
  Array<{ id: string; content: string; score: number; relevance_score: number }>
> {
  if (!ollamaAvailable) {
    throw new Error("Phi3 is not available");
  }

  try {
    const response = await callOllama(
      [
        {
          role: "system",
          content:
            "You are a search result re-ranker. Analyze relevance and provide scores.",
        },
        {
          role: "user",
          content: `Re-rank these search results for query: "${query}"${
            intent ? `\nQuery intent: ${intent}` : ""
          }

Results:
${results.map((r, i) => `${i + 1}. ${r.content.slice(0, 200)}`).join("\n")}

Return JSON array with relevance scores (0.0 to 1.0):
[
  {"index": 1, "relevance": 0.95, "reason": "Direct match"},
  {"index": 2, "relevance": 0.7, "reason": "Related concept"}
]`,
        },
      ],
      {
        temperature: 0.2,
        num_predict: 300,
      },
    );

    const content = response.message.content;
    try {
      const rankings = JSON.parse(content);

      // Apply rankings to results
      return results.map((result, idx) => {
        const ranking = rankings.find(
          (r: { index: number }) => r.index === idx + 1,
        );
        return {
          ...result,
          relevance_score: ranking?.relevance || 0.5,
        };
      });
    } catch {
      // Fallback: return original scores
      return results.map((r) => ({ ...r, relevance_score: r.score }));
    }
  } catch (error) {
    log.error({ error, query }, "Result re-ranking failed");
    throw error;
  }
}

/**
 * Handle context extraction
 * Generates smart snippets with context awareness
 */
async function handleContextExtraction(
  result: { id: string; content: string },
  query: string,
): Promise<{ snippet: string; context: string; confidence: number }> {
  if (!ollamaAvailable) {
    throw new Error("Phi3 is not available");
  }

  try {
    const response = await callOllama(
      [
        {
          role: "system",
          content:
            "You are a context extractor. Provide relevant snippets with context.",
        },
        {
          role: "user",
          content: `Extract relevant context for query: "${query}"

Content:
${result.content}

Return JSON:
{
  "snippet": "Most relevant 2-3 sentences",
  "context": "Brief explanation of relevance",
  "confidence": 0.9
}`,
        },
      ],
      {
        temperature: 0.1,
        num_predict: 200,
      },
    );

    const content = response.message.content;
    try {
      return JSON.parse(content);
    } catch {
      // Fallback: return simple snippet
      const words = result.content.split(" ");
      const snippet = words.slice(0, 50).join(" ");
      return {
        snippet,
        context: "Full content available",
        confidence: 0.5,
      };
    }
  } catch (error) {
    log.error({ error, resultId: result.id }, "Context extraction failed");
    throw error;
  }
}

/**
 * Main daemon logic
 */
async function main() {
  const config = await loadConfig();

  if (!config.phi3?.enabled) {
    log.warn("⚠️  Phi3 is disabled in configuration. Exiting.");
    process.exit(0);
  }

  log.info("🚀 Phi3 Agent starting...");

  // Check Ollama availability
  log.info("🔍 Checking Ollama availability...");
  ollamaAvailable = await checkOllamaHealth();

  if (ollamaAvailable) {
    log.info("✅ Ollama is available and healthy");
    ollamaModel = config.phi3?.model || "phi3:latest";
  } else {
    log.warn("⚠️  Ollama is not available");
    log.warn("   Phi3 features will be disabled");
    log.info("   Install: curl -fsSL https://ollama.ai/install.sh | sh");
    log.info("   Then run: ollama pull phi3:latest");
  }

  log.info("✅ Phi3 Agent ready");

  // Register signal handlers for graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`🛑 Received ${signal}, shutting down...`);
    if (server) {
      server.stop();
      server = null;
    }
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Start HTTP server
  const port = config.phi3?.port || 3012;

  log.info(`🚀 Starting HTTP server on port ${port}`);
  log.info("📋 Available endpoints:");
  log.info("   POST /search/analyze - Query analysis");
  log.info("   POST /search/rerank  - Result re-ranking");
  log.info("   POST /search/context - Smart snippet generation");
  log.info("   GET  /health        - Health check");

  server = Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);

      // CORS headers
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };

      // Handle preflight requests
      if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
      }

      // Health check endpoint
      if (url.pathname === "/health") {
        const healthy = await checkOllamaHealth();
        return Response.json(
          {
            status: healthy ? "healthy" : "unhealthy",
            ollama_available: ollamaAvailable,
            model: ollamaModel,
          },
          { headers: corsHeaders },
        );
      }

      // Search analysis endpoint
      if (url.pathname === "/search/analyze" && req.method === "POST") {
        try {
          const body = await req.json();
          const { query } = body;

          if (!query || typeof query !== "string") {
            return Response.json(
              { error: "Missing or invalid 'query' parameter" },
              { status: 400, headers: corsHeaders },
            );
          }

          const analysis = await handleSearchAnalysis(query);
          return Response.json(analysis, { headers: corsHeaders });
        } catch (error) {
          log.error({ error }, "Search analysis failed");
          return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500, headers: corsHeaders },
          );
        }
      }

      // Result re-ranking endpoint
      if (url.pathname === "/search/rerank" && req.method === "POST") {
        try {
          const body = await req.json();
          const { results, query, intent } = body;

          if (!results || !Array.isArray(results)) {
            return Response.json(
              { error: "Missing or invalid 'results' parameter" },
              { status: 400, headers: corsHeaders },
            );
          }

          const ranked = await handleResultReranking(results, query, intent);
          return Response.json(ranked, { headers: corsHeaders });
        } catch (error) {
          log.error({ error }, "Result re-ranking failed");
          return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500, headers: corsHeaders },
          );
        }
      }

      // Context extraction endpoint
      if (url.pathname === "/search/context" && req.method === "POST") {
        try {
          const body = await req.json();
          const { result, query } = body;

          if (!result || !query) {
            return Response.json(
              { error: "Missing 'result' or 'query' parameter" },
              { status: 400, headers: corsHeaders },
            );
          }

          const context = await handleContextExtraction(result, query);
          return Response.json(context, { headers: corsHeaders });
        } catch (error) {
          log.error({ error }, "Context extraction failed");
          return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500, headers: corsHeaders },
          );
        }
      }

      // 404 for unknown endpoints
      return Response.json(
        { error: "Not found" },
        { status: 404, headers: corsHeaders },
      );
    },
  });

  log.info(`✅ HTTP server listening on port ${port}`);
  log.info("⏳ Daemon ready to handle requests");
}

// Run service lifecycle dispatcher
await lifecycle.run(command, main);
