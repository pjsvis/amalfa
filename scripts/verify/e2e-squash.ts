import { ResonanceDB } from "@src/resonance/db";
import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { getLogger } from "@src/utils/Logger";
import { join } from "node:path";

const log = getLogger("E2E:Squash");

async function run() {
    log.info("🧪 Starting E2E Squash Test...");
    const db = ResonanceDB.init();

    // 1. Pre-seed Parent Nodes
    // We manually create nodes because 'amalfa init' might skip 'tests/' or be slow.
    const files = ["Auth.ts", "Logger.ts", "User.ts", "Config.ts", "Utils.ts"];
    const fixtureDir = "tests/fixtures/squash";

    log.info("🌱 Seeding Parent Nodes...");
    db.beginTransaction();
    for (const f of files) {
        const path = join(fixtureDir, f);
        // Mimic generateId logic: filename (Auth.ts) -> auth
        const id = f.replace(/\.ts$/, "").toLowerCase();

        db.insertNode({
            id,
            type: "file",
            label: f,
            domain: "code",
            layer: "document",
            meta: { source: path }
        });
    }
    db.commit();

    // 2. Run Squasher
    log.info("🚜 Running SidecarSquasher...");
    const squasher = new SidecarSquasher(db);
    const pattern = `${fixtureDir}/*.json`;
    const stats = await squasher.squash(pattern);

    log.info(stats, "Squash Stats");

    // 3. Assertions
    const failures: string[] = [];

    const expectedSymbols = [
        { title: "AuthProvider", summary: "Handles authentication logic." },
        { title: "LogService", summary: "Central logging service." },
        { title: "logError", summary: "Logs an error with stack trace." },
        { title: "User", summary: "Represents a system user." },
        { title: "AppConfig", summary: "Application configuration settings." },
        { title: "formatDate", summary: "Formats a date to ISO string." }
    ];

    for (const exp of expectedSymbols) {
        const row = db.getRawDb().query("SELECT * FROM nodes WHERE title = ? AND layer = 'symbol'").get(exp.title) as any;

        if (!row) {
            failures.push(`Missing Symbol Node: ${exp.title}`);
        } else {
            if (row.summary !== exp.summary) {
                failures.push(`Summary mismatch for ${exp.title}. Expected: "${exp.summary}", Got: "${row.summary}"`);
            }
        }
    }

    // Check Intra-file Relationship (CALLS)
    const callsEdge = db.getRawDb().query(`
        SELECT * FROM edges
        WHERE type = 'CALLS'
        AND source IN (SELECT id FROM nodes WHERE title = 'LogService')
        AND target IN (SELECT id FROM nodes WHERE title = 'logError')
    `).get();

    if (!callsEdge) {
        failures.push("Missing relationship: LogService CALLS logError");
    }

    // Report
    if (failures.length > 0) {
        log.error({ failures }, "❌ E2E Test Failed");
        process.exit(1);
    } else {
        log.info("✅ E2E Test Passed: All symbols and relationships verified.");
    }
}

run();
