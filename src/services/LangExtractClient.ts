import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadSettings, SubstrateError } from "@src/config/defaults";
import { HarvesterCache } from "@src/core/HarvesterCache";
import { getLogger } from "@src/utils/Logger";
import { z } from "zod";

// Zod Schemas for Structural Validation
const EntitySchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

const RelationshipSchema = z.object({
  source: z.string(),
  target: z.string(),
  type: z.string(),
  description: z.string().optional(),
});

const GraphDataSchema = z.object({
  entities: z.array(EntitySchema),
  relationships: z.array(RelationshipSchema),
});

export type ExtractedGraph = z.infer<typeof GraphDataSchema>;

export class LangExtractClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private sidecarPath: string;
  private log = getLogger("LangExtractClient");
  private settings: ReturnType<typeof loadSettings>;
  private cache: HarvesterCache;

  constructor() {
    this.sidecarPath = resolve(process.cwd(), "src/sidecars/lang-extract");
    this.settings = loadSettings();
    this.cache = new HarvesterCache();
  }

  public checkCache(text: string): boolean {
    return this.cache.has(this.cache.hash(text));
  }

  public async isAvailable(): Promise<boolean> {
    const uvCheck = Bun.spawnSync(["which", "uv"]);
    if (uvCheck.exitCode !== 0) return false;

    if (!existsSync(this.sidecarPath)) return false;
    if (!existsSync(join(this.sidecarPath, "server.py"))) return false;

    return true;
  }

  /**
   * Get the provider to use based on config
   */
  private getProvider(): string {
    // 1. Environment variable takes highest priority
    if (process.env.LANGEXTRACT_PROVIDER) {
      this.log.info(`Using env provider: ${process.env.LANGEXTRACT_PROVIDER}`);
      return process.env.LANGEXTRACT_PROVIDER;
    }

    // 2. Settings file (SSOT)
    if (this.settings.langExtract?.provider) {
      this.log.info(
        `Using settings provider: ${this.settings.langExtract.provider}`,
      );
      return this.settings.langExtract.provider;
    }

    // 3. Default fallback
    this.log.info("Using default provider: openrouter");
    return "openrouter";
  }

  private checkProviderConfig(provider: string): {
    valid: boolean;
    error?: string;
    suggestion?: string;
  } {
    if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
      return {
        valid: false,
        error: `${SubstrateError.MISSING_API_KEY}: GEMINI_API_KEY not configured`,
        suggestion: "Set GEMINI_API_KEY in .env file",
      };
    }

    if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
      return {
        valid: false,
        error: `${SubstrateError.MISSING_API_KEY}: OPENROUTER_API_KEY not configured`,
        suggestion: "Set OPENROUTER_API_KEY in .env file",
      };
    }

    return { valid: true };
  }

  private parseSubstrateError(responseText: string): {
    error: SubstrateError;
    message: string;
    suggestion?: string;
  } {
    try {
      const parsed = JSON.parse(responseText);
      if (parsed.error) {
        const errorStr = parsed.error.toLowerCase();
        if (
          errorStr.includes("api key") &&
          (errorStr.includes("not set") || errorStr.includes("not configured"))
        ) {
          return {
            error: SubstrateError.MISSING_API_KEY,
            message: parsed.error,
            suggestion: "Check API key in .env file",
          };
        }
        if (
          errorStr.includes("api key") &&
          (errorStr.includes("invalid") || errorStr.includes("rejected"))
        ) {
          return {
            error: SubstrateError.INVALID_API_KEY,
            message: parsed.error,
            suggestion: "Verify API key is correct and active",
          };
        }
        if (
          errorStr.includes("credit") ||
          errorStr.includes("quota") ||
          errorStr.includes("limit")
        ) {
          return {
            error: SubstrateError.OUT_OF_CREDIT,
            message: parsed.error,
            suggestion: "Check billing or switch to another provider",
          };
        }
        if (
          errorStr.includes("network") ||
          errorStr.includes("connection") ||
          errorStr.includes("timeout")
        ) {
          return {
            error: SubstrateError.NETWORK_ERROR,
            message: parsed.error,
            suggestion: "Check network connection and provider status",
          };
        }
        return {
          error: SubstrateError.UNKNOWN,
          message: parsed.error,
          suggestion: "Check provider documentation for troubleshooting",
        };
      }
    } catch {
      const text = responseText.toLowerCase();
      if (
        text.includes("api key") &&
        (text.includes("not set") || text.includes("not configured"))
      ) {
        return {
          error: SubstrateError.MISSING_API_KEY,
          message: responseText,
          suggestion: "Check API key in .env file",
        };
      }
      return {
        error: SubstrateError.UNKNOWN,
        message: responseText,
        suggestion: "Check provider documentation for troubleshooting",
      };
    }
    return {
      error: SubstrateError.UNKNOWN,
      message: responseText,
      suggestion: "Check provider documentation for troubleshooting",
    };
  }

  public async connect() {
    if (this.client) return;

    // Get provider from settings
    const provider = this.getProvider();

    // Check provider configuration
    const configCheck = this.checkProviderConfig(provider);
    if (!configCheck.valid) {
      throw new Error(configCheck.error);
    }

    // Get provider-specific settings from settings
    const providerSettings =
      this.settings.langExtract?.[
        provider as keyof typeof this.settings.langExtract
      ] || {};
    const modelToUse =
      (providerSettings as any).model ||
      (provider === "openrouter"
        ? "qwen/qwen-2.5-72b-instruct"
        : provider === "gemini"
          ? "gemini-flash-latest"
          : "qwen2.5:1.5b");

    this.log.info(
      {
        provider,
        model: modelToUse,
        configSource: (providerSettings as any).model ? "settings" : "default",
      },
      "Initializing LangExtract sidecar",
    );

    this.transport = new StdioClientTransport({
      command: "uv",
      args: ["run", "server.py"],
      cwd: this.sidecarPath,
      env: {
        ...process.env,
        LANGEXTRACT_PROVIDER: provider,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
        GEMINI_MODEL:
          provider === "gemini" ? modelToUse : "gemini-flash-latest",
        OLLAMA_HOST: "http://localhost:11434",
        OLLAMA_MODEL: provider === "ollama" ? modelToUse : "qwen2.5:1.5b",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
        OPENROUTER_MODEL:
          provider === "openrouter" ? modelToUse : "qwen/qwen-2.5-72b-instruct",
      },
    });

    this.client = new Client(
      { name: "amalfa-host", version: "1.0.0" },
      { capabilities: {} },
    );

    await this.client.connect(this.transport);
  }

  public async extract(text: string): Promise<ExtractedGraph | null> {
    if (!this.client) {
      await this.connect();
    }

    // 1. Check Harvester Cache
    const contentHash = this.cache.hash(text);
    const cachedResult = this.cache.get(contentHash);

    if (cachedResult) {
      this.log.debug({ hash: contentHash }, "Harvester Cache Hit");
      return cachedResult;
    }

    this.log.debug(
      { hash: contentHash, textLength: text.length },
      "Harvester Cache Miss - Calling Sidecar",
    );

    const startTime = Date.now();

    try {
      const result = (await this.client?.callTool({
        name: "extract_graph",

        arguments: { text },
      })) as any;

      // Parse the JSON string returned by the Python tool

      // The tool returns a string that IS a JSON object, wrapped in the MCP content
      // usually result.content[0].text
      if (!result?.content || result.content.length === 0) return null;

      const contentBlock = result.content[0];
      if (contentBlock.type !== "text") return null;

      const responseText = contentBlock.text;

      // Check for error response
      if (
        responseText.startsWith("Error") ||
        responseText.includes('"error"')
      ) {
        const errorInfo = this.parseSubstrateError(responseText);
        this.log.error(
          {
            error: errorInfo.error,
            message: errorInfo.message,
            suggestion: errorInfo.suggestion,
          },
          "Substrate error",
        );

        // Throw clear error with suggestion
        throw new Error(
          `${errorInfo.error}: ${errorInfo.message}${errorInfo.suggestion ? `\nSuggestion: ${errorInfo.suggestion}` : ""}`,
        );
      }

      let rawJson: unknown;
      try {
        rawJson = JSON.parse(responseText);
      } catch (_e) {
        // Try to strip markdown code blocks if present
        const cleanText = responseText.replace(/```json\n?|\n?```/g, "").trim();
        try {
          rawJson = JSON.parse(cleanText);
        } catch (_e2) {
          this.log.error({ responseText }, "Failed to parse sidecar JSON");
          return null;
        }
      }

      // Validate with Zod
      const parsed = GraphDataSchema.parse(rawJson);

      const duration = Date.now() - startTime;
      this.log.info(
        {
          duration,
          entities: parsed.entities.length,
          relationships: parsed.relationships.length,
        },
        "Extraction successful",
      );

      // 2. Save to Cache on success
      this.cache.set(contentHash, parsed);

      return parsed;
    } catch (error) {
      this.log.error({ err: error }, "Sidecar extraction failed");
      throw error; // Re-throw to surface clear error messages
    }
  }
  public async close() {
    if (this.transport) {
      // Stdio transport doesn't have a close method exposed efficiently in all versions
      // but closing the client usually triggers it
      await this.transport.close();
    }
    this.client = null;
    this.transport = null;
  }
}
