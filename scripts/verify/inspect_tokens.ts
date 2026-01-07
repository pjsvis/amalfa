import { DatabaseFactory } from "@/src/resonance/DatabaseFactory";

const db = DatabaseFactory.connectToResonance(undefined, { readonly: true });
const rows = db
	.query(`
    SELECT id, meta 
    FROM nodes 
    LIMIT 20
`)
	.all();

console.log("=== SEMANTIC TOKEN SAMPLE ===");
for (const row of rows as { id: string; meta: string }[]) {
	try {
		const meta = JSON.parse(row.meta);
		if (meta.semantic_tokens) {
			const tokens = meta.semantic_tokens;
			const hasData = Object.values(tokens).some(
				(arr) => Array.isArray(arr) && arr.length > 0,
			);

			if (hasData) {
				console.log(`\n[${row.id}]`);
				console.log(JSON.stringify(tokens, null, 2));
			}
		}
	} catch (_e) {
		// ignore
	}
}
