#!/usr/bin/env bun

/**
 * Bun v1.3.8 Markdown - Detailed Feature Test
 */

export {};

console.log("🔍 Bun v1.3.8 Markdown Detailed Feature Analysis\n");
console.log("=".repeat(60));

const testCases = [
  {
    name: "Basic Markdown",
    input: `# Title\n\n**Bold** and *italic*`,
    expectHtml: true,
  },
  {
    name: "Code Block",
    input: "```typescript\nconst x = 10;\n```",
    expectHtml: true,
  },
  {
    name: "Table",
    input: "| a | b |\n|---|---|\n| 1 | 2 |",
    expectHtml: true,
  },
];

console.log("\n📋 Testing Bun.markdown methods:\n");

for (const test of testCases) {
  console.log(`\n--- ${test.name} ---`);
  console.log(`Input: ${test.input.replace(/\n/g, "\\n")}`);

  // Test render
  const renderResult = (Bun as any).markdown.render(test.input);
  console.log(`render(): "${renderResult}"`);

  // Test html
  const htmlResult = (Bun as any).markdown.html(test.input);
  console.log(`html(): "${htmlResult}"`);
}

// Performance benchmark
console.log("\n" + "=".repeat(60));
console.log("⚡ Performance Benchmark\n");

const sample = await Bun.file("README.md").text();
const iterations = 100;

console.log(`Document: README.md (${sample.length} chars)`);
console.log(`Iterations: ${iterations}\n`);

const start = performance.now();
for (let i = 0; i < iterations; i++) {
  (Bun as any).markdown.render(sample);
}
const end = performance.now();

console.log(`Total time: ${(end - start).toFixed(2)}ms`);
console.log(`Per render: ${((end - start) / iterations).toFixed(2)}ms`);
console.log(
  `Throughput: ${((iterations / (end - start)) * 1000).toFixed(0)} renders/sec`,
);

// Compare with marked.js if available
console.log("\n📊 Comparison with marked.js:\n");

// Load marked from CDN if available in browser context, but skip here
console.log("Note: marked.js is loaded via CDN in public/docs");
console.log("Cannot benchmark marked.js in Node.js/Bun CLI context");

console.log("\n" + "=".repeat(60));
console.log("✅ Detailed Analysis Complete\n");
