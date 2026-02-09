#!/usr/bin/env -S bun run

/**
 * LangExtract Provider Health Check
 *
 * Simple health check to verify API connectivity for working providers
 * using the exact same pipeline as the test suite (temp files for JSON payloads).
 *
 * Note: Gemini direct API is excluded due to free tier quota limits (20 requests/day).
 * Use OpenRouter for Gemini models instead.
 */

import { mkdtempSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { $ } from "bun";

interface HealthResult {
  provider: string;
  model: string;
  status: "success" | "failed" | "skipped";
  latencyMs: number;
  error?: string;
  responsePreview?: string;
}

/**
 * Create temp file and write content
 */
function writeTempFile(content: string): string {
  const tempDir = mkdtempSync(tmpdir());
  const tempFile = resolve(tempDir, "payload.json");
  writeFileSync(tempFile, content, "utf-8");
  return tempFile;
}

async function checkGeminiDirect(): Promise<HealthResult> {
  const start = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      provider: "gemini",
      model: "list-models",
      status: "skipped",
      latencyMs: 0,
      responsePreview: "GEMINI_API_KEY not set (Skipped)",
    };
  }

  try {
    // Use listModels to verify key without consuming generation quota
    const response =
      await $`curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}"`;

    const latency = Date.now() - start;
    const stdout = response.stdout.toString();

    if (response.exitCode !== 0) {
      return {
        provider: "gemini",
        model: "list-models",
        status: "failed",
        latencyMs: latency,
        error: `Exit code ${response.exitCode}: ${response.stderr.toString()}`,
      };
    }

    const result = JSON.parse(stdout);
    if (result.error) {
      return {
        provider: "gemini",
        model: "list-models",
        status: "failed",
        latencyMs: latency,
        error: `API Error: ${result.error.message}`,
      };
    }

    return {
      provider: "gemini",
      model: "list-models",
      status: "success",
      latencyMs: latency,
      responsePreview: `Models available: ${result.models?.length || 0}`,
    };
  } catch (error) {
    return {
      provider: "gemini",
      model: "list-models",
      status: "failed",
      latencyMs: Date.now() - start,
      error: String(error),
    };
  }
}

async function checkOpenRouter(): Promise<HealthResult> {
  const start = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return {
      provider: "openrouter",
      model: "google/gemini-2.5-flash-lite",
      status: "skipped",
      latencyMs: 0,
      responsePreview: "OPENROUTER_API_KEY not set (Skipped)",
    };
  }

  try {
    const payload = JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "user",
          content: "Hello",
        },
      ],
    });

    const tempFile = writeTempFile(payload);

    let response: any;
    try {
      response =
        await $`curl -s "https://openrouter.ai/api/v1/chat/completions" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer ${apiKey}" -H "HTTP-Referer: https://github.com/pjsvis/amalfa" -H "X-Title: AMALFA Health Check" -d @${tempFile}`;
    } finally {
      unlinkSync(tempFile);
    }

    const latency = Date.now() - start;
    const stdout = response.stdout.toString();

    if (response.exitCode !== 0) {
      return {
        provider: "openrouter",
        model: "qwen/qwen-2.5-72b-instruct",
        status: "failed",
        latencyMs: latency,
        error: `Exit code ${response.exitCode}: ${response.stderr.toString()}`,
      };
    }

    const result = JSON.parse(stdout);
    if (result.error) {
      return {
        provider: "openrouter",
        model: "google/gemini-2.5-flash-lite",
        status: "failed",
        latencyMs: latency,
        error: `API Error: ${result.error.message}`,
      };
    }

    return {
      provider: "openrouter",
      model: "google/gemini-2.5-flash-lite",
      status: "success",
      latencyMs: latency,
      responsePreview: stdout.substring(0, 200),
    };
  } catch (error) {
    return {
      provider: "openrouter",
      model: "qwen/qwen-2.5-72b-instruct",
      status: "failed",
      latencyMs: Date.now() - start,
      error: String(error),
    };
  }
}

async function checkOllama(): Promise<HealthResult> {
  const start = Date.now();

  try {
    const payload = JSON.stringify({
      model: "nemotron-3-nano:30b-cloud",
      messages: [
        {
          role: "user",
          content: "Hello",
        },
      ],
      stream: false,
    });

    const tempFile = writeTempFile(payload);

    let response: any;
    try {
      response =
        await $`curl -s http://localhost:11434/api/chat -X POST -H "Content-Type: application/json" -d @${tempFile}`;
    } finally {
      unlinkSync(tempFile);
    }

    const latency = Date.now() - start;
    const stdout = response.stdout.toString();

    if (response.exitCode !== 0) {
      return {
        provider: "ollama",
        model: "nemotron-3-nano:30b-cloud",
        status: "failed",
        latencyMs: latency,
        error: `Exit code ${response.exitCode}: ${response.stderr.toString()}`,
      };
    }

    const result = JSON.parse(stdout);
    if (result.error) {
      return {
        provider: "ollama",
        model: "nemotron-3-nano:30b-cloud",
        status: "failed",
        latencyMs: latency,
        error: `API Error: ${result.error}`,
      };
    }

    return {
      provider: "ollama",
      model: "nemotron-3-nano:30b-cloud",
      status: "success",
      latencyMs: latency,
      responsePreview: stdout.substring(0, 200),
    };
  } catch (error) {
    return {
      provider: "ollama",
      model: "nemotron-3-nano:30b-cloud",
      status: "failed",
      latencyMs: Date.now() - start,
      error: String(error),
    };
  }
}

function printResults(results: HealthResult[]) {
  console.log(`\n${"=".repeat(80)}`);
  console.log("🏥 LangExtract Provider Health Check");
  console.log("=".repeat(80));

  let healthyCount = 0;
  let failedCount = 0;

  for (const result of results) {
    let status = "❌";
    if (result.status === "success") status = "✅";
    else if (result.status === "skipped") status = "⏭️";

    const latency = `${result.latencyMs}ms`;
    const model = `${result.provider}/${result.model}`;

    console.log(`\n${status} ${model}`);
    console.log(`   Latency: ${latency}`);
    console.log(`   Status: ${result.status.toUpperCase()}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
      failedCount++;
    } else {
      console.log(`   Response: ${result.responsePreview}...`);
      if (result.status === "success") healthyCount++;
    }
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log(`Summary: ${healthyCount} healthy, ${failedCount} failed`);
  console.log(`${"=".repeat(80)}\n`);

  if (failedCount > 0) {
    console.log(
      "⚠️  Some providers are not healthy. Check API keys and network connectivity.",
    );
    process.exit(1);
  } else {
    console.log("✅ All providers are healthy. Ready to run full tests.");
    process.exit(0);
  }
}

async function main() {
  console.log("🏥 Running LangExtract provider health checks...\n");
  console.log(
    "Note: Gemini direct API check added (using listModels to avoid quota usage)\n",
  );

  const results: HealthResult[] = [];

  console.log("Checking Gemini Direct API...");
  results.push(await checkGeminiDirect());

  console.log("Checking OpenRouter API (google/gemini-2.5-flash-lite)...");
  results.push(await checkOpenRouter());

  console.log("Checking Ollama API...");
  results.push(await checkOllama());

  printResults(results);
}

main().catch(console.error);
