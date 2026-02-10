import { mkdir, rmdir } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "bun";
import { ResonanceDB } from "../../../resonance/db";
import { JsonlUtils } from "../../../utils/JsonlUtils";

const TEST_DIR = join(process.cwd(), ".amalfa-test-env");
const DB_PATH = join(TEST_DIR, "resonance.db");

async function setup() {
  console.log(`🛠️  Setting up Test Harness at ${TEST_DIR}`);
  if (await Bun.file(TEST_DIR).exists()) {
    await rmdir(TEST_DIR, { recursive: true });
  }
  await mkdir(join(TEST_DIR, ".amalfa"), { recursive: true });

  // Initialize Empty DB
  const db = new ResonanceDB(DB_PATH);
  db.close();
}

async function createFixtures() {
  console.log("📝 Creating Fixtures...");

  // 1. Nodes (Enriched)
  const nodes = [
    {
      id: "alpha",
      label: "Alpha",
      type: "concept",
      summary: "First letter",
      domain: "lexicon",
    },
    {
      id: "beta",
      label: "Beta",
      type: "concept",
      summary: "Second letter",
      domain: "lexicon",
    },
  ];
  await Bun.write(join(TEST_DIR, ".amalfa/golden-lexicon-enriched.jsonl"), "");
  for (const n of nodes)
    await JsonlUtils.appendAsync(
      join(TEST_DIR, ".amalfa/golden-lexicon-enriched.jsonl"),
      n,
    );

  // 2. Vectors
  const vectors = [
    { id: "alpha", embedding: Array(384).fill(0.1) },
    { id: "beta", embedding: Array(384).fill(0.2) },
  ];
  await Bun.write(join(TEST_DIR, ".amalfa/lexicon-vectors.jsonl"), "");
  for (const v of vectors)
    await JsonlUtils.appendAsync(
      join(TEST_DIR, ".amalfa/lexicon-vectors.jsonl"),
      v,
    );

  // 3. Edges
  const edges = [
    {
      source: "alpha",
      target: "beta",
      type: "next",
      weight: 0.9,
      meta: { origin: "test" },
    },
  ];
  await Bun.write(join(TEST_DIR, ".amalfa/proposed-edges.jsonl"), "");
  for (const e of edges)
    await JsonlUtils.appendAsync(
      join(TEST_DIR, ".amalfa/proposed-edges.jsonl"),
      e,
    );
}

async function runTest() {
  await setup();
  await createFixtures();

  console.log("🚀 Launching Ingest Script in Isolation...");

  const proc = spawn(["bun", "run", "src/pipeline/lexicon/06-ingest.ts"], {
    env: {
      ...process.env,
      AMALFA_PIPE_ROOT: TEST_DIR,
      AMALFA_DB_PATH: DB_PATH,
    },
    stdout: "inherit",
    stderr: "inherit",
  });

  await proc.exited;

  if (proc.exitCode !== 0) {
    console.error(`❌ Stats Failed: Exit Code ${proc.exitCode}`);
    process.exit(1);
  }

  console.log("✅ Ingest Process Completed.");

  // Verify DB Content
  const db = new ResonanceDB(DB_PATH);
  const nodeCount = db
    .getRawDb()
    .query("SELECT count(*) as c FROM nodes")
    .get() as { c: number };
  const edgeCount = db
    .getRawDb()
    .query("SELECT count(*) as c FROM edges")
    .get() as { c: number };

  console.log(`📊 DB Stats: ${nodeCount.c} Nodes, ${edgeCount.c} Edges.`);

  if (nodeCount.c !== 2) throw new Error("Expected 2 nodes");
  if (edgeCount.c !== 1) throw new Error("Expected 1 edge");

  // Check Vector
  const alpha = db.getNode("alpha");
  if (!alpha || !alpha.embedding || alpha.embedding[0] !== 0.1) {
    // Float32 precision might differ slightly? 0.1 is tricky. approx check.
    const val = alpha?.embedding?.[0] || 0;
    if (Math.abs(val - 0.1) > 0.0001)
      throw new Error(`Vector mismatch: ${val}`);
  }

  console.log("✅ All Integrity Checks Passed.");

  // Cleanup
  // await rmdir(TEST_DIR, { recursive: true }); // Keep for inspection if needed
}

runTest();
