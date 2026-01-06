import fs from "node:fs";
import { glob } from "glob";

// CONFIGURATION
const PATTERNS = [
	// Backgrounds
	{
		regex:
			/bg-(gray|white|black|slate|zinc|neutral|stone|red|blue|green)-[0-9]+/g,
		message:
			"Avoid hardcoded background colors. Use semantic variables like bg-[var(--surface-1)].",
	},
	{
		regex: /bg-(white|black)(?![a-zA-Z0-9-])/g, // Exact match, not bg-black/50
		message:
			"Avoid hardcoded background colors. Use semantic variables like bg-[var(--surface-1)].",
	},
	// Text
	{
		regex:
			/text-(gray|white|black|slate|zinc|neutral|stone|red|blue|green)-[0-9]+/g,
		message:
			"Avoid hardcoded text colors. Use semantic variables like text-[var(--text-1)].",
	},
	{
		regex: /text-(white|black)(?![a-zA-Z0-9-])/g,
		message:
			"Avoid hardcoded text colors. Use semantic variables like text-[var(--text-1)].",
	},
];

const IGNORE = [
	"node_modules/**",
	".git/**",
	"dist/**",
	"public/sigma-explorer/js/**", // Ignore vendor/minified files
];

async function scan() {
	console.log("🎨 Scanning for Hardcoded Colors...");

	const files = await glob("**/*.{html,js,ts,jsx,tsx}", { ignore: IGNORE });
	let errorCount = 0;

	for (const file of files) {
		const content = fs.readFileSync(file, "utf-8");
		const lines = content.split("\n");

		lines.forEach((line, index) => {
			PATTERNS.forEach(({ regex, message }) => {
				// Reset stateful regex
				const re = new RegExp(regex);
				const match = re.exec(line);
				if (match) {
					console.error(`\n❌ ${file}:${index + 1}`);
					console.error(`   Match: "${match[0]}"`);
					console.error(`   Issue: ${message}`);
					console.error(`   Line:  ${line.trim().substring(0, 80)}...`);
					errorCount++;
				}
			});
		});
	}

	if (errorCount > 0) {
		console.log(`\nFound ${errorCount} styling violations.`);
		process.exit(1);
	} else {
		console.log("\n✅ No hardcoded colors found. Theme safety verified.");
	}
}

scan();
