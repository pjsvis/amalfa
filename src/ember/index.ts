import { join } from "node:path";
import type { ResonanceDB } from "@src/resonance/db";
import { LangExtractClient } from "@src/services/LangExtractClient";
import { getLogger } from "@src/utils/Logger";
import { Glob } from "bun";
import { EmberAnalyzer } from "./analyzer";
import { EmberGenerator } from "./generator";
import { EmberSquasher } from "./squasher";
import type { EmberConfig, EmberSidecar } from "./types";

export class EmberService {
  private analyzer: EmberAnalyzer;
  private generator: EmberGenerator;
  private squasher: EmberSquasher;
  private langClient: LangExtractClient;
  private log = getLogger("EmberService");

  constructor(
    db: ResonanceDB,
    private config: EmberConfig,
  ) {
    this.langClient = new LangExtractClient();
    this.analyzer = new EmberAnalyzer(db, this.langClient);
    this.generator = new EmberGenerator();
    this.squasher = new EmberSquasher();
  }

  /**
   * Run a full sweep of all configured sources
   */
  async runFullSweep(dryRun = false) {
    this.log.info("Starting full Ember sweep...");

    const files = await this.discoverFiles();
    let enrichedCount = 0;

    for (const file of files) {
      const content = await Bun.file(file).text();
      const sidecar = await this.analyzer.analyze(file, content);

      if (sidecar) {
        if (dryRun) {
          this.log.info(`[Dry Run] Would generate sidecar for ${file}`);
          console.log(JSON.stringify(sidecar, null, 2));
        } else {
          await this.generator.generate(sidecar);
          enrichedCount++;
        }
      }
    }

    this.log.info(`Sweep complete. Enriched ${enrichedCount} files.`);
    return enrichedCount;
  }

  /**
   * Analyze a single file
   */
  async analyze(filePath: string, content: string) {
    return this.analyzer.analyze(filePath, content);
  }

  /**
   * Generate a sidecar file
   */
  async generate(sidecar: EmberSidecar) {
    return this.generator.generate(sidecar);
  }

  /**
   * Squash all pending sidecars
   */
  async squashAll() {
    this.log.info("Squashing all pending sidecars...");
    let count = 0;

    // Simpler scan:
    const sidecars = await this.findSidecars();
    for (const sidecarPath of sidecars) {
      await this.squasher.squash(sidecarPath);
      count++;
    }

    this.log.info(`Squashed ${count} sidecars.`);
    return count;
  }

  private async findSidecars(): Promise<string[]> {
    const sidecars: string[] = [];
    const glob = new Glob("**/*.ember.json");
    const sources = this.config.sources || ["./docs"];
    // Scan sources
    for (const source of sources) {
      // Assuming source is like "./docs"
      const sourcePath = join(process.cwd(), source);
      for (const file of glob.scanSync({ cwd: sourcePath })) {
        sidecars.push(join(sourcePath, file));
      }
    }
    return sidecars;
  }

  private async discoverFiles(): Promise<string[]> {
    const files: string[] = [];
    const glob = new Glob("**/*.{md,mdx}"); // Only markdown for now
    const sources = this.config.sources || ["./docs"];
    const excludes = this.config.excludePatterns || [];

    for (const source of sources) {
      const sourcePath = join(process.cwd(), source);
      try {
        for (const file of glob.scanSync({ cwd: sourcePath })) {
          const shouldExclude = excludes.some((p) => file.includes(p));
          if (!shouldExclude) {
            files.push(join(sourcePath, file));
          }
        }
      } catch (e) {
        this.log.warn({ source: sourcePath, err: e }, "Failed to scan source");
      }
    }
    return files;
  }
}
