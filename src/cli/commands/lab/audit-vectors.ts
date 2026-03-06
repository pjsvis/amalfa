import { loadSettings } from "@src/config/defaults";
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import { defineCommand } from "citty";

export const auditVectorsCommand = defineCommand({
  meta: {
    name: "audit-vectors",
    description: "Audit vector coverage grouped by type and domain",
  },
  async run() {
    const db = DatabaseFactory.connectToResonance();

    try {
      console.log("🔍 Auditing Vector Coverage...");

      // 1. Get stats grouped by type/domain
      const rows = db
        .query(`
          SELECT 
              type, 
              domain, 
              COUNT(*) as total, 
              SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as vectorized 
          FROM nodes 
          GROUP BY type, domain
      `)
        .all() as {
        type: string;
        domain: string;
        total: number;
        vectorized: number;
      }[];

      console.log("\n📊 Coverage Report:");
      console.table(
        rows.map((r) => ({
          ...r,
          missing: r.total - r.vectorized,
          coverage: `${Math.round((r.vectorized / r.total) * 100)}%`,
        })),
      );

      // 2. Check strictly against settings sources
      const sources = loadSettings(false).sources;
      console.log("\n📂 Checking Settings Sources:");

      // Assume we check what we have in settings for basic reference
      console.log(`Sources configured: ${Object.keys(sources).length}`);

      // Identify unvectorized types
      const unvectorized = rows.filter((r) => r.vectorized < r.total);
      if (unvectorized.length > 0) {
        console.warn("\n⚠️  Found Unvectorized Content:");
        unvectorized.forEach((r) => {
          console.warn(
            `   - [${r.domain}/${r.type}]: ${r.total - r.vectorized} missing vectors`,
          );
        });
      } else {
        console.info("\n✅ All Content Vectorized!");
      }
    } finally {
      db.close();
    }
  },
});
