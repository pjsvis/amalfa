const lexiconPath = "scripts/fixtures/conceptual-lexicon-ref-v1.79.json";
const file = Bun.file(lexiconPath);
const data = await file.json();

let updated = 0;

const processEntry = (entry: Record<string, unknown>) => {
	if (typeof entry.description === "object" && entry.description !== null) {
		const desc = entry.description as Record<string, unknown>;
		console.log(`Fixing ${entry.id}...`);
		// Naive stringification or extraction.
		// For OH-125 it looks like: { Principle: "...", Modes: [...] }
		// We should probably just JSON.stringify it with indentation or simplify it.
		// Let's just JSON.stringify for now to preserve data, but maybe format it better later if needed.
		// Actually, let's try to make it a readable string if it has "Principle"

		if (desc.Principle) {
			entry.description = `${desc.Principle}`;
		} else {
			entry.description = JSON.stringify(desc);
		}
		updated++;
	}
};

if (Array.isArray(data)) {
	data.forEach(processEntry);
} else if (data.concepts) {
	data.concepts.forEach(processEntry);
}

if (updated > 0) {
	await Bun.write(lexiconPath, JSON.stringify(data, null, 4)); // 4 spaces to match style
	console.log(`Updated ${updated} entries.`);
} else {
	console.log("No entries needed fixing.");
}
