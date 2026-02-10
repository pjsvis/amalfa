import { existsSync } from "node:fs";
import { resolve } from "node:path";

export async function cmdSetupPython() {
  console.log("\n🐍 Amalfa Python Sidecar Setup");
  console.log("=".repeat(60));

  // 1. Check for uv
  const uvCheck = Bun.spawnSync(["which", "uv"]);
  if (uvCheck.exitCode !== 0) {
    console.error("❌ 'uv' package manager not found.");
    console.log("To install uv, run:");
    console.log("  curl -LsSf https://astral.sh/uv/install.sh | sh");
    console.log("\nThen run this command again.");
    process.exit(1);
  }
  console.log("✅ 'uv' found.");

  // 2. Locate Sidecar Directory
  // When running from compilation (dist), we need to find where src/sidecars ended up.
  // Ideally, package.json "files" includes "src/sidecars".
  // We assume standard structure for now.
  const sidecarDir = resolve(process.cwd(), "src/sidecars/lang-extract");

  if (!existsSync(sidecarDir)) {
    console.error(`❌ Sidecar directory not found at: ${sidecarDir}`);
    console.log("Ensure you are running this from the project root.");
    process.exit(1);
  }
  console.log(`📂 Sidecar directory: ${sidecarDir}`);

  // 3. Initialize Python Environment (uv sync)
  console.log("📦 Installing Python dependencies...");
  const proc = Bun.spawn(["uv", "sync"], {
    cwd: sidecarDir,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    console.error("❌ Failed to install Python dependencies.");
    process.exit(1);
  }

  // 4. Update Config (Optional - typically user manual step, but we can hint)
  console.log("\n✅ Python environment ready!");
  console.log("=".repeat(60));
  console.log("To enable Advanced Entity Extraction:");
  console.log("1. Ensure GEMINI_API_KEY is set in your environment.");
  console.log("2. That's it! The Ingestor will auto-detect the capability.");
  console.log("=".repeat(60));
}
