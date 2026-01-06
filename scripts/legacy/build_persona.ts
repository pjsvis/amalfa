import { Ingestor } from "@src/pipeline/Ingestor";

/**
 * PHASE 1: PERSONA
 * Ingests the Core Ontology (Lexicon) and Directives (CDA).
 */
async function main() {
	console.log("\n\n✨ [BUILD: PERSONA] Starting...\n");
	const ingestor = new Ingestor();
	await ingestor.runPersona();
	console.log("\n✨ [BUILD: PERSONA] Complete.\n");
	process.exit(0);
}

if (import.meta.main) {
	main().catch((e) => {
		console.error("❌ Persona Build Failed:", e);
		process.exit(1);
	});
}
