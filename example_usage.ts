// example_usage.ts
import { EnlightenedProvider } from "./src/llm/EnlightenedProvider";

async function main() {
	// 1. Initialize the Accountant
	const hume = new EnlightenedProvider({ port: 8083 });

	// 2. Check Pulse
	if (!(await hume.isOnline())) {
		console.error(
			"⚠️  The Enlightenment Server is offline. Run the Golden Command.",
		);
		return;
	}

	console.log("🟢 Enlightenment Engine Online.\n");

	// 3. Scenario A: The Logic Check
	console.log("--- TEST A: LOGIC ---");
	const logicResponse = await hume.think([
		{ role: "system", content: "You are a skeptical logician." },
		{
			role: "user",
			content:
				"I walked under a ladder and then tripped. Did the ladder cause me to trip?",
		},
	]);
	console.log(`Result: ${logicResponse}\n`);

	// 4. Scenario B: The "De-Fluff" Tool
	console.log("--- TEST B: DE-FLUFFING ---");
	const corporateJargon =
		"We need to leverage our core competencies to shift the paradigm and boil the ocean.";
	const cleanText = await hume.defluff(corporateJargon);
	console.log(`Original: "${corporateJargon}"`);
	console.log(`Cleaned:  "${cleanText}"`);
}

main();
