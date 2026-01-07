#!/usr/bin/env bun
/**
 * Remove Node.js Compatibility Dependencies
 *
 * Replaces all node: imports with Bun-native equivalents.
 * This eliminates the Node.js compatibility layer since amalfa is Bun-required.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join, relative } from "path";
import { exit } from "node:process";

interface Replacement {
  from: string;
  to: string;
  description: string;
}

const REPLACEMENTS: Replacement[] = [
  {
    from: 'from "node:path"',
    to: 'from "path"',
    description: "Path operations",
  },
  {
    from: 'from "node:fs"',
    to: 'from "fs"',
    description: "File system operations",
  },
  {
    from: 'from "node:fs/promises"',
    to: 'from "fs/promises"',
    description: "Async file system operations",
  },
  {
    from: 'from "node:crypto"',
    to: 'from "crypto"',
    description: "Cryptography",
  },
  {
    from: 'from "node:child_process"',
    to: 'from "child_process"',
    description: "Child processes",
  },
  {
    from: 'from "node:os"',
    to: 'from "os"',
    description: "Operating system utilities",
  },
  {
    from: 'from "node:util"',
    to: 'from "util"',
    description: "Utilities",
  },
];

interface Options {
  dryRun?: boolean;
  backup?: boolean;
  verbose?: boolean;
}

function printUsage() {
  console.log(`
Usage: bun run remove-node-deps.ts [options]

Options:
  --dry-run, -d    Show changes without applying them
  --backup, -b      Create .bak backup files before modifying
  --verbose, -v     Show detailed output
  --help, -h        Show this help message

Examples:
  bun run remove-node-deps.ts              # Apply all replacements
  bun run remove-node-deps.ts --dry-run    # Preview changes
  bun run remove-node-deps.ts --backup    # Backup files first
  `);
  exit(0);
}

function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);

      if (
        entry.isDirectory() &&
        entry.name !== "node_modules" &&
        entry.name !== ".git"
      ) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

function applyReplacements(
  content: string,
  replacements: Replacement[],
): {
  content: string;
  changes: { file: string; replacement: Replacement }[];
} {
  let newContent = content;
  const changes: { file: string; replacement: Replacement }[] = [];

  for (const replacement of replacements) {
    if (newContent.includes(replacement.from)) {
      newContent = newContent.replaceAll(replacement.from, replacement.to);
      changes.push({ file: "", replacement });
    }
  }

  return { content: newContent, changes };
}

function processFile(
  filePath: string,
  options: Options,
): {
  modified: boolean;
  changes: { replacement: Replacement; count: number }[];
} {
  const relativePath = relative(process.cwd(), filePath);
  const originalContent = readFileSync(filePath, "utf-8");

  const { content: newContent, changes } = applyReplacements(
    originalContent,
    REPLACEMENTS,
  );

  if (changes.length === 0) {
    return { modified: false, changes: [] };
  }

  // Count occurrences per replacement type
  const changeCounts = REPLACEMENTS.map((rep) => ({
    replacement: rep,
    count: (
      originalContent.match(
        new RegExp(rep.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ) || []
    ).length,
  })).filter((c) => c.count > 0);

  if (options.dryRun) {
    if (options.verbose) {
      console.log(`\n📄 ${relativePath}`);
      console.log(
        `   Changes: ${changeCounts.map((c) => `${c.replacement.to} (${c.count})`).join(", ")}`,
      );
    }
    return { modified: true, changes: changeCounts };
  }

  // Create backup if requested
  if (options.backup) {
    const backupPath = `${filePath}.bak`;
    writeFileSync(backupPath, originalContent, "utf-8");
    if (options.verbose) {
      console.log(`   💾 Backup: ${relativePath}.bak`);
    }
  }

  // Write modified content
  writeFileSync(filePath, newContent, "utf-8");

  if (options.verbose) {
    console.log(`\n✏️  ${relativePath}`);
    console.log(
      `   Changes: ${changeCounts.map((c) => `${c.replacement.to} (${c.count})`).join(", ")}`,
    );
  } else {
    console.log(`✏️  ${relativePath}`);
  }

  return { modified: true, changes: changeCounts };
}

async function main() {
  const args = process.argv.slice(2);
  const options: Options = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--backup":
      case "-b":
        options.backup = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        printUsage();
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        console.error("Use --help for usage information");
        exit(1);
    }
  }

  console.log("🔍 Scanning for TypeScript files in src/...\n");

  const srcDir = join(process.cwd(), "src");
  if (!existsSync(srcDir)) {
    console.error("❌ src/ directory not found");
    exit(1);
  }

  const files = findTypeScriptFiles(srcDir);
  console.log(`📁 Found ${files.length} TypeScript files\n`);

  if (files.length === 0) {
    console.log("✅ No files to process");
    return;
  }

  let totalModified = 0;
  let totalChanges: { replacement: Replacement; count: number }[] = [];

  for (const file of files) {
    const result = processFile(file, options);
    if (result.modified) {
      totalModified++;
      totalChanges.push(...result.changes);
    }
  }

  // Aggregate changes by replacement type
  const aggregated = REPLACEMENTS.map((rep) => ({
    replacement: rep,
    count: totalChanges
      .filter((c) => c.replacement.from === rep.from)
      .reduce((sum, c) => sum + c.count, 0),
  })).filter((c) => c.count > 0);

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");
  console.log("=".repeat(50));
  console.log(`Files modified: ${totalModified}/${files.length}`);
  console.log(
    `Total replacements: ${aggregated.reduce((sum, c) => sum + c.count, 0)}`,
  );
  console.log("\nReplacements by type:");

  for (const { replacement, count } of aggregated) {
    console.log(
      `  ${replacement.to.padEnd(20)} : ${count.toString().padStart(4)} (from ${replacement.from})`,
    );
  }

  if (options.dryRun) {
    console.log("\n⚠️  DRY RUN - No files were modified");
    console.log("   Run without --dry-run to apply changes");
  } else if (options.backup) {
    console.log("\n💾 Backup files created (.bak extension)");
    console.log(
      '   Remove backups after verification: find src -name "*.bak" -delete',
    );
  } else {
    console.log("\n✅ All changes applied");
    console.log("   Run tests to verify: bun test");
  }

  console.log("\n" + "=".repeat(50));
}

// Run main function
main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
