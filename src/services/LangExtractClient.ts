import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadConfig, loadSettings, SubstrateError } from "@src/config/defaults";
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

  constructor() {
    this.sidecarPath = resolve(process.cwd(), "src/sidecars/lang-extract");
    this.settings = loadSettings();
  }
  /**
   * Checks if the Sidecar environment is ready (uv installed, venv exists)
   */
  public async isAvailable(): Promise<boolean> {
    // 1. Check if uv is in PATH
    const uvCheck = Bun.spawnSync(["which", "uv"]);
    if (uvCheck.exitCode !== 0) return false;

    // 2. Check if the sidecar directory exists
    if (!existsSync(this.sidecarPath)) return false;

    // 3. Check if server.py exists
    if (!existsSync(join(this.sidecarPath, "server.py"))) return false;

    // Note: We assume "uv run" handles the venv creation if missing,
    // but ideally we'd check for a lockfile or .venv too.
    return true;
  }

  /**
   * Get the provider to use based on settings
   * Simple, predictable selection: settings > env > default
   */
  private getProvider(): string {
    // 1. Environment variable takes highest priority
    if (process.env.LANGEXTRACT_PROVIDER) {
      this.log.info(`Using env provider: ${process.env.LANGEXTRACT_PROVIDER}`);
      return process.env.LANGEXTRACT_PROVIDER;
    }

    // 2. Settings file
    if (this.settings.langExtract?.provider) {
      this.log.info(
        `Using settings provider: ${this.settings.langExtract.provider}`,
      );
      return this.settings.langExtract.provider;
    }

    // 3. Default fallback
    this.log.info("Using default provider: gemini");
    return "gemini";
  }

  /**
   * Check if a provider has required configuration
   */
  private checkProviderConfig(provider: string): {
    valid: boolean;
    error?: string;
    suggestion?: string;
  } {
    const envKey = `${provider.toUpperCase()}_API_KEY`;

    // Check API key for cloud providers
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

    if (
      provider === "ollama_cloud" &&
      !this.settings.langExtract?.ollama_cloud?.host
    ) {
      return {
        valid: false,
        error: `${SubstrateError.NETWORK_ERROR}: OLLAMA_CLOUD_HOST not configured`,
        suggestion: "Set ollama_cloud.host in amalfa.settings.json",
      };
    }

    return { valid: true };
  }

  /**
   * Parse substrate error response and convert to SubstrateError
   */
  private parseSubstrateError(responseText: string): {
    error: SubstrateError;
    message: string;
    suggestion?: string;
  } {
    try {
      const parsed = JSON.parse(responseText);

      if (parsed.error) {
        const errorStr = parsed.error.toLowerCase();

        // Check for specific error patterns
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

        // Generic error
        return {
          error: SubstrateError.UNKNOWN,
          message: parsed.error,
          suggestion: "Check provider documentation for troubleshooting",
        };
      }
    } catch {
      // Not JSON, check for error patterns in text
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

      if (
        text.includes("api key") &&
        (text.includes("invalid") || text.includes("rejected"))
      ) {
        return {
          error: SubstrateError.INVALID_API_KEY,
          message: responseText,
          suggestion: "Verify API key is correct and active",
        };
      }

      if (
        text.includes("credit") ||
        text.includes("quota") ||
        text.includes("limit")
      ) {
        return {
          error: SubstrateError.OUT_OF_CREDIT,
          message: responseText,
          suggestion: "Check billing or switch to another provider",
        };
      }
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

    // Get provider-specific settings
    const providerSettings = this.settings.langExtract?.[provider] || {};

    this.transport = new StdioClientTransport({
      command: "uv",
      args: ["run", "server.py"],
      cwd: this.sidecarPath,
      env: {
        ...process.env,
        LANGEXTRACT_PROVIDER: provider,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
        GEMINI_MODEL: providerSettings.model || "gemini-flash-latest",
        OLLAMA_HOST: "http://localhost:11434",
        OLLAMA_MODEL: providerSettings.model || "qwen2.5:1.5b",
        OLLAMA_CLOUD_HOST: this.settings.langExtract?.ollama_cloud?.host || "",
        OLLAMA_CLOUD_API_KEY: process.env.OLLAMA_CLOUD_API_KEY || "",
        OLLAMA_CLOUD_MODEL: providerSettings.model || "qwen2.5:7b",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
        OPENROUTER_MODEL:
          providerSettings.model || "qwen/qwen-2.5-72b-instruct",
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

    try {
      const result = (await this.client?.callTool({
        name: "extract_graph",

        arguments: { text },
        // biome-ignore lint/suspicious/noExplicitAny: mcp sdk typing issue
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
      return GraphDataSchema.parse(rawJson);
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
