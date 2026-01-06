/**
 * Ingestion Pipeline Observability
 *
 * Tracks metrics at each pipeline stage and verifies against baseline
 * to detect silent failures (e.g., PERSONA graph losing 3,000 edges).
 */

export interface EdgeCounts {
	[type: string]: number;
	total: number;
}

export interface DomainStats {
	nodes: number;
	edges: EdgeCounts;
	vectors: number;
	semantic_tokens?: number;
}

export interface PipelineMetrics {
	persona: DomainStats;
	experience: DomainStats;
}

export interface Baseline {
	version: string;
	last_updated: string;
	description: string;
	persona: {
		nodes: { concepts: number; directives: number; total: number };
		edges: EdgeCounts;
		vectors: number;
		notes: string;
	};
	experience: {
		nodes: {
			debriefs: number;
			playbooks: number;
			documents: number;
			total: number;
		};
		edges: EdgeCounts;
		vectors: number;
		semantic_tokens: number;
		notes: string;
	};
	tolerance: {
		nodes: number;
		edges: number;
		vectors: number;
		description: string;
	};
}

export interface Mismatch {
	domain: string;
	metric: string;
	expected: number;
	actual: number;
	delta: number;
	variance: number;
}

export class IngestionStats {
	private metrics: PipelineMetrics;
	private baseline: Baseline | null = null;

	constructor() {
		this.metrics = {
			persona: {
				nodes: 0,
				edges: { total: 0 },
				vectors: 0,
			},
			experience: {
				nodes: 0,
				edges: { total: 0 },
				vectors: 0,
				semantic_tokens: 0,
			},
		};
	}

	/**
	 * Load baseline from file
	 */
	async loadBaseline(path: string): Promise<void> {
		try {
			const file = Bun.file(path);
			this.baseline = await file.json();
			console.log(`📊 Baseline loaded: v${this.baseline?.version}`);
		} catch (_error) {
			console.warn(
				`⚠️  No baseline found at ${path}. Skipping baseline verification.`,
			);
		}
	}

	/**
	 * Record node creation
	 */
	recordNode(domain: "persona" | "experience"): void {
		this.metrics[domain].nodes++;
	}

	/**
	 * Record edge creation
	 */
	recordEdge(domain: "persona" | "experience", type: string): void {
		if (!this.metrics[domain].edges[type]) {
			this.metrics[domain].edges[type] = 0;
		}
		this.metrics[domain].edges[type]++;
		this.metrics[domain].edges.total++;
	}

	/**
	 * Record vector creation
	 */
	recordVector(domain: "persona" | "experience"): void {
		this.metrics[domain].vectors++;
	}

	/**
	 * Record semantic token extraction
	 */
	recordSemanticTokens(domain: "experience"): void {
		if (this.metrics[domain].semantic_tokens !== undefined) {
			this.metrics[domain].semantic_tokens++;
		}
	}

	/**
	 * Get current metrics
	 */
	getMetrics(): PipelineMetrics {
		return this.metrics;
	}

	/**
	 * Verify against baseline
	 */
	verifyAgainstBaseline(): Mismatch[] {
		if (!this.baseline) {
			console.warn("⚠️  No baseline loaded. Skipping verification.");
			return [];
		}

		const mismatches: Mismatch[] = [];
		const tolerance = this.baseline.tolerance;

		// Verify PERSONA domain
		this.checkMetric(
			mismatches,
			"persona",
			"nodes",
			this.baseline.persona.nodes.total,
			this.metrics.persona.nodes,
			tolerance.nodes,
		);

		this.checkMetric(
			mismatches,
			"persona",
			"edges.total",
			this.baseline.persona.edges.total,
			this.metrics.persona.edges.total,
			tolerance.edges,
		);

		this.checkMetric(
			mismatches,
			"persona",
			"vectors",
			this.baseline.persona.vectors,
			this.metrics.persona.vectors,
			tolerance.vectors,
		);

		// Verify EXPERIENCE domain
		this.checkMetric(
			mismatches,
			"experience",
			"nodes",
			this.baseline.experience.nodes.total,
			this.metrics.experience.nodes,
			tolerance.nodes,
		);

		this.checkMetric(
			mismatches,
			"experience",
			"edges.total",
			this.baseline.experience.edges.total,
			this.metrics.experience.edges.total,
			tolerance.edges,
		);

		this.checkMetric(
			mismatches,
			"experience",
			"vectors",
			this.baseline.experience.vectors,
			this.metrics.experience.vectors,
			tolerance.vectors,
		);

		return mismatches;
	}

