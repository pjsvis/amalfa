#!/usr/bin/env bun

/**
 * Bun v1.3.8 Markdown - Extended Options Test
 *
 * Investigates: wikiLinks, latexMath, headingIds, autolinkHeadings
 */

export {};

console.log("🔍 Bun v1.3.8 Markdown Extended Options Test\n");
console.log("=".repeat(60));

// Test extended options
const extendedOptions = [
  "wikiLinks",
  "latexMath",
  "headingIds",
  "autolinkHeadings",
  "typographer",
  "linkify",
  "breaks",
  "gfm",
  "table",
  "strikethrough",
];

console.log("\n📋 Checking Bun.markdown API for options...\n");

// Check if Bun.markdown accepts options
const markdownApi = (Bun as any).markdown;

console.log("Bun.markdown properties:");
const props = Object.getOwnPropertyNames(markdownApi);
console.log(props.join(", "));

// Check html function signature
const htmlFn = markdownApi.html;
console.log("\nhtml() function:", htmlFn.toString().slice(0, 200));

// Test with options if supported
console.log("\n" + "=".repeat(60));
console.log("🧪 Testing extended markdown features\n");

// Test wikiLinks: [[Link]]
const wikiLinkMd = "This is a [[WikiLink]] test.";
const wikiResult = markdownApi.html(wikiLinkMd);
console.log(`WikiLinks: "${wikiLinkMd}"`);
console.log(`Result: ${wikiResult}`);

// Test LaTeX: $math$ or $$math$$
const latexMd = "E = mc^2 and $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$";
const latexResult = markdownApi.html(latexMd);
console.log(`\nLaTeX: "${latexMd}"`);
console.log(`Result: ${latexResult}`);

// Test headingIds: ## Heading {#custom-id}
const headingMd = "## Custom Heading {#my-id}";
const headingResult = markdownApi.html(headingMd);
console.log(`\nHeading with ID: "${headingMd}"`);
console.log(`Result: ${headingResult}`);

// Test autolinkHeadings: ## heading becomes link
const autolinkMd = "## Table of Contents";
const autolinkResult = markdownApi.html(autolinkMd);
console.log(`\nAutolink Headings: "${autolinkMd}"`);
console.log(`Result: ${autolinkResult}`);

// Test with our actual project documents
console.log("\n" + "=".repeat(60));
console.log("📄 Testing with Project Documents\n");

const testDocs = [
  "playbooks/briefs-playbook.md",
  "debriefs/2026-02-01-reranking-cleanup-search-verification.md",
];

for (const docPath of testDocs) {
  try {
    const content = await Bun.file(docPath).text();
    console.log(`\n--- ${docPath} ---`);
    console.log(`Size: ${content.length} chars`);

    const html = markdownApi.html(content.slice(0, 500)); // First 500 chars
    console.log(`HTML length: ${html.length} chars`);
    console.log(`Sample: ${html.slice(0, 200)}...`);
  } catch (e) {
    console.log(`Error reading ${docPath}: ${e}`);
  }
}

// Summary
console.log("\n" + "=".repeat(60));
console.log("📊 Extended Options Summary\n");

console.log("Option Support:");
for (const opt of extendedOptions) {
  const supported =
    markdownApi[opt] !== undefined ||
    markdownApi.html?.toString().includes(opt);
  console.log(`  ${opt}: ${supported ? "✅" : "❌ Unknown"}`);
}

console.log("\n📝 Notes:");
console.log("- wikiLinks: [[Link]] syntax - requires plugin or not supported");
console.log("- latexMath: $math$ $$math$$ - requires plugin");
console.log("- headingIds: ## Heading {#id} - requires config");
console.log("- autolinkHeadings: Auto-links H2+ - requires config");

console.log("\n" + "=".repeat(60));
console.log("✅ Extended Options Test Complete\n");
