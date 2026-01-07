import { PipelineValidator } from "@src/utils/validator";
import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

console.log("🔍 Running Database Validation Check...\n");

const db = DatabaseFactory.connectToResonance(undefined, { readonly: true });

const validator = new PipelineValidator();
validator.captureBaseline(db);

// Set expectations for a "healthy" database
validator.expect({
	min_nodes_added: 0, // We're not adding nodes in this check
	required_vector_coverage: "experience",
});

const report = validator.validate(db);
validator.printReport(report);

db.close();

if (!report.passed) {
	console.log("💡 Tip: Run ingestion pipeline to fix data integrity issues.");
	process.exit(1);
}

console.log("✅ Database validation passed!");
