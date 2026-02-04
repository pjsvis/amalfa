// Generate a Markdown reference of global packages installed via Homebrew and Bun
// Usage: bun generate-global-packages.ts

import { writeFile } from "fs/promises";

async function runCommand(cmd: string[]): Promise<{ ok: boolean; stdout: string; stderr: string }>
{
  try {
    const proc = Bun.spawn({ cmd, stdout: "pipe", stderr: "pipe" });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    return { ok: exitCode === 0, stdout: stdout.trim(), stderr: stderr.trim() };
  } catch (err: any) {
    return { ok: false, stdout: "", stderr: String(err) };
  }
}

function parseSimpleList(output: string): string[] {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function parseBunText(output: string): string[] {
  const pkgs: string[] = [];
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Look for name@version patterns in tree output
    const match = trimmed.match(/([@a-zA-Z0-9_./-]+)@([0-9][^\s]*)/);
    if (match) {
      pkgs.push(match[1]);
    }
  }
  // Deduplicate while preserving order
  return Array.from(new Set(pkgs));
}

async function getBunGlobals(): Promise<{ packages: string[]; note?: string }>
{
  const attempts: string[][] = [
    ["bun", "pm", "ls", "-g", "--depth=0", "--json"],
    ["bun", "pm", "ls", "-g", "--depth=0"],
    ["bun", "pm", "ls", "-g"],
  ];

  for (const cmd of attempts) {
    const result = await runCommand(cmd);
    if (!result.ok) continue;

    if (cmd.includes("--json")) {
      try {
        const data = JSON.parse(result.stdout);
        if (data && Array.isArray(data.dependencies)) {
          const names = data.dependencies
            .map((d: any) => d?.name)
            .filter((n: any) => typeof n === "string" && n.length > 0);
          return { packages: Array.from(new Set(names)) };
        }
      } catch {
        // Fall back to text parsing
      }
    }

    const parsed = parseBunText(result.stdout);
    return { packages: parsed };
  }

  return { packages: [], note: "Bun global package list not available or Bun is not installed." };
}

function formatSection(title: string, packages: string[], emptyNote: string): string {
  const header = `## ${title}\n`;
  if (packages.length === 0) {
    return `${header}${emptyNote}\n\n`;
  }
  const list = packages.map((p) => `- ${p}`).join("\n");
  return `${header}${list}\n\n`;
}

async function main() {
  const generatedAt = new Date().toLocaleString();

  const brewFormula = await runCommand(["brew", "list", "--formula"]);
  const brewCask = await runCommand(["brew", "list", "--cask"]);
  const bunGlobals = await getBunGlobals();

  const brewFormulaList = brewFormula.ok ? parseSimpleList(brewFormula.stdout) : [];
  const brewCaskList = brewCask.ok ? parseSimpleList(brewCask.stdout) : [];

  const notes: string[] = [];
  if (!brewFormula.ok || !brewCask.ok) {
    notes.push("Homebrew lists could not be read. Make sure Homebrew is installed and available in your PATH.");
  }
  if (bunGlobals.note) {
    notes.push(bunGlobals.note);
  }

  const doc = `# Global Packages Reference\n\n` +
    `Generated: ${generatedAt}\n\n` +
    `This document lists globally installed packages by installer and shows the update commands.\n\n` +
    `## Update Commands\n\n` +
    `### Homebrew (system tools)\n` +
    `- Update a single package: \`brew upgrade <package>\`\n` +
    `- Update everything: \`brew upgrade\`\n\n` +
    `### Bun (JavaScript tooling)\n` +
    `- Update a single package: \`bun update -g <package>\`\n` +
    `- Update everything: \`bun update -g\`\n\n` +
    formatSection("Homebrew Formulae (system tools)", brewFormulaList, "No Homebrew formulae found.") +
    formatSection("Homebrew Casks (apps)", brewCaskList, "No Homebrew casks found.") +
    formatSection("Bun Global Packages (JavaScript tooling)", bunGlobals.packages, "No Bun global packages found.") +
    (notes.length ? `## Notes\n\n${notes.map((n) => `- ${n}`).join("\n")}\n\n` : "");

  await writeFile("global-packages-reference.md", doc, "utf-8");
  console.log("Created global-packages-reference.md");
}

main();
