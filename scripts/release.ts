#!/usr/bin/env bun
/**
 * Release Automation Script
 *
 * Handles version bumping, testing, GitHub push, and npm publishing
 *
 * Usage:
 *   bun run scripts/release.ts <patch|minor|major> [--dry-run]
 *
 * Examples:
 *   bun run scripts/release.ts patch           # 1.0.1 -> 1.0.2
 *   bun run scripts/release.ts minor           # 1.0.1 -> 1.1.0
 *   bun run scripts/release.ts major           # 1.0.1 -> 2.0.0
 *   bun run scripts/release.ts patch --dry-run # Test without publishing
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Colors for output
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	bold: "\x1b[1m",
};

function log(message: string, color: keyof typeof colors = "reset") {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command: string, options: { silent?: boolean } = {}) {
	try {
		const output = execSync(command, {
			encoding: "utf-8",
			stdio: options.silent ? "pipe" : "inherit",
		});
		return { success: true, output };
	} catch (error: any) {
		return { success: false, error: error.message };
	}
}

function getVersion(): string {
	const pkgPath = join(process.cwd(), "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	return pkg.version;
}

function bumpVersion(type: "patch" | "minor" | "major"): string {
	const current = getVersion();
	const [major, minor, patch] = current.split(".").map(Number);

	switch (type) {
		case "major":
			return `${(major || 0) + 1}.0.0`;
		case "minor":
			return `${major}.${(minor || 0) + 1}.0`;
		case "patch":
			return `${major}.${minor}.${(patch || 0) + 1}`;
		default:
			throw new Error(`Invalid version type: ${type}`);
	}
}

function updatePackageJson(newVersion: string) {
	const pkgPath = join(process.cwd(), "package.json");
	const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
	pkg.version = newVersion;
	writeFileSync(pkgPath, JSON.stringify(pkg, null, "\t") + "\n");
}

async function runChecks(): Promise<boolean> {
	log("\n📋 Running Pre-Release Checks", "cyan");
	log("=".repeat(60), "cyan");

	// 1. Check git status
	log("\n1️⃣  Checking git status...");
	const statusResult = exec("git status --porcelain", { silent: true });
	if (!statusResult.success) {
		log("❌ Failed to check git status", "red");
		return false;
	}

	const uncommitted = statusResult.output?.trim();
	if (uncommitted) {
		log("❌ Uncommitted changes detected:", "red");
		log(uncommitted, "yellow");
		log("   Commit or stash changes before releasing", "yellow");
		return false;
	}
	log("✅ No uncommitted changes", "green");

	// 2. Check branch
	log("\n2️⃣  Checking branch...");
	const branchResult = exec("git branch --show-current", { silent: true });
	if (!branchResult.success || branchResult.output?.trim() !== "main") {
		log(
			`❌ Not on main branch (current: ${branchResult.output?.trim()})`,
			"red",
		);
		log("   Switch to main before releasing", "yellow");
		return false;
	}
	log("✅ On main branch", "green");

	// 3. Check remote
	log("\n3️⃣  Checking remote sync...");
	exec("git fetch", { silent: true });
	const behindResult = exec("git rev-list HEAD..origin/main --count", {
		silent: true,
	});
	const behind = Number.parseInt(behindResult.output?.trim() || "0");
	if (behind > 0) {
		log(`❌ Local branch is ${behind} commits behind origin/main`, "red");
		log("   Run: git pull", "yellow");
		return false;
	}

	const aheadResult = exec("git rev-list origin/main..HEAD --count", {
		silent: true,
	});
	const ahead = Number.parseInt(aheadResult.output?.trim() || "0");
	if (ahead > 0) {
		log(`⚠️  Local branch is ${ahead} commits ahead of origin/main`, "yellow");
		log("   Will push changes during release", "yellow");
	} else {
		log("✅ In sync with origin/main", "green");
	}

	// 4. Run tests/validation
	log("\n4️⃣  Running validation...");
	const validateResult = exec("bun run validate-config", { silent: true });
	if (!validateResult.success) {
		log("❌ Config validation failed", "red");
		return false;
	}
	log("✅ Config validation passed", "green");

	// 5. Run linter
	log("\n5️⃣  Running linter...");
	const lintResult = exec("bun run check", { silent: true });
	if (!lintResult.success) {
		log("⚠️  Linting issues found (non-blocking)", "yellow");
		// Don't fail on lint warnings, just notify
	} else {
		log("✅ Linting passed", "green");
	}

	// 6. Check npm authentication
	log("\n6️⃣  Checking npm authentication...");
	const npmWhoamiResult = exec("npm whoami", { silent: true });
	if (!npmWhoamiResult.success) {
		log("❌ Not logged in to npm", "red");
		log("   Run: npm login", "yellow");
		return false;
	}
	log(`✅ Logged in as: ${npmWhoamiResult.output?.trim()}`, "green");

	log("\n" + "=".repeat(60), "cyan");
	log("✅ All pre-release checks passed!\n", "green");
	return true;
}

async function release(
	versionType: "patch" | "minor" | "major",
	dryRun: boolean,
) {
	const currentVersion = getVersion();
	const newVersion = bumpVersion(versionType);

	log("\n🚀 AMALFA Release Process", "bold");
	log("=".repeat(60), "cyan");
	log(`Current version: ${currentVersion}`, "yellow");
	log(`New version:     ${newVersion}`, "green");
	log(`Type:            ${versionType}`, "cyan");
	if (dryRun) {
		log(`Mode:            DRY RUN (no actual changes)`, "yellow");
	}
	log("=".repeat(60), "cyan");

	// Run checks
	const checksPass = await runChecks();
	if (!checksPass) {
		log("\n❌ Pre-release checks failed. Aborting.", "red");
		process.exit(1);
	}

	if (dryRun) {
		log("\n✅ Dry run successful! All checks passed.", "green");
		log(`Would release version ${newVersion}`, "cyan");
		return;
	}

	// Confirm with user
	log("\n⚠️  Ready to release. This will:", "yellow");
	log(`   1. Update package.json to ${newVersion}`, "yellow");
	log("   2. Commit and tag the release", "yellow");
	log("   3. Push to GitHub", "yellow");
	log("   4. Publish to npm", "yellow");
	log("\nPress Ctrl+C to cancel, or Enter to continue...", "yellow");

	// Wait for user confirmation
	await new Promise((resolve) => {
		process.stdin.once("data", resolve);
	});

	// Update version
	log("\n📝 Updating package.json...", "cyan");
	updatePackageJson(newVersion);
	log(`✅ Version updated to ${newVersion}`, "green");

	// Commit
	log("\n📦 Creating release commit...", "cyan");
	exec(`git add package.json`);
	exec(`git commit -m "Release v${newVersion}"`);
	log("✅ Commit created", "green");

	// Tag
	log("\n🏷️  Creating git tag...", "cyan");
	exec(`git tag -a v${newVersion} -m "Release v${newVersion}"`);
	log(`✅ Tag v${newVersion} created`, "green");

	// Push to GitHub
	log("\n⬆️  Pushing to GitHub...", "cyan");
	const pushResult = exec("git push origin main");
	if (!pushResult.success) {
		log("❌ Failed to push to GitHub", "red");
		log("   Rolling back...", "yellow");
		exec(`git tag -d v${newVersion}`);
		exec("git reset --hard HEAD~1");
		process.exit(1);
	}
	log("✅ Pushed to main", "green");

	log("\n⬆️  Pushing tags...", "cyan");
	const pushTagsResult = exec("git push origin --tags");
	if (!pushTagsResult.success) {
		log("❌ Failed to push tags", "red");
		process.exit(1);
	}
	log("✅ Tags pushed", "green");

	// Publish to npm
	log("\n📦 Publishing to npm...", "cyan");
	const publishResult = exec("npm publish");
	if (!publishResult.success) {
		log("❌ npm publish failed", "red");
		log("   Code is pushed to GitHub but not published to npm", "yellow");
		log("   You can manually publish with: npm publish", "yellow");
		process.exit(1);
	}
	log("✅ Published to npm", "green");

	// Success!
	log("\n" + "=".repeat(60), "cyan");
	log("🎉 Release Complete!", "green");
	log("=".repeat(60), "cyan");
	log(`\n✅ Version ${newVersion} is live!`, "green");
	log(`\n📦 npm: https://www.npmjs.com/package/amalfa/v/${newVersion}`, "cyan");
	log(
		`🐙 GitHub: https://github.com/pjsvis/amalfa/releases/tag/v${newVersion}`,
		"cyan",
	);
	log("\nNext steps:", "yellow");
	log("  1. Create GitHub release notes", "yellow");
	log("  2. Announce on relevant channels", "yellow");
	log("  3. Update documentation if needed", "yellow");
	log("");
}

// Main
const args = process.argv.slice(2);
const versionType = args[0] as "patch" | "minor" | "major";
const dryRun = args.includes("--dry-run");

if (!["patch", "minor", "major"].includes(versionType)) {
	log("❌ Invalid version type", "red");
	log(
		"\nUsage: bun run scripts/release.ts <patch|minor|major> [--dry-run]",
		"yellow",
	);
	log("\nExamples:", "yellow");
	log(
		"  bun run scripts/release.ts patch           # 1.0.1 -> 1.0.2",
		"yellow",
	);
	log(
		"  bun run scripts/release.ts minor           # 1.0.1 -> 1.1.0",
		"yellow",
	);
	log(
		"  bun run scripts/release.ts major           # 1.0.1 -> 2.0.0",
		"yellow",
	);
	log(
		"  bun run scripts/release.ts patch --dry-run # Test without publishing",
		"yellow",
	);
	process.exit(1);
}

release(versionType, dryRun).catch((error) => {
	log(`\n❌ Release failed: ${error.message}`, "red");
	process.exit(1);
});
