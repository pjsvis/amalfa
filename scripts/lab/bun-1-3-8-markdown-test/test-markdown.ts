#!/usr/bin/env bun

/**
 * Bun v1.3.8 Markdown Rendering Capability Test
 *
 * Tests Bun's built-in markdown rendering capabilities
 * to determine suitability for public/docs markdown browser.
 */

import { inspect } from "node:util";

console.log("🧪 Bun v1.3.8 Markdown Rendering Capability Test\n");
console.log("=".repeat(60));

// Check Bun version and markdown capabilities
console.log(`\n📦 Bun Version: ${Bun.version}`);
console.log(
  `🧬 Bun Hash: ${typeof Bun.hash === "function" ? "available" : "N/A"}`,
);

// Check for Bun's markdown API
console.log("\n🔍 Checking for Bun markdown API...\n");

// Bun 1.3.x may have Bun.markdown or similar
const markdownApi = (Bun as any).markdown;
const hasMarkdownApi =
  typeof markdownApi === "object" || typeof markdownApi === "function";

console.log(`Bun.markdown exists: ${hasMarkdownApi}`);

if (hasMarkdownApi) {
  console.log("\n📋 Bun.markdown API Details:");
  console.log(inspect(markdownApi, { depth: 3, colors: true }));
}

// Test 1: Try Bun.markdown.render or similar
console.log("\n" + "=".repeat(60));
console.log("🧪 Test 1: Markdown Rendering\n");

const testMarkdown = `# Test Document

## Headings

# H1 Heading
## H2 Heading
### H3 Heading

## Text Formatting

**Bold text**, *italic text*, ~~strikethrough~~

## Lists

- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2

## Code

\`\`\`typescript
function hello(): string {
  return "Hello, World!";
}
\`\`\`

Inline code: \`const x = 10\`

## Links

[OpenAI](https://openai.com)

## Blockquote

> This is a blockquote
> with multiple lines

## Table

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;

let renderResult: string | null = null;
let renderError: Error | null = null;

// Try various Bun markdown APIs
try {
  // Bun 1.3.x may have Bun.markdown.render()
  if ((Bun as any).markdown?.render) {
    console.log("✅ Found Bun.markdown.render()");
    renderResult = (Bun as any).markdown.render(testMarkdown);
  } else if ((Bun as any).markdown?.toHTML) {
    console.log("✅ Found Bun.markdown.toHTML()");
    renderResult = (Bun as any).markdown.toHTML(testMarkdown);
  } else if (typeof (Bun as any).markdown === "function") {
    console.log("✅ Bun.markdown is a function, trying direct call");
    renderResult = (Bun as any).markdown(testMarkdown);
  }
} catch (e) {
  renderError = e as Error;
  console.log(`❌ Error: ${renderError.message}`);
}

// Also try globalThis.BUN_MARKDOWN or similar
if (!renderResult) {
  try {
    const globalMarkdown = (globalThis as any).BUN_MARKDOWN;
    if (globalMarkdown?.render) {
      console.log("✅ Found BUN_MARKDOWN global");
      renderResult = globalMarkdown.render(testMarkdown);
    }
  } catch (e) {
    // Ignore
  }
}

if (renderResult) {
  console.log("\n✅ Markdown rendered successfully!");
  console.log("\n📄 Rendered HTML (first 500 chars):");
  console.log("-".repeat(40));
  console.log(renderResult.slice(0, 500));
  console.log("-".repeat(40));
} else {
  console.log("\n❌ No Bun markdown rendering API found");
  console.log("\n📝 Current alternatives in public/docs:");
  console.log("   - marked.js (currently in use)");
  console.log("   - Need to verify Bun 1.3.8 markdown features");
}

// Test 2: Check if Bun has text encoding/decoding for markdown
console.log("\n" + "=".repeat(60));
console.log("🧪 Test 2: Text Processing APIs\n");

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

console.log("✅ TextEncoder/TextDecoder: Available");
console.log(`   Can encode: ${textEncoder.encode("test").length} bytes`);

// Check for Bun-specific text utilities
const bunUtils = Bun as any;
console.log("\n📋 Bun-specific text utilities:");
console.log(`   Bun.arrayBuffer: ${typeof bunUtils.arrayBuffer}`);
console.log(`   Bun.string: ${typeof bunUtils.string}`);

// Test 3: Performance comparison preparation
console.log("\n" + "=".repeat(60));
console.log("🧪 Test 3: Performance Preparation\n");

const iterations = 1000;
const largeMarkdown = `# Large Document

This is a test document with ${iterations} paragraphs.

${Array(iterations).fill("## Section\n\nSome content here.\n").join("")}

## Conclusion

End of test document.
`;

console.log(`Test document size: ${largeMarkdown.length} chars`);
console.log(`Iterations for benchmark: ${iterations}`);

// Quick benchmark
const startTime = performance.now();
for (let i = 0; i < iterations; i++) {
  if (renderResult) {
    // Just measure string operations if Bun markdown not available
    const temp = testMarkdown.length;
  }
}
const endTime = performance.now();

console.log(`Baseline benchmark: ${(endTime - startTime).toFixed(2)}ms`);

// Test 4: Check for any markdown-related npm packages
console.log("\n" + "=".repeat(60));
console.log("🧪 Test 4: Package.json Markdown Dependencies\n");

const packageJson = await Bun.file("package.json").json();
const markdownDeps = Object.keys(packageJson.dependencies || {})
  .concat(Object.keys(packageJson.devDependencies || []))
  .filter(
    (dep: string) =>
      dep.includes("markdown") ||
      dep.includes("marked") ||
      dep.includes("remark") ||
      dep.includes("rehype"),
  );

if (markdownDeps.length > 0) {
  console.log("📦 Current markdown dependencies:");
  markdownDeps.forEach((dep: string) => {
    console.log(
      `   - ${dep}: ${packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]}`,
    );
  });
} else {
  console.log("📦 No markdown-specific dependencies found");
  console.log("   (public/docs uses marked.js via CDN)");
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Test Summary\n");

console.log(`Bun Version: ${Bun.version}`);
console.log(
  `Markdown API Available: ${renderResult ? "Yes" : "No (needs investigation)"}`,
);
console.log(`Current Renderer: marked.js (CDN)`);

console.log("\n📝 Next Steps:");
console.log("1. Verify Bun 1.3.8 release notes for markdown features");
console.log("2. Check if Bun.markdown is behind a flag or requires import");
console.log("3. Compare rendered output quality vs marked.js");
console.log("4. Benchmark actual markdown rendering performance");
console.log("5. Assess integration complexity with public/docs");

console.log("\n" + "=".repeat(60));
console.log("✅ Test Complete\n");
