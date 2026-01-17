#!/usr/bin/env bun
/**
 * Pre-commit Verification Hook
 *
 * Purpose: Prevent TypeScript and Biome violations from being committed.
 * This is the first line of defense against the "Strict Compiler" points
 * that have dominated the SCOREBOARD.
 *
 * Usage: bun run precommit
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - TypeScript errors found
 *   2 - Biome lint/check errors found
 *   4 - Changelog verification failed
 *   8 - Consistency check failed
 *   Bitwise OR of the above for multiple failures
 */

const CHECKS = {
	ts: "TypeScript",
	biome: "Biome (lint & format)",
	consistency: "Consistency Audit",
};

interface CheckResult {
	passed: boolean;
	output: string;
	exitCode: number;
}

/**
 * Runs TypeScript compiler in --noEmit mode to check for type errors
 */
async function checkTypeScript(): Promise<CheckResult> {
	const proc = Bun.spawn(["bun", "tsc", "--noEmit"], {
		stderr: "pipe",
		stdout: "pipe",
	});

	const stderr = await new Response(proc.stderr).text();
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	return {
		passed: exitCode === 0,
		output: stdout || stderr,
		exitCode,
	};
}

/**
 * Runs Biome check (lint + format validation)
 */
async function checkBiome(): Promise<CheckResult> {
	const proc = Bun.spawn(["bun", "run", "check"], {
		stderr: "pipe",
		stdout: "pipe",
	});

	const stderr = await new Response(proc.stderr).text();
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	return {
		passed: exitCode === 0,
		output: stdout || stderr,
		exitCode,
	};
}

/**
 * Runs consistency audit check
 * Enforces 80% threshold to allow for minor inconsistencies
 * while catching major issues
 */
async function checkConsistency(): Promise<CheckResult> {
	const proc = Bun.spawn(
		["bun", "run", "scripts/maintenance/consistency-report.ts", "--json"],
		{
			stderr: "pipe",
			stdout: "pipe",
		},
	);

	const stderr = await new Response(proc.stderr).text();
	const stdout = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	// Parse JSON output to get score
	let passed = exitCode === 0;
	let output = stdout || stderr;

	if (exitCode === 0 && stdout) {
		try {
			const report = JSON.parse(stdout);
			const score = report.overall_score;
			const THRESHOLD = 80; // Require 80% consistency

			if (score < THRESHOLD) {
				passed = false;
				const failed = report.checks_failed;
				output = `Score: ${score}% (threshold: ${THRESHOLD}%)\n${failed} check(s) failed.\n\nRun 'bun run scripts/maintenance/consistency-report.ts' for details.`;
			} else {
				output = `Score: ${score}% (${report.checks_passed}/${report.checks_total} checks passed)`;
			}
		} catch (err) {
			passed = false;
			output = `Failed to parse consistency report: ${err}`;
		}
	}

	return {
		passed,
		output,
		exitCode: passed ? 0 : 1,
	};
}

/**
 * Formats error output for clarity
 */
function formatError(name: string, result: CheckResult): string {
	const emoji = result.passed ? "✅" : "❌";
	const lines = ["", `${emoji} ${name}`, "─".repeat(40)];

	if (!result.passed) {
		lines.push(result.output);
	}

	return lines.join("\n");
}

/**
 * Main execution
 */
async function main() {
	console.log("🔍 Pre-commit Verification Hook");
	console.log("═".repeat(40));

	const results = {
		ts: await checkTypeScript(),
		biome: await checkBiome(),
		consistency: await checkConsistency(),
	};

	// Output results
	console.log(formatError(CHECKS.ts, results.ts));
	console.log(formatError(CHECKS.biome, results.biome));
	console.log(formatError(CHECKS.consistency, results.consistency));

	// Determine overall exit code
	let exitCode = 0;

    // Check Changelog Version
    const packageJson = await Bun.file("package.json").json();
    const changelog = await Bun.file("CHANGELOG.md").text();
    const versionHeader = `[${packageJson.version}]`;
    
    if (!changelog.includes(versionHeader)) {
        exitCode += 4;
        console.log(`\n❌ Changelog verification failed.`);
        console.log(`   Expected to find header: ${versionHeader}`);
        console.log("   Fix: Update CHANGELOG.md with the current version details.");
    } else {
        console.log(`\n✅ Changelog verification passed (${packageJson.version}).`);
    }

	if (!results.ts.passed) {
		exitCode += 1;
		console.log("\n❌ TypeScript errors detected. Commit blocked.");
		console.log("   Fix: Run 'bun tsc --noEmit' to see full errors.");
	}

	if (!results.biome.passed) {
		exitCode += 2;
		console.log("\n❌ Biome errors detected. Commit blocked.");
		console.log("   Fix: Run 'bun run format' and 'bun run lint'.");
	}

	if (!results.consistency.passed) {
		exitCode += 8;
		console.log("\n❌ Consistency check failed. Commit blocked.");
		console.log(
			"   Fix: Run 'bun run scripts/maintenance/consistency-report.ts' for details.",
		);
	}

	if (exitCode === 0) {
		console.log("\n✅ All checks passed. Proceeding with commit.");
	}

	process.exit(exitCode);
}

main().catch((err) => {
	console.error("💥 Hook error:", err);
	process.exit(1);
});
