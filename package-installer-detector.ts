#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { existsSync, lstatSync, readlinkSync } from "node:fs";

interface InstallerResult {
  package: string;
  installer: string;
  path: string;
  version?: string;
  evidence: string[];
}

class PackageInstallerDetector {
  private cache = new Map<string, InstallerResult>();

  async detect(packageName: string): Promise<InstallerResult> {
    if (this.cache.has(packageName)) {
      return this.cache.get(packageName)!;
    }

    const result = await this.performDetection(packageName);
    this.cache.set(packageName, result);
    return result;
  }

  private async performDetection(
    packageName: string,
  ): Promise<InstallerResult> {
    const evidence: string[] = [];
    let installer = "Unknown";
    let path = "";
    let version: string | undefined;

    try {
      const whichOutput = execSync(`which ${packageName}`, {
        encoding: "utf8",
      }).trim();
      path = whichOutput;
      evidence.push(`Found in PATH: ${path}`);
    } catch {
      return {
        package: packageName,
        installer: "Not Found",
        path: "",
        evidence: ["Package not found in PATH"],
      };
    }

    const pathBasedInstaller = this.detectFromPath(path);
    if (pathBasedInstaller !== "Unknown") {
      installer = pathBasedInstaller;
      evidence.push(`Path pattern suggests: ${installer}`);
    }

    if (installer === "Unknown" || installer === "Homebrew") {
      const nodeJsResult = await this.detectNodeJsInstaller(packageName, path);
      if (nodeJsResult.installer !== "Unknown") {
        installer = nodeJsResult.installer;
        version = nodeJsResult.version;
        evidence.push(...nodeJsResult.evidence);
      }
    }

    if (installer === "Unknown") {
      const pythonResult = await this.detectPythonInstaller(packageName, path);
      if (pythonResult.installer !== "Unknown") {
        installer = pythonResult.installer;
        version = pythonResult.version;
        evidence.push(...pythonResult.evidence);
      }
    }

    if (installer === "Unknown") {
      const systemResult = await this.detectSystemInstaller(packageName, path);
      if (systemResult.installer !== "Unknown") {
        installer = systemResult.installer;
        version = systemResult.version;
        evidence.push(...systemResult.evidence);
      }
    }

    if (!version) {
      try {
        const versionOutput = execSync(`${packageName} --version`, {
          encoding: "utf8",
          stdio: ["pipe", "pipe", "pipe"],
        }).trim();
        version = versionOutput;
        evidence.push(`Version: ${version}`);
      } catch {
        for (const flag of ["-v", "-V", "version"]) {
          try {
            const versionOutput = execSync(`${packageName} ${flag}`, {
              encoding: "utf8",
              stdio: ["pipe", "pipe", "pipe"],
            }).trim();
            version = versionOutput;
            evidence.push(`Version: ${version}`);
            break;
          } catch {
            // Continue trying other flags
          }
        }
      }
    }

    return {
      package: packageName,
      installer,
      path,
      version,
      evidence,
    };
  }

  private detectFromPath(path: string): string {
    if (path.startsWith("/usr/local/Cellar/")) return "Homebrew";
    if (path.startsWith("/usr/local/bin/") && this.checkIfHomebrewManaged(path))
      return "Homebrew";
    if (path.startsWith("/opt/homebrew/")) return "Homebrew";
    if (path.startsWith("/usr/bin/")) return "System (apt/yum)";
    if (
      path.startsWith("/usr/local/bin/") &&
      !this.checkIfHomebrewManaged(path)
    )
      return "Manual/System";
    if (path.startsWith("/snap/")) return "Snap";
    if (path.startsWith("/flatpak/")) return "Flatpak";
    if (path.includes(".nvm/")) return "NVM";
    if (path.includes("node_modules/.bin/")) return "Node.js (local)";

    return "Unknown";
  }

  private checkIfHomebrewManaged(binaryPath: string): boolean {
    try {
      const stats = lstatSync(binaryPath);
      if (stats.isSymbolicLink()) {
        const realPath = readlinkSync(binaryPath);
        return realPath.includes("Cellar") || realPath.includes("homebrew");
      }

      const brewList = execSync("brew list", { encoding: "utf8" });
      const packageName = binaryPath.split("/").pop();
      if (packageName && brewList.includes(packageName)) {
        return true;
      }
    } catch {
      // Not a symlink or doesn't exist
    }
    return false;
  }

