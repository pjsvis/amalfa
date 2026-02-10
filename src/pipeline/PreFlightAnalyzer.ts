/**
 * PreFlightAnalyzer
 *
 * Validates source directories before ingestion to detect issues:
 * - Large files that need splitting
 * - Symlinks and circular references
 * - Empty or invalid files
 * - Estimated resource usage
 *
 * Generates .amalfa/logs/pre-flight.log with recommendations.
 */

import {
  existsSync,
  lstatSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { AmalfaConfig } from "@src/config/defaults";
import { initAmalfaDirs } from "@src/config/defaults";
import { getLogger } from "@src/utils/Logger";

const log = getLogger("PreFlightAnalyzer");

// Validation thresholds
const MAX_FILE_SIZE_MB = 10;
const MIN_FILE_SIZE_BYTES = 50;
const MAX_SYMLINK_DEPTH = 3;
const WARN_TOTAL_FILES = 1000;
const WARN_TOTAL_SIZE_MB = 100;

export interface FileIssue {
  path: string;
  issue:
    | "too_large"
    | "too_small"
    | "symlink"
    | "circular_ref"
    | "empty"
    | "non_markdown";
  severity: "error" | "warning" | "info";
  details: string;
  recommendation?: string;
}

export interface PreFlightReport {
  totalFiles: number;
  validFiles: number;
  skippedFiles: number;
  totalSizeBytes: number;
  estimatedNodes: number;
  issues: FileIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
  timestamp: string;
}

export class PreFlightAnalyzer {
  private config: AmalfaConfig;
  private visitedPaths = new Set<string>();
  private issues: FileIssue[] = [];

  constructor(config: AmalfaConfig) {
    this.config = config;
    // Ensure .amalfa directories exist
    initAmalfaDirs();
  }

  /**
   * Run pre-flight analysis on all source directories
   */
  async analyze(): Promise<PreFlightReport> {
    log.info("🔍 Running pre-flight analysis...");

    const sources = this.config.sources || ["./docs"];
    const allFiles: string[] = [];
    let totalSize = 0;

    // Scan all sources
    for (const source of sources) {
      const sourcePath = join(process.cwd(), source);

      if (!existsSync(sourcePath)) {
        this.issues.push({
          path: source,
          issue: "non_markdown",
          severity: "warning",
          details: `Source directory not found: ${sourcePath}`,
          recommendation: `Create the directory: mkdir -p ${source}`,
        });
        continue;
      }

      const files = this.scanDirectory(sourcePath, sourcePath);
      allFiles.push(...files);
    }

    // Validate each file
    const validFiles: string[] = [];
    for (const file of allFiles) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
        totalSize += validation.size;
      }
    }

    // Generate report
    const report: PreFlightReport = {
      totalFiles: allFiles.length,
      validFiles: validFiles.length,
      skippedFiles: allFiles.length - validFiles.length,
      totalSizeBytes: totalSize,
      estimatedNodes: validFiles.length, // Rough estimate: 1 file = 1 node
      issues: this.issues,
      hasErrors: this.issues.some((i) => i.severity === "error"),
      hasWarnings: this.issues.some((i) => i.severity === "warning"),
      timestamp: new Date().toISOString(),
    };

    // Check overall health
    this.checkOverallHealth(report);

    // Write report to file
    this.writeReport(report);

    return report;
  }

  /**
   * Recursively scan directory for markdown files
   */
  private scanDirectory(dir: string, rootPath: string): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip hidden files and directories
        if (entry.name.startsWith(".")) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recurse into subdirectories
          files.push(...this.scanDirectory(fullPath, rootPath));
        } else if (entry.name.endsWith(".md")) {
          files.push(fullPath);
        }
      }
    } catch (err) {
      log.error({ dir, err }, "Failed to scan directory");
    }

    return files;
  }

  /**
   * Validate a single file
   */
  private validateFile(filePath: string): { valid: boolean; size: number } {
    let size = 0;

    try {
      // Check if symlink
      const lstat = lstatSync(filePath);
      if (lstat.isSymbolicLink()) {
        try {
          const realPath = realpathSync(filePath);
          const depth = this.getSymlinkDepth(filePath, realPath);

          if (depth > MAX_SYMLINK_DEPTH) {
            this.issues.push({
              path: filePath,
              issue: "symlink",
              severity: "warning",
              details: `Symlink depth ${depth} exceeds maximum ${MAX_SYMLINK_DEPTH}`,
              recommendation: "Copy the actual files instead of using symlinks",
            });
            return { valid: false, size: 0 };
          }

          // Check for circular reference
          if (this.visitedPaths.has(realPath)) {
            this.issues.push({
              path: filePath,
              issue: "circular_ref",
              severity: "error",
              details: "Circular symlink reference detected",
              recommendation:
                "Remove circular symlink to prevent infinite loops",
            });
            return { valid: false, size: 0 };
          }

          this.visitedPaths.add(realPath);
        } catch (_err) {
          this.issues.push({
            path: filePath,
            issue: "circular_ref",
            severity: "error",
            details: "Failed to resolve symlink (possible circular reference)",
            recommendation: "Remove problematic symlink",
          });
          return { valid: false, size: 0 };
        }
      }

      // Check file size
      const stats = statSync(filePath);
      size = stats.size;

      // Empty or very small files
      if (size === 0) {
        this.issues.push({
          path: filePath,
          issue: "empty",
          severity: "info",
          details: "Empty file (0 bytes)",
          recommendation: "Add content or remove file",
        });
        return { valid: false, size: 0 };
      }

      if (size < MIN_FILE_SIZE_BYTES) {
        this.issues.push({
          path: filePath,
          issue: "too_small",
          severity: "warning",
          details: `Very small file (${size} bytes) - may have minimal content`,
        });
        // Still valid, just warning
      }

      // Large files
      const sizeMB = size / 1024 / 1024;
      if (sizeMB > MAX_FILE_SIZE_MB) {
        this.issues.push({
          path: filePath,
          issue: "too_large",
          severity: "error",
          details: `File too large (${sizeMB.toFixed(1)}MB > ${MAX_FILE_SIZE_MB}MB)`,
          recommendation: [
            `Split into smaller files (< ${MAX_FILE_SIZE_MB}MB each)`,
            "Or wait for AMALFA v1.1 which will auto-split large files",
          ].join("\n"),
        });
        return { valid: false, size: 0 };
      }

      return { valid: true, size };
    } catch (err) {
      log.error({ file: filePath, err }, "File validation error");
      this.issues.push({
        path: filePath,
        issue: "non_markdown",
        severity: "error",
        details: `Failed to read file: ${err}`,
      });
      return { valid: false, size: 0 };
    }
  }

  /**
   * Calculate symlink depth
   */
  private getSymlinkDepth(symlinkPath: string, realPath: string): number {
    const symParts = symlinkPath.split("/");
    const realParts = realPath.split("/");

    // Find common ancestor
    let commonDepth = 0;
    for (let i = 0; i < Math.min(symParts.length, realParts.length); i++) {
      if (symParts[i] === realParts[i]) {
        commonDepth++;
      } else {
        break;
      }
    }

    // Depth is how many levels up/down from common ancestor
    const symDepth = symParts.length - commonDepth;
    const realDepth = realParts.length - commonDepth;

    return Math.max(symDepth, realDepth);
  }

  /**
   * Check overall health of the corpus
   */
  private checkOverallHealth(report: PreFlightReport) {
    // Warn about very large corpora
    if (report.totalFiles > WARN_TOTAL_FILES) {
      this.issues.push({
        path: "(global)",
        issue: "too_large",
        severity: "warning",
        details: `Large corpus: ${report.totalFiles} files`,
        recommendation: [
          "Consider splitting into multiple AMALFA instances",
          "Or use more specific source directories",
          `Initial ingestion may take ${Math.ceil(report.totalFiles / 13)}+ seconds`,
        ].join("\n"),
      });
    }

    const totalSizeMB = report.totalSizeBytes / 1024 / 1024;
    if (totalSizeMB > WARN_TOTAL_SIZE_MB) {
      this.issues.push({
        path: "(global)",
        issue: "too_large",
        severity: "warning",
        details: `Large total size: ${totalSizeMB.toFixed(1)}MB`,
        recommendation: "Consider splitting corpus or removing large files",
      });
    }

    // No valid files
    if (report.validFiles === 0) {
      this.issues.push({
        path: "(global)",
        issue: "empty",
        severity: "error",
        details: "No valid markdown files found in source directories",
        recommendation: [
          "Check that source directories contain .md files",
          "Verify paths in amalfa.config file",
        ].join("\n"),
      });
    }
  }

  /**
   * Write pre-flight report to file
   */
  private writeReport(report: PreFlightReport) {
    const logPath = join(process.cwd(), ".amalfa-pre-flight.log");

    const lines: string[] = [
      "===============================================",
      "AMALFA Pre-Flight Analysis Report",
      "===============================================",
      "",
      `Timestamp: ${report.timestamp}`,
      `Total files discovered: ${report.totalFiles}`,
      `Valid files: ${report.validFiles}`,
      `Skipped files: ${report.skippedFiles}`,
      `Total size: ${(report.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`,
      `Estimated nodes: ${report.estimatedNodes}`,
      "",
      "Status:",
      `  Errors: ${report.issues.filter((i) => i.severity === "error").length}`,
      `  Warnings: ${report.issues.filter((i) => i.severity === "warning").length}`,
      `  Info: ${report.issues.filter((i) => i.severity === "info").length}`,
      "",
    ];

    if (report.hasErrors) {
      lines.push("❌ ERRORS DETECTED - Ingestion will be blocked");
      lines.push("");
    } else if (report.hasWarnings) {
      lines.push("⚠️  WARNINGS DETECTED - Review recommendations below");
      lines.push("");
    } else {
      lines.push("✅ All checks passed");
      lines.push("");
    }

    // Group issues by severity
    const errors = report.issues.filter((i) => i.severity === "error");
    const warnings = report.issues.filter((i) => i.severity === "warning");
    const info = report.issues.filter((i) => i.severity === "info");

    if (errors.length > 0) {
      lines.push("===============================================");
      lines.push("ERRORS (Must Fix)");
      lines.push("===============================================");
      for (const issue of errors) {
        lines.push("");
        lines.push(`File: ${issue.path}`);
        lines.push(`Issue: ${issue.issue}`);
        lines.push(`Details: ${issue.details}`);
        if (issue.recommendation) {
          lines.push(`Fix: ${issue.recommendation}`);
        }
      }
      lines.push("");
    }

    if (warnings.length > 0) {
      lines.push("===============================================");
      lines.push("WARNINGS (Recommended to Fix)");
      lines.push("===============================================");
      for (const issue of warnings) {
        lines.push("");
        lines.push(`File: ${issue.path}`);
        lines.push(`Issue: ${issue.issue}`);
        lines.push(`Details: ${issue.details}`);
        if (issue.recommendation) {
          lines.push(`Fix: ${issue.recommendation}`);
        }
      }
      lines.push("");
    }

    if (info.length > 0) {
      lines.push("===============================================");
      lines.push("INFO (Optional to Address)");
      lines.push("===============================================");
      for (const issue of info) {
        lines.push("");
        lines.push(`File: ${issue.path}`);
        lines.push(`Details: ${issue.details}`);
      }
      lines.push("");
    }

    lines.push("===============================================");
    lines.push("About File Size Limits");
    lines.push("===============================================");
    lines.push("");
    lines.push(`Current limit: ${MAX_FILE_SIZE_MB}MB per file`);
    lines.push("");
    lines.push("Why this limit exists:");
    lines.push("- Prevents excessive memory usage during embedding generation");
    lines.push(
      "- Ensures good search quality (large files = poor granularity)",
    );
    lines.push("- Maintains reasonable graph structure");
    lines.push("");
    lines.push("How to handle large files:");
    lines.push("1. Split into smaller logical sections (recommended)");
    lines.push("2. Use --force flag to override warnings (not errors)");
    lines.push("3. Wait for AMALFA v1.1 with automatic file splitting");
    lines.push("");
    lines.push("===============================================");
    lines.push("End of Report");
    lines.push("===============================================");

    try {
      writeFileSync(logPath, lines.join("\n"), "utf8");
      log.info({ path: logPath }, "Pre-flight report written");
    } catch (err) {
      log.error({ err }, "Failed to write pre-flight report");
    }
  }
}
