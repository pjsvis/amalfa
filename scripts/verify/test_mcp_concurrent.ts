#!/usr/bin/env bun
/**
 * P0-1 Verification: Test MCP Server Concurrent Request Handling
 *
 * This script verifies that the MCP server can handle concurrent requests
 * without corruption by creating fresh connections per request.
 *
 * Test Strategy:
 * 1. Spawn 10 concurrent search requests
 * 2. Verify all complete successfully
 * 3. Check for any SQLITE_BUSY or corruption errors
 */

import { spawn } from "bun";

async function sendMCPRequest(
	query: string,
	requestId: number,
): Promise<{ success: boolean; error?: string; duration: number }> {
	const start = performance.now();

	try {
		// Construct MCP JSON-RPC request
		const request = {
			jsonrpc: "2.0",
			id: requestId,
			method: "tools/call",
			params: {
				name: "search_documents",
				arguments: { query, limit: 5 },
			},
		};

		// Spawn MCP client process
		const proc = spawn(["bun", "run", "src/mcp/index.ts", "serve"], {
			cwd: process.cwd(),
			stdin: "pipe",
			stdout: "pipe",
			stderr: "pipe",
		});

		// Send request
		proc.stdin.write(`${JSON.stringify(request)}\n`);
		proc.stdin.end();

		// Read response
		const output = await new Response(proc.stdout).text();
		const stderr = await new Response(proc.stderr).text();

		const duration = performance.now() - start;

		// Check for errors
		if (stderr.includes("SQLITE_BUSY") || stderr.includes("disk I/O error")) {
			return {
				success: false,
				error: "Database concurrency error detected",
				duration,
			};
		}

		if (stderr.includes("ERROR") || stderr.includes("Error:")) {
			return {
				success: false,
				error: `Error in stderr: ${stderr.slice(0, 200)}`,
				duration,
			};
		}

		// Verify response is valid JSON-RPC
		try {
			const lines = output.split("\n").filter((l) => l.trim());
			for (const line of lines) {
				try {
					const response = JSON.parse(line);
					if (response.id === requestId) {
						return { success: true, duration };
					}
				} catch {
					// Skip non-JSON lines
				}
			}
			return {
				success: false,
				error: "No valid JSON-RPC response found",
				duration,
			};
		} catch (e) {
			return {
				success: false,
				error: `Failed to parse response: ${e}`,
				duration,
			};
		}
	} catch (e) {
		const duration = performance.now() - start;
		return { success: false, error: `Exception: ${e}`, duration };
	}
}

async function main() {
	console.log("🧪 P0-1 Verification: MCP Concurrent Request Test");
	console.log("=".repeat(60));
	console.log();

	const queries = [
		"database",
		"architecture",
		"protocol",
		"verification",
		"testing",
		"pipeline",
		"ingestion",
		"embedding",
		"vector",
		"graph",
	];

	console.log(`📤 Sending ${queries.length} concurrent requests...`);
	const startTime = performance.now();

	// Send all requests concurrently
	const promises = queries.map((query, idx) => sendMCPRequest(query, idx + 1));
	const results = await Promise.all(promises);

	const totalDuration = performance.now() - startTime;

	console.log(`✅ All requests completed in ${totalDuration.toFixed(0)}ms`);
	console.log();

	// Analyze results
	const successful = results.filter((r) => r.success).length;
	const failed = results.filter((r) => !r.success).length;

	console.log("📊 Results:");
	console.log(`   ✅ Successful: ${successful}/${queries.length}`);
	console.log(`   ❌ Failed: ${failed}/${queries.length}`);
	console.log();

	if (failed > 0) {
		console.log("❌ Failed Requests:");
		results.forEach((r, idx) => {
			if (!r.success) {
				console.log(`   ${idx + 1}. ${queries[idx]}: ${r.error}`);
			}
		});
		console.log();
	}

	// Performance stats
	const avgDuration =
		results.reduce((sum, r) => sum + r.duration, 0) / results.length;
	const maxDuration = Math.max(...results.map((r) => r.duration));
	const minDuration = Math.min(...results.map((r) => r.duration));

	console.log("⏱️  Performance:");
	console.log(`   Avg: ${avgDuration.toFixed(0)}ms`);
	console.log(`   Min: ${minDuration.toFixed(0)}ms`);
	console.log(`   Max: ${maxDuration.toFixed(0)}ms`);
	console.log();

	// Final verdict
	if (successful === queries.length) {
		console.log("✅ TEST PASSED: All concurrent requests handled successfully");
		console.log("   No SQLITE_BUSY or corruption errors detected");
		process.exit(0);
	} else {
		console.log("❌ TEST FAILED: Some requests failed");
		console.log("   See errors above for details");
		process.exit(1);
	}
}

main();
