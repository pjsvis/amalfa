#!/usr/bin/env bun
/**
 * Bundle Analysis Diagnostic Tool
 *
 * Analyzes --metafile output from Bun build for LLM-friendly bundle analysis.
 *
 * Usage:
 *   bun run scripts/lab/bun-1-3-8-markdown-test/analyze-bundle.ts [--input <file>] [--format json|markdown]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

interface BunMetafile {
  inputs: Record<
    string,
    {
      bytes: number;
      imports: Array<{
        path: string;
        kind: string;
        original?: string;
        external?: boolean;
      }>;
    }
  >;
  outputs: Record<
    string,
    {
      bytes: number;
      imports?: string[];
    }
  >;
}

interface AnalysisResult {
  totalInputSize: number;
  totalOutputSize: number;
  fileCount: number;
  largestInputs: Array<{ path: string; size: number }>;
  externalImports: string[];
  byType: Record<string, { count: number; size: number }>;
}

async function analyzeBundle(metafilePath: string): Promise<AnalysisResult> {
  if (!existsSync(metafilePath)) {
    throw new Error(`Metafile not found: ${metafilePath}`);
  }

  const content = readFileSync(metafilePath, "utf-8");
  const data = JSON.parse(content) as BunMetafile;

  const result: AnalysisResult = {
    totalInputSize: 0,
    totalOutputSize: 0,
    fileCount: Object.keys(data.inputs).length,
    largestInputs: [],
    externalImports: [],
    byType: {
      node: { count: 0, size: 0 },
      external: { count: 0, size: 0 },
      local: { count: 0, size: 0 },
    },
  };

  // Analyze inputs
  const inputs = Object.entries(data.inputs);
  result.totalInputSize = inputs.reduce((sum, [, data]) => sum + data.bytes, 0);

  // Find largest inputs
  result.largestInputs = inputs
    .map(([path, data]) => ({ path, size: data.bytes }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Categorize imports
  const seenImports = new Set<string>();
  for (const [path, data] of inputs) {
    const isExternal = data.imports.some((imp) => imp.external);
    const type = isExternal ? "external" : "local";
    result.byType[type].count++;
    result.byType[type].size += data.bytes;

    // Extract package names from external imports
    for (const imp of data.imports) {
      const key = imp.path;
      if (imp.external && !seenImports.has(key)) {
        seenImports.add(key);
        result.externalImports.push(key);
      }
    }
  }

  // Analyze outputs
  const outputs = Object.entries(data.outputs);
  result.totalOutputSize = outputs.reduce(
    (sum, [, data]) => sum + data.bytes,
    0,
  );

  return result;
}

function formatMarkdown(result: AnalysisResult, metafilePath: string): string {
  const date = new Date().toISOString();
  const inputMB = (result.totalInputSize / 1024 / 1024).toFixed(2);
  const outputMB = (result.totalOutputSize / 1024 / 1024).toFixed(2);
  const ratio = (
    (result.totalOutputSize / result.totalInputSize) *
    100
  ).toFixed(1);

  let md = `# Bundle Analysis Report\n`;
  md += `**Date:** ${date}\n`;
  md += `**Source:** ${metafilePath}\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Input Files | ${result.fileCount} |\n`;
  md += `| Total Input | ${inputMB} MB |\n`;
  md += `| Total Output | ${outputMB} MB |\n`;
  md += `| Compression | ${ratio}% |\n`;
  md += `| External Packages | ${result.byType.external.count} |\n\n`;

  md += `## Import Breakdown\n\n`;
  md += `| Type | Files | Size |\n`;
  md += `|------|-------|------|\n`;
  md += `| External | ${result.byType.external.count} | ${(result.byType.external.size / 1024).toFixed(1)} KB |\n`;
  md += `| Local | ${result.byType.local.count} | ${(result.byType.local.size / 1024).toFixed(1)} KB |\n\n`;

  md += `## Largest Inputs\n\n`;
  md += `| Size | Path |\n`;
  md += `|------|------|\n`;
  for (const input of result.largestInputs) {
    const sizeKB = (input.size / 1024).toFixed(1);
    md += `| ${sizeKB} KB | ${input.path} |\n`;
  }

  md += `\n## External Dependencies\n\n`;
  if (result.externalImports.length > 0) {
    md += result.externalImports.map((imp) => `- \`${imp}\``).join("\n");
  } else {
    md += `No external dependencies found.\n`;
  }

  md += `\n## Recommendations\n\n`;
  if (result.byType.external.count > 20) {
    md += `⚠️ **High external dependency count** - Consider consolidating packages.\n\n`;
  }
  if (result.largestInputs[0]?.size > 500 * 1024) {
    md += `⚠️ **Large bundle entry** - Consider code splitting for large dependencies.\n\n`;
  }
  md += `✅ Bundle analysis complete.\n`;

  return md;
}

function formatJSON(result: AnalysisResult): string {
  return JSON.stringify(result, null, 2);
}

async function main() {
  const args = process.argv.slice(2);
  const metafileArg = args.findIndex((a) => a === "--input" || a === "-i");
  const formatArg = args.findIndex((a) => a === "--format" || a === "-f");

  const metafilePath =
    metafileArg >= 0 && args[metafileArg + 1]
      ? args[metafileArg + 1]
      : join(process.cwd(), "meta.json");

  const format =
    formatArg >= 0 && args[formatArg + 1] ? args[formatArg + 1] : "markdown";

  console.log(`📦 Bundle Analysis`);
  console.log(`   Input: ${metafilePath}`);
  console.log(`   Format: ${format}`);
  console.log("");

  try {
    const result = await analyzeBundle(metafilePath);

    if (format === "json") {
      console.log(formatJSON(result));
    } else {
      const md = formatMarkdown(result, metafilePath);
      console.log(md);

      // Write report
      const reportPath = join(process.cwd(), ".bun-meta/analysis-report.md");
      writeFileSync(reportPath, md);
      console.log(`\n📄 Report saved to: ${reportPath}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
    console.error("\nUsage:");
    console.error(
      "  bun run scripts/lab/bun-1-3-8-markdown-test/analyze-bundle.ts",
    );
    console.error(
      "  bun run scripts/lab/bun-1-3-8-markdown-test/analyze-bundle.ts --input <path>",
    );
    console.error(
      "  bun run scripts/lab/bun-1-3-8-markdown-test/analyze-bundle.ts --format json",
    );
    process.exit(1);
  }
}

main();
