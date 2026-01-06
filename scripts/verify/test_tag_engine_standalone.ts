import { TagEngine } from "../../src/core/TagEngine";

async function main() {
	console.log("🧪 Testing TagEngine...");
	try {
		const engine = await TagEngine.getInstance();
		console.log("✅ Engine initialized.");

		const text =
			"This is a test abou Artificial Intelligence and Knowledge Graphs.";
		console.log("📝 Generating tags for:", text);

		const tags = await engine.generateTags(text);
		console.log("🏷️  Result:", JSON.stringify(tags, null, 2));
	} catch (e) {
		console.error("❌ Failed:", e);
	}
}

main();
