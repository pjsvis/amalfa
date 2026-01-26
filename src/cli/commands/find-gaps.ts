import { createSonarClient } from "@src/utils/sonar-client";
import { checkDatabase } from "../utils";

export async function cmdFindGaps(args: string[]) {
	// Parse arguments
	let limit = 10;
	const limitEqIdx = args.findIndex((arg) => arg.startsWith("--limit="));
	const limitSpaceIdx = args.indexOf("--limit");

	if (limitEqIdx !== -1) {
		limit = Number.parseInt(args[limitEqIdx]?.split("=")[1] || "10", 10);
	} else if (limitSpaceIdx !== -1 && args[limitSpaceIdx + 1]) {
		limit = Number.parseInt(args[limitSpaceIdx + 1] || "10", 10);
	}

	let threshold = 0.3;
	const thresholdEqIdx = args.findIndex((arg) =>
		arg.startsWith("--threshold="),
	);
	const thresholdSpaceIdx = args.indexOf("--threshold");

	if (thresholdEqIdx !== -1) {
		threshold = Number.parseFloat(args[thresholdEqIdx]?.split("=")[1] || "0.8");
	} else if (thresholdSpaceIdx !== -1 && args[thresholdSpaceIdx + 1]) {
		threshold = Number.parseFloat(args[thresholdSpaceIdx + 1] || "0.8");
	}

	const jsonOutput = args.includes("--json");

	// Check database
	if (!(await checkDatabase())) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: "Database not found",
					suggestion: "Run 'amalfa init' first",
				}),
			);
		} else {
			console.error("❌ Database not found. Run 'amalfa init' first.");
		}
		process.exit(1);
	}

	try {
		// Create Sonar client
		const sonarClient = await createSonarClient();

		// Check if Sonar is available
		const isAvailable = await sonarClient.isAvailable();

		if (!isAvailable) {
			if (jsonOutput) {
				console.error(
					JSON.stringify({
						error: "Sonar service not available",
						suggestion: "Start Sonar with 'amalfa sonar start'",
					}),
				);
			} else {
				console.error("❌ Sonar service not available");
				console.error("\nThe find-gaps command requires the Sonar service.");
				console.error("Start it with: amalfa sonar start\n");
			}
			process.exit(1);
		}

		// Get gaps
		const gaps = await sonarClient.getGaps(limit);

		// Output
		if (jsonOutput) {
			console.log(JSON.stringify(gaps, null, 2));
		} else {
			// Human-readable output
			if (!gaps || gaps.length === 0) {
				console.log("\n🔍 No significant gaps found in knowledge graph\n");
				console.log("This means:");
				console.log("  - Similar documents are already linked");
				console.log(
					`  - No document pairs exceed similarity threshold (${threshold})`,
				);
				console.log("\n💡 Try lowering the threshold with --threshold 0.7\n");
			} else {
				console.log(
					`\n🔍 Found ${gaps.length} potential gaps (threshold: ${threshold}):\n`,
				);

				for (let i = 0; i < gaps.length; i++) {
					const gap = gaps[i] as any;
					console.log(`${i + 1}. ${gap.source_id} ↔ ${gap.target_id}`);
					console.log(`   Similarity: ${gap.similarity?.toFixed(3) || "N/A"}`);
					if (gap.reason) {
						console.log(`   Reason: ${gap.reason}`);
					}
					if (gap.suggested_link_type) {
						console.log(`   Suggested: ${gap.suggested_link_type}`);
					}
					console.log();
				}

				console.log(
					"💡 Tip: Use 'amalfa read <id>' to review documents before linking\n",
				);
			}
		}
	} catch (error) {
		if (jsonOutput) {
			console.error(
				JSON.stringify({
					error: error instanceof Error ? error.message : String(error),
				}),
			);
		} else {
			console.error(
				"❌ Gap detection failed:",
				error instanceof Error ? error.message : error,
			);
		}
		process.exit(1);
	}
}