	/**
	 * Check a single metric against baseline
	 */
	private checkMetric(
		mismatches: Mismatch[],
		domain: string,
		metric: string,
		expected: number,
		actual: number,
		tolerance: number,
	): void {
		const delta = actual - expected;
		const variance = expected > 0 ? Math.abs(delta) / expected : 0;

		if (variance > tolerance) {
			mismatches.push({
				domain,
				metric,
				expected,
				actual,
				delta,
				variance,
			});
		}
	}

	/**
	 * Print summary report
	 */
	printSummary(): void {
		console.log("\n📊 Ingestion Summary");
		console.log("═".repeat(60));

		console.log("\n🧠 PERSONA Domain:");
		console.log(`   Nodes:   ${this.metrics.persona.nodes}`);
		console.log(`   Edges:   ${this.metrics.persona.edges.total}`);
		console.log(`   Vectors: ${this.metrics.persona.vectors}`);

		console.log("\n📚 EXPERIENCE Domain:");
		console.log(`   Nodes:   ${this.metrics.experience.nodes}`);
		console.log(`   Edges:   ${this.metrics.experience.edges.total}`);
		console.log(`   Vectors: ${this.metrics.experience.vectors}`);
		console.log(`   Tokens:  ${this.metrics.experience.semantic_tokens || 0}`);

		console.log(`\n${"═".repeat(60)}`);
	}

	/**
	 * Print verification results
	 */
	printVerification(mismatches: Mismatch[]): void {
		if (mismatches.length === 0) {
			console.log("\n✅ Baseline Verification: PASSED");
			return;
		}

		console.log("\n❌ Baseline Verification: FAILED");
		console.log("═".repeat(60));
		console.table(
			mismatches.map((m) => ({
				Domain: m.domain,
				Metric: m.metric,
				Expected: m.expected,
				Actual: m.actual,
				Delta: m.delta,
				"Variance %": `${(m.variance * 100).toFixed(1)}%`,
			})),
		);
		console.log("═".repeat(60));
	}

	/**
	 * Generate markdown report
	 */
	async generateReport(outputPath: string): Promise<void> {
		const now = new Date().toISOString().split("T")[0];
		const mismatches = this.verifyAgainstBaseline();

		let report = `# Ingestion Report: ${now}\n\n`;

		// PERSONA Domain
		report += `## PERSONA Domain\n\n`;
		report += `| Metric | Expected | Actual | Status |\n`;
		report += `|--------|----------|--------|--------|\n`;

		if (this.baseline) {
			report += `| Nodes  | ${this.baseline.persona.nodes.total} | ${this.metrics.persona.nodes} | ${this.metrics.persona.nodes === this.baseline.persona.nodes.total ? "✅" : "❌"} |\n`;
			report += `| Edges  | ${this.baseline.persona.edges.total} | ${this.metrics.persona.edges.total} | ${this.metrics.persona.edges.total === this.baseline.persona.edges.total ? "✅" : "❌"} |\n`;
			report += `| Vectors| ${this.baseline.persona.vectors} | ${this.metrics.persona.vectors} | ${this.metrics.persona.vectors === this.baseline.persona.vectors ? "✅" : "❌"} |\n`;
		}

		// EXPERIENCE Domain
		report += `\n## EXPERIENCE Domain\n\n`;
		report += `| Metric | Expected | Actual | Status |\n`;
		report += `|--------|----------|--------|--------|\n`;

		if (this.baseline) {
			report += `| Nodes  | ${this.baseline.experience.nodes.total} | ${this.metrics.experience.nodes} | ${this.metrics.experience.nodes === this.baseline.experience.nodes.total ? "✅" : "❌"} |\n`;
			report += `| Edges  | ${this.baseline.experience.edges.total} | ${this.metrics.experience.edges.total} | ${this.metrics.experience.edges.total === this.baseline.experience.edges.total ? "✅" : "❌"} |\n`;
			report += `| Vectors| ${this.baseline.experience.vectors} | ${this.metrics.experience.vectors} | ${this.metrics.experience.vectors === this.baseline.experience.vectors ? "✅" : "❌"} |\n`;
		}

		// Mismatches
		if (mismatches.length > 0) {
			report += `\n## ⚠️  Baseline Violations\n\n`;
			report += `| Domain | Metric | Expected | Actual | Delta | Variance |\n`;
			report += `|--------|--------|----------|--------|-------|----------|\n`;

			for (const m of mismatches) {
				report += `| ${m.domain} | ${m.metric} | ${m.expected} | ${m.actual} | ${m.delta > 0 ? "+" : ""}${m.delta} | ${(m.variance * 100).toFixed(1)}% |\n`;
			}
		}

		await Bun.write(outputPath, report);
		console.log(`\n📄 Report saved to: ${outputPath}`);
	}
}
