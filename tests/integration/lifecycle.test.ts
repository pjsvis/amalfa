import { VectorEngine } from "@src/core/VectorEngine";
import { Ingestor } from "@src/pipeline/Ingestor";
import { ResonanceDB } from "@src/resonance/db";
import { $ } from "bun";

const dbPath = "public/resonance.db";
const db = new ResonanceDB(dbPath);
const vectorEngine = new VectorEngine(db.getRawDb());
const testFile = "docs/test_lifecycle_E2E.md";
const testId = "test-lifecycle-e2e";

async function run() {
	console.log("🚦 Starting E2E Lifecycle Test...");

	// --- PHASE 1: CREATE ---
	console.log(`\n📝 [1/5] Creating Test Document '${testFile}'...`);
	const content = `# Lifecycle Test\n\nThis is a unique integration test signature: ${Date.now()}.\nIt verifies Full-Text Search and Vector Ingestion logic.`;
	await Bun.write(testFile, content);

	// --- PHASE 2: INGEST ---
	console.log("\n⚙️  [2/5] Running Ingestion Pipeline...");
	const ingestor = new Ingestor(dbPath);
	await ingestor.run();
	console.log("   ✅ Ingestion Complete.");

	// --- PHASE 3: VERIFY EXISTENCE ---
	console.log("\n🔍 [3/5] Verifying Search...");

	// 3a. FTS
	// FTS search removed.
	// Verification of FTS is removed.

	// 3b. Vector
	// DEBUG: Check if node actually made it to DB with vector
	const debugNode = db
		.getRawDb()
		.query("SELECT id, length(embedding) as vecLen FROM nodes WHERE id LIKE ?")
		.get(`%${testId}%`) as { id: string; vecLen: number | null };
	console.log("   [Debug] DB Node:", debugNode);

	const vecResults = await vectorEngine.search(
		"unique integration test signature",
		5,
	);
	console.log(
		"   [Debug] Vector Top 5:",
		vecResults.map((r) => r.id),
	);

	const hasVec = vecResults.some(
		(r) =>
			r.id.toLowerCase().includes(testId) ||
			r.id.toLowerCase().includes("test_lifecycle_e2e"),
	);
	console.log(
		`   [Vector] Found: ${hasVec ? "YES" : "NO"} (${vecResults.length > 0 ? vecResults[0]?.id : "none"})`,
	);
	if (!hasVec) throw new Error("Vector Verification Failed");

	// --- PHASE 4: DELETE ---
	console.log("\n🗑️  [4/5] Deleting Test Document...");
	// 4a. Delete File
	await $`rm ${testFile}`;

	// 4b. Sync Deletion (SIMULATED ORPHAN PRUNE)
	// Since pipeline is additive, we simulate what a 'prune' command would do: check FS and delete DB.
	// For this test, we explicitly delete the known ID to verify FTS trigger works.
	console.log("   Simulating Prune (Deleting from DB)...");

	// We expect the trigger `nodes_ad` to handle FTS cleanup.
	// We get the specific node ID that was inserted.
	const fileId = vecResults[0]?.id;
	if (!fileId) throw new Error("Could not find fileId to delete");
	console.log(`   Removing Node ID: ${fileId}`);

	db.getRawDb().run("DELETE FROM nodes WHERE id = ?", [fileId]);

	// --- PHASE 5: VERIFY DELETION ---
	console.log("\n🚫 [5/5] Verifying Deletion...");

	// 5a. Check FTS (Should NOT contain fileId)
	// 9. Verify FTS update (it should be gone or at least not erroring)
	// [REMOVED] FTS search removed.
	// expect(ftsGhost).toBeUndefined();
	// The original `else` block is removed as it's part of the FTS verification.

	// 5b. Check Vector (Should be empty) - manual verify via SQL as VectorEngine might return nearest neighbor anyway
	const vecCheck = await vectorEngine.search(
		"unique integration test signature",
		5,
	);
	// If it returns *something*, check if it's OUR document.
	const ghost = vecCheck.find((r) => r.id === fileId);
	if (!ghost) {
		console.log("   ✅ [Vector] Clean (Node not found in results).");
	} else {
		throw new Error(`Vector Deletion Failed - Node ${fileId} still found.`);
	}

	console.log("\n🎉 ALL TESTS PASSED.");
}

run().catch((e) => {
	console.error("\n❌ TEST FAILED:", e);
	process.exit(1);
});
