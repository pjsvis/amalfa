import { stat } from "node:fs/promises";
import { loadSettings } from "@src/config/defaults";
import { DatabaseFactory } from "@src/resonance/DatabaseFactory";
import { defineCommand } from "citty";

export const assessDbWeightCommand = defineCommand({
  meta: {
    name: "assess-weight",
    description: "Analyze the database storage weight and content sizes",
  },
  async run() {
    const dbPath = loadSettings(false).database;
    const db = DatabaseFactory.connectToResonance();

    try {
      const stats = await stat(dbPath);

      console.log(`\n📊 DB Storage Analysis`);
      console.log(`   File Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

      const nodeCount = (
        db.query("SELECT COUNT(*) as c FROM nodes").get() as { c: number }
      ).c;
      const contentStats = db
        .query(
          "SELECT SUM(length(meta) + length(title)) as total, AVG(length(meta) + length(title)) as avg FROM nodes",
        )
        .get() as { total: number; avg: number };

      console.log(`   nodes count: ${nodeCount}`);
      console.log(`   Total Content Chars: ${contentStats.total || 0}`);
      console.log(
        `   Avg Content Size: ${Math.round(contentStats.avg || 0)} chars/node`,
      );

      // Vectors
      const vectorCount = (
        db
          .query("SELECT COUNT(*) as c FROM nodes WHERE embedding IS NOT NULL")
          .get() as { c: number }
      ).c;
      const vectorSizeApprox = vectorCount * 1536 * 4; // 1536 dim * 4 bytes

      console.log(`   Vectors Count: ${vectorCount}`);
      console.log(
        `   Approx Vector Data: ${(vectorSizeApprox / 1024 / 1024).toFixed(2)} MB`,
      );

      const textData = contentStats.total || 0;
      const textMB = textData / 1024 / 1024;
      console.log(`   Approx Text Data: ${textMB.toFixed(2)} MB`);

      console.log(`\n🔎 Conclusion:`);
      if (textMB > 10) {
        console.warn("⚠️  Text is becoming heavy.");
      } else {
        console.info("✅ Text is currently lightweight.");
      }
    } catch (e) {
      console.error(`❌ Error accessing DB path ${dbPath}:`, e);
      process.exit(1);
    } finally {
      db.close();
    }
  },
});
