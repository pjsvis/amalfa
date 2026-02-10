import type { Database } from "bun:sqlite";

export interface Baseline {
  nodes: number;
  edges: number;
  vectors: number;
  timestamp: string;
}

export interface Expectation {
  files_to_process?: number;
  min_nodes_added?: number;
  max_errors?: number;
  required_vector_coverage?: "all" | "experience" | "none";
}

export interface ValidationError {
  rule: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationReport {
  passed: boolean;
  baseline: Baseline;
  results: Baseline;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: string;
}

export class PipelineValidator {
  private baseline: Baseline | null = null;
  private expectations: Expectation = {};
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  /**
   * Capture current database state as baseline
   */
  captureBaseline(db: Database): Baseline {
    const nodes = db.query("SELECT COUNT(*) as count FROM nodes").get() as {
      count: number;
    };
    const edges = db.query("SELECT COUNT(*) as count FROM edges").get() as {
      count: number;
    };
    const vectors = db
      .query("SELECT COUNT(*) as count FROM nodes WHERE embedding IS NOT NULL")
      .get() as { count: number };

    this.baseline = {
      nodes: nodes.count,
      edges: edges.count,
      vectors: vectors.count,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Baseline Captured:");
    console.log(`   - Nodes: ${this.baseline.nodes}`);
    console.log(`   - Edges: ${this.baseline.edges}`);
    console.log(`   - Vectors: ${this.baseline.vectors}`);

    return this.baseline;
  }

  /**
   * Set expectations for validation
   */
  expect(expectations: Expectation): this {
    this.expectations = expectations;
    console.log("\n🎯 Expectations Set:");
    if (expectations.files_to_process)
      console.log(`   - Files to process: ${expectations.files_to_process}`);
    if (expectations.min_nodes_added !== undefined)
      console.log(`   - Min nodes to add: ${expectations.min_nodes_added}`);
    if (expectations.max_errors !== undefined)
      console.log(`   - Max errors allowed: ${expectations.max_errors}`);
    if (expectations.required_vector_coverage)
      console.log(
        `   - Vector coverage: ${expectations.required_vector_coverage}`,
      );
    console.log("");

    return this;
  }

  /**
   * Validate current database state against baseline and expectations
   */
  validate(db: Database): ValidationReport {
    if (!this.baseline) {
      throw new Error(
        "No baseline captured. Call captureBaseline() before validate().",
      );
    }

    const results = {
      nodes: (
        db.query("SELECT COUNT(*) as count FROM nodes").get() as {
          count: number;
        }
      ).count,
      edges: (
        db.query("SELECT COUNT(*) as count FROM edges").get() as {
          count: number;
        }
      ).count,
      vectors: (
        db
          .query(
            "SELECT COUNT(*) as count FROM nodes WHERE embedding IS NOT NULL",
          )
          .get() as { count: number }
      ).count,
      timestamp: new Date().toISOString(),
    };

    // Clear previous errors/warnings
    this.errors = [];
    this.warnings = [];

    // Calculate deltas
    const nodesAdded = results.nodes - this.baseline.nodes;
    const edgesAdded = results.edges - this.baseline.edges;
    const vectorsAdded = results.vectors - this.baseline.vectors;

    // Check: Minimum nodes added
    if (
      this.expectations.min_nodes_added !== undefined &&
      nodesAdded < this.expectations.min_nodes_added
    ) {
      this.addError(
        "min_nodes_added",
        `Expected at least ${this.expectations.min_nodes_added} nodes added, got ${nodesAdded}`,
      );
    }

    // Check: Vector coverage
    if (this.expectations.required_vector_coverage === "all") {
      if (results.vectors < results.nodes) {
        this.addError(
          "vector_coverage",
          `Expected vectors for all nodes (${results.nodes}), got ${results.vectors} (${results.nodes - results.vectors} missing)`,
        );
      }
    } else if (this.expectations.required_vector_coverage === "experience") {
      const experienceNodes = db
        .query("SELECT COUNT(*) as count FROM nodes WHERE domain = 'resonance'")
        .get() as { count: number };
      if (results.vectors < experienceNodes.count) {
        this.addWarning(
          "vector_coverage",
          `Expected vectors for all experience nodes (${experienceNodes.count}), got ${results.vectors}`,
        );
      }
    }

    // Check: Orphaned edges (edges pointing to non-existent nodes)
    const orphanedEdges = db
      .query(`
            SELECT COUNT(*) as count FROM edges e
            WHERE NOT EXISTS (SELECT 1 FROM nodes WHERE id = e.source)
               OR NOT EXISTS (SELECT 1 FROM nodes WHERE id = e.target)
        `)
      .get() as { count: number };

    if (orphanedEdges.count > 0) {
      this.addError(
        "orphaned_edges",
        `Found ${orphanedEdges.count} orphaned edges (pointing to non-existent nodes)`,
      );
    }

    // Check: Duplicate node IDs (should be impossible with PRIMARY KEY, but good to verify)
    const duplicateNodes = db
      .query(`
            SELECT id, COUNT(*) as count FROM nodes
            GROUP BY id
            HAVING count > 1
        `)
      .all() as { id: string; count: number }[];

    if (duplicateNodes.length > 0) {
      this.addError(
        "duplicate_nodes",
        `Found ${duplicateNodes.length} duplicate node IDs`,
      );
    }

    // Build report
    const passed = this.errors.length === 0;
    const report: ValidationReport = {
      passed,
      baseline: this.baseline,
      results,
      errors: this.errors,
      warnings: this.warnings,
      summary: this.buildSummary(nodesAdded, edgesAdded, vectorsAdded, passed),
    };

    return report;
  }

  /**
   * Add an error to the validation report
   */
  private addError(rule: string, message: string): void {
    this.errors.push({ rule, message, severity: "error" });
  }

  /**
   * Add a warning to the validation report
   */
  private addWarning(rule: string, message: string): void {
    this.warnings.push({ rule, message, severity: "warning" });
  }

  /**
   * Build summary string
   */
  private buildSummary(
    nodesAdded: number,
    edgesAdded: number,
    vectorsAdded: number,
    passed: boolean,
  ): string {
    const status = passed ? "✅ PASSED" : "❌ FAILED";
    return `${status} | +${nodesAdded} nodes, +${edgesAdded} edges, +${vectorsAdded} vectors`;
  }

  /**
   * Print validation report to console
   */
  printReport(report: ValidationReport): void {
    console.log(`\n${"=".repeat(60)}`);
    console.log("🧪 VALIDATION REPORT");
    console.log("=".repeat(60));
    console.log(report.summary);
    console.log("");

    if (report.warnings.length > 0) {
      console.log("⚠️  WARNINGS:");
      for (const warning of report.warnings) {
        console.log(`   - [${warning.rule}] ${warning.message}`);
      }
      console.log("");
    }

    if (report.errors.length > 0) {
      console.log("❌ ERRORS:");
      for (const error of report.errors) {
        console.log(`   - [${error.rule}] ${error.message}`);
      }
      console.log("");
    }

    console.log("📊 Final State:");
    console.log(`   - Nodes: ${report.results.nodes}`);
    console.log(`   - Edges: ${report.results.edges}`);
    console.log(`   - Vectors: ${report.results.vectors}`);
    console.log(`${"=".repeat(60)}\n`);
  }
}
