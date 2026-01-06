import { describe, expect, test } from "bun:test";

// Mocking the parse logic from EnlightenedTriad to test it in isolation
// In a real scenario, we would export the parser or test the class, but this is a quick verify.
function parseOlmoOutput(rawOutput: string) {
	let thoughtTrace = "";
	let finalAnswer = "";

	const thinkMatch = rawOutput.match(/<think>([\s\S]*?)<\/think>/);

	if (thinkMatch) {
		// case 1: structured output
		// biome-ignore lint/style/noNonNullAssertion: Regex match ensures existence
		thoughtTrace = thinkMatch[1]!.trim();
		finalAnswer = rawOutput.replace(thinkMatch[0], "").trim();
	} else if (rawOutput.includes("VERDICT:")) {
		// case 2: implicit separation (fallback)
		const parts = rawOutput.split("VERDICT:");
		thoughtTrace = parts[0]?.trim() ?? "";
		// Reconstruct the verdict part
		finalAnswer = `VERDICT:${parts.slice(1).join("VERDICT:")}`.trim();
	} else {
		// case 3: total failure to structure
		thoughtTrace = rawOutput;
		finalAnswer = "VERDICT: FAIL (Parse Error)";
	}

	const passed = finalAnswer.includes("VERDICT: PASS");

	return { thoughtTrace, finalAnswer, passed };
}

describe("Olmo Output Parsing", () => {
	test("Correctly parses <think> tags", () => {
		const input = "<think> This is a thought. </think> VERDICT: PASS";
		const result = parseOlmoOutput(input);
		expect(result.thoughtTrace).toBe("This is a thought.");
		expect(result.finalAnswer).toBe("VERDICT: PASS");
		expect(result.passed).toBe(true);
	});

	test("Correctly parses fallback VERDICT", () => {
		const input = "This is a thought. VERDICT: PASS";
		const result = parseOlmoOutput(input);
		expect(result.thoughtTrace).toBe("This is a thought.");
		expect(result.finalAnswer).toBe("VERDICT: PASS");
		expect(result.passed).toBe(true);
	});

	test("Correctly handles missing tags and missing VERDICT", () => {
		const input = "Just some rambling text.";
		const result = parseOlmoOutput(input);
		expect(result.thoughtTrace).toBe("Just some rambling text.");
		expect(result.finalAnswer).toBe("VERDICT: FAIL (Parse Error)");
		expect(result.passed).toBe(false);
	});

	test("Correctly handles multiline thoughts", () => {
		const input = `<think>
        Point 1
        Point 2
        </think>
        VERDICT: FAIL`;
		const result = parseOlmoOutput(input);
		expect(result.thoughtTrace).toContain("Point 1");
		expect(result.thoughtTrace).toContain("Point 2");
		expect(result.finalAnswer).toBe("VERDICT: FAIL");
		expect(result.passed).toBe(false);
	});
});
