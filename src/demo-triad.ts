import { EnlightenedTriad } from "./EnlightenedTriad";

async function runPipeline() {
	const triad = new EnlightenedTriad();

	console.log("\n⚡️ SYSTEM ONLINE: Engaging Heterogeneous Intelligence...\n");

	// --- STEP 1: RAW INPUT ---
	const rawLog =
		"2025-12-19 14:02:11 [CRITICAL] Connection refused at 192.168.1.5 (DB_SHARD_04). Latency 4005ms.";
	console.log(`📄 INPUT: "${rawLog}"\n`);

	// --- STEP 2: SCOUT (Extraction) ---
	console.log("--- 🕵️ SCOUT (Phi-3.5) ---");
	const scoutResult = await triad.scout(
		rawLog,
		"Extract the IP address and the specific Error Message.",
	);
	console.log(`>> Output: ${scoutResult}\n`);

	// --- STEP 3: ARCHITECT (Structure) ---
	console.log("--- 📐 ARCHITECT (Llama-3) ---");
	// Feed Scout's output into Architect
	const architectResult = await triad.architect(scoutResult);
	console.log(`>> Output (JSON):`, JSON.stringify(architectResult, null, 2));
	console.log("");

	// --- STEP 4: AUDITOR (Verification) ---
	console.log("--- 🧠 AUDITOR (Olmo-3) ---");
	// Feed a claim based on the structure to the Auditor
	const claim = `The error 'Connection refused' at 192.168.1.5 caused the high latency.`;
	const auditResult = await triad.audit(claim);

	console.log(`\n📝 THOUGHT TRACE (The 'Raj' Monologue):`);
	// Truncate for console readability
	console.log(
		`${auditResult.thought_trace.substring(0, 300)}... [truncated] ...`,
	);

	console.log(
		`\n⚖️ FINAL VERDICT: ${auditResult.passed ? "✅ PASS" : "❌ FAIL"}`,
	);
}

runPipeline();