  private checkCommandExists(command: string): boolean {
    try {
      execSync(`which ${command}`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return true;
    } catch {
      return false;
    }
  }

  private async detectNodeJsInstaller(
    packageName: string,
    path: string,
  ): Promise<{ installer: string; version?: string; evidence: string[] }> {
    const evidence: string[] = [];

    if (this.checkCommandExists("npm")) {
      try {
        const npmList = execSync("npm list -g --depth=0 --json", {
          encoding: "utf8",
        });
        const npmData = JSON.parse(npmList);
        if (npmData.dependencies?.[packageName]) {
          const version = npmData.dependencies[packageName].version;
          evidence.push(`Found in npm global packages (version: ${version})`);
          return { installer: "npm", version, evidence };
        }
      } catch {
        evidence.push("Not found in npm global list");
      }
    } else {
      evidence.push("npm not available on system");
    }

    if (this.checkCommandExists("yarn")) {
      try {
        const yarnList = execSync("yarn global list --json", {
          encoding: "utf8",
        });
        if (yarnList.includes(packageName)) {
          evidence.push("Found in yarn global packages");
          return { installer: "yarn", evidence };
        }
      } catch {
        evidence.push("Not found in yarn global list");
      }
    } else {
      evidence.push("yarn not available on system");
    }

    if (this.checkCommandExists("pnpm")) {
      try {
        const pnpmList = execSync("pnpm list -g --depth=0 --json", {
          encoding: "utf8",
        });
        const pnpmData = JSON.parse(pnpmList);
        if (pnpmData.dependencies?.[packageName]) {
          const version = pnpmData.dependencies[packageName].version;
          evidence.push(`Found in pnpm global packages (version: ${version})`);
          return { installer: "pnpm", version, evidence };
        }
      } catch {
        evidence.push("Not found in pnpm global list");
      }
    } else {
      evidence.push("pnpm not available on system");
    }

    if (
      path.includes("npm") ||
      path.includes("yarn") ||
      path.includes("pnpm")
    ) {
      if (path.includes("pnpm")) return { installer: "pnpm", evidence };
      if (path.includes("yarn")) return { installer: "yarn", evidence };
      if (path.includes("npm")) return { installer: "npm", evidence };
    }

    return { installer: "Unknown", evidence };
  }

  private async detectPythonInstaller(
    packageName: string,
    _path: string,
  ): Promise<{ installer: string; version?: string; evidence: string[] }> {
    const evidence: string[] = [];

    if (this.checkCommandExists("pip")) {
      try {
        const pipShow = execSync(`pip show ${packageName}`, {
          encoding: "utf8",
        });
        const lines = pipShow.split("\n");
        let version: string | undefined;
        let location: string | undefined;

        for (const line of lines) {
          if (line.startsWith("Version:")) version = line.split(": ")[1];
          if (line.startsWith("Location:")) location = line.split(": ")[1];
        }

        if (location) {
          if (location.includes("site-packages")) {
            evidence.push(`Found in pip system packages (version: ${version})`);
            return { installer: "pip (system)", version, evidence };
          } else if (location.includes(".local")) {
            evidence.push(`Found in pip user packages (version: ${version})`);
            return { installer: "pip (user)", version, evidence };
          } else {
            evidence.push(
              `Found in pip (version: ${version}, location: ${location})`,
            );
            return { installer: "pip", version, evidence };
          }
        }
      } catch {
        evidence.push("Not found in pip show");
      }
    } else {
      evidence.push("pip not available on system");
    }

    if (this.checkCommandExists("pip3")) {
      try {
        const _pipShow = execSync(`pip3 show ${packageName}`, {
          encoding: "utf8",
        });
        evidence.push("Found in pip3 packages");
        return { installer: "pip3", evidence };
      } catch {
        evidence.push("Not found in pip3 show");
      }
    } else {
      evidence.push("pip3 not available on system");
    }

    return { installer: "Unknown", evidence };
  }

  private async detectSystemInstaller(
    packageName: string,
    path: string,
  ): Promise<{ installer: string; version?: string; evidence: string[] }> {
    const evidence: string[] = [];

    if (
      this.checkCommandExists("brew") &&
      (path.startsWith("/usr/local/") || path.startsWith("/opt/homebrew/"))
    ) {
      try {
        const brewList = execSync(`brew list | grep -E "^${packageName}$"`, {
          encoding: "utf8",
        });
        if (brewList.trim() === packageName) {
          const brewInfo = execSync(`brew info ${packageName}`, {
            encoding: "utf8",
          });
          const versionLine = brewInfo.split("\n")[0];
          const version = versionLine?.match(/(\d+\.\d+[.\d+]*)/)?.[1];
          evidence.push(`Confirmed in Homebrew list (version: ${version})`);
          return { installer: "Homebrew", version, evidence };
        }
      } catch {
        evidence.push("Not found in Homebrew list");
      }
    } else if (!this.checkCommandExists("brew")) {
      evidence.push("brew not available on system");
    }

    if (this.checkCommandExists("dpkg") && path.startsWith("/usr/")) {
      try {
        const dpkg = execSync(`dpkg -l | grep -E "ii  ${packageName} "`, {
          encoding: "utf8",
        });
        if (dpkg.trim()) {
          evidence.push("Found in dpkg list");
          return { installer: "apt/dpkg", evidence };
        }
      } catch {
        evidence.push("Not found in dpkg");
      }
    } else if (!this.checkCommandExists("dpkg")) {
      evidence.push("dpkg not available on system");
    }

    if (this.checkCommandExists("rpm") && path.startsWith("/usr/")) {
      try {
        const rpm = execSync(`rpm -q ${packageName}`, { encoding: "utf8" });
        if (!rpm.includes("not installed")) {
          evidence.push("Found in rpm database");
          return { installer: "rpm/yum", evidence };
        }
      } catch {
        evidence.push("Not found in rpm");
      }
    } else if (!this.checkCommandExists("rpm")) {
      evidence.push("rpm not available on system");
    }

    if (this.checkCommandExists("snap") && path.startsWith("/snap/")) {
      try {
        const snapList = execSync(`snap list | grep -E "^${packageName} "`, {
          encoding: "utf8",
        });
        if (snapList.trim()) {
          evidence.push("Found in snap list");
          return { installer: "Snap", evidence };
        }
      } catch {
        evidence.push("Not found in snap");
      }
    } else if (!this.checkCommandExists("snap")) {
      evidence.push("snap not available on system");
    }

    return { installer: "Unknown", evidence };
  }

  async scanAll(): Promise<InstallerResult[]> {
    const results: InstallerResult[] = [];
    const allPackages = new Set<string>();

    if (this.checkCommandExists("npm")) {
      try {
        const npmList = execSync("npm list -g --depth=0 --json", {
          encoding: "utf8",
        });
        const npmData = JSON.parse(npmList);
        if (npmData.dependencies) {
          Object.keys(npmData.dependencies).forEach((pkg) => {
            allPackages.add(pkg);
          });
        }
      } catch {}
    }

    if (this.checkCommandExists("yarn")) {
      try {
        const yarnList = execSync("yarn global list --json", {
          encoding: "utf8",
        });
        const yarnData = JSON.parse(yarnList);
        if (yarnData.dependencies) {
          Object.keys(yarnData.dependencies).forEach((pkg) => {
            allPackages.add(pkg);
          });
        }
      } catch {}
    }

    if (this.checkCommandExists("brew")) {
      try {
        const brewList = execSync("brew list", { encoding: "utf8" });
        brewList
          .split("\n")
          .filter((pkg) => pkg.trim())
          .forEach((pkg) => {
            allPackages.add(pkg);
          });
      } catch {}
    }

    for (const pkg of allPackages) {
      if (typeof pkg !== "string") continue;
      try {
        const result = await this.detect(pkg);
        results.push(result);
      } catch {
        // Skip packages that can't be detected
      }
    }

    return results.sort((a, b) => a.installer.localeCompare(b.installer));
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: package-installer-detector.ts <package-name>");
    console.log("       package-installer-detector.ts --scan-all");
    console.log("       package-installer-detector.ts --help");
    process.exit(1);
  }

  if (args[0] === "--help") {
    console.log(`
Package Installer Detector

Detects which package manager was used to install global packages.

Usage:
  bun run package-installer-detector.ts <package-name>  Detect specific package
  bun run package-installer-detector.ts --scan-all      Scan all global packages
  bun run package-installer-detector.ts --help          Show this help

Examples:
  bun run package-installer-detector.ts ollama
  bun run package-installer-detector.ts node
  bun run package-installer-detector.ts --scan-all

Supported Installers:
  - Node.js: npm, yarn, pnpm (global)
  - Python: pip, pip3 (system/user)
  - System: Homebrew, apt/dpkg, rpm/yum, Snap
  - Manual installations
    `);
    process.exit(0);
  }

  const detector = new PackageInstallerDetector();

  if (args[0] === "--scan-all") {
    console.log("Scanning all global packages...\n");
    const results = await detector.scanAll();

    const grouped = results.reduce(
      (acc: Record<string, InstallerResult[]>, result) => {
        if (!acc[result.installer]) acc[result.installer] = [];
        acc[result.installer]!.push(result);
        return acc;
      },
      {},
    );

    for (const [installer, packages] of Object.entries(grouped)) {
      if (!installer || !packages) continue;
      console.log(`\n📦 ${installer}:`);
      packages.forEach((pkg) => {
        const versionStr = pkg.version ? ` (${pkg.version})` : "";
        console.log(`   ${pkg.package}${versionStr} -> ${pkg.path}`);
      });
    }

    console.log(`\nTotal packages found: ${results.length}`);
  } else {
    const packageName = args[0];
    if (!packageName) {
      console.log("Error: Package name is required");
      process.exit(1);
    }
    console.log(`Detecting installer for: ${packageName}\n`);

    const result = await detector.detect(packageName);

    console.log(`📦 Package: ${result.package}`);
    console.log(`🔧 Installer: ${result.installer}`);
    console.log(`📍 Path: ${result.path}`);
    if (result.version) {
      console.log(`🏷️  Version: ${result.version}`);
    }

    if (result.evidence.length > 0) {
      console.log(`\n🔍 Evidence:`);
      result.evidence.forEach((evidence) => {
        console.log(`   • ${evidence}`);
      });
    }
  }
}

if (import.meta.main) {
  main().catch(console.error);
}

export { PackageInstallerDetector, type InstallerResult };
