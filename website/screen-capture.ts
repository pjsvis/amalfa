#!/usr/bin/env bun

import { execSync } from "child_process";

interface ScreenElement {
  type: string;
  id?: string;
  class?: string;
  text: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
}

interface ScreenState {
  url: string;
  timestamp: string;
  viewport: { width: number; height: number };
  elements: ScreenElement[];
  textContent: string;
  rawHtml: string;
}

export async function captureScreen(url: string = "http://localhost:8888/terminal-test.html"): Promise<ScreenState> {
  const timestamp = new Date().toISOString();
  
  try {
    const response = await fetch(url);
    const rawHtml = await response.text();
    
    const elements: ScreenElement[] = [];
    let position = 0;
    
    const navMatch = rawHtml.match(/<nav[^>]*>([\s\S]*?)<\/nav>/);
    if (navMatch && navMatch[1]) {
      elements.push({
        type: "navigation",
        text: stripHtml(navMatch[1]).slice(0, 200),
        position: { x: 0, y: 0 },
        dimensions: { width: 80, height: 3 }
      });
    }
    
    const boxPattern = /<div class="box"[^>]*>([\s\S]*?)<\/div>/g;
    let match: RegExpExecArray | null;
    
    while ((match = boxPattern.exec(rawHtml)) !== null) {
      const boxContent = match[1];
      if (!boxContent) continue;
      
      const headerMatch = boxContent.match(/<div class="box-header"[^>]*>([\s\S]*?)<\/div>/);
      
      elements.push({
        type: "content-box",
        text: stripHtml(boxContent).slice(0, 500),
        position: { x: 0, y: position },
        dimensions: { width: 80, height: 20 }
      });
      
      if (headerMatch && headerMatch[1]) {
        elements.push({
          type: "box-header",
          text: stripHtml(headerMatch[1]),
          position: { x: 0, y: position },
          dimensions: { width: 80, height: 1 }
        });
      }
      
      position += 20;
    }
    
    const footerMatch = rawHtml.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
    if (footerMatch && footerMatch[1]) {
      elements.push({
        type: "footer",
        text: stripHtml(footerMatch[1]),
        position: { x: 0, y: position },
        dimensions: { width: 80, height: 2 }
      });
    }
    
    const textContent = extractVisibleText(rawHtml);
    
    return {
      url,
      timestamp,
      viewport: { width: 80, height: 24 },
      elements,
      textContent,
      rawHtml: rawHtml.slice(0, 2000)
    };
    
  } catch (error) {
    console.error("Screen capture failed:", error);
    return {
      url,
      timestamp,
      viewport: { width: 0, height: 0 },
      elements: [],
      textContent: "Error: Could not capture screen",
      rawHtml: ""
    };
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractVisibleText(html: string): string {
  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  const textElements: string[] = [];
  
  const headers = cleaned.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/g);
  for (const match of headers) {
    const content = match[1];
    if (content) {
      textElements.push(`[HEADER] ${stripHtml(content)}`);
    }
  }
  
  const paragraphs = cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g);
  for (const match of paragraphs) {
    const content = match[1];
    if (content) {
      const stripped = stripHtml(content);
      if (stripped.length > 10) {
        textElements.push(`[TEXT] ${stripped.slice(0, 200)}`);
      }
    }
  }
  
  const lists = cleaned.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g);
  for (const match of lists) {
    const content = match[1];
    if (content) {
      textElements.push(`[ITEM] ${stripHtml(content).slice(0, 100)}`);
    }
  }
  
  const codeBlocks = cleaned.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g);
  for (const match of codeBlocks) {
    const content = match[1];
    if (content) {
      textElements.push(`[CODE] ${stripHtml(content).slice(0, 300)}`);
    }
  }
  
  const tables = cleaned.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/g);
  for (const match of tables) {
    const content = match[1];
    if (content) {
      textElements.push(`[TABLE] ${stripHtml(content).slice(0, 400)}`);
    }
  }
  
  return textElements.join('\n');
}

export function generateScreenTextRepresentation(state: ScreenState): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(80));
  lines.push(`SCREEN CAPTURE: ${state.url}`);
  lines.push(`Timestamp: ${state.timestamp}`);
  lines.push("═".repeat(80));
  lines.push("");
  
  const navElement = state.elements.find(e => e.type === "navigation");
  if (navElement) {
    lines.push("┌─ HEADER ─────────────────────────────────────────────────────────────────────┐");
    lines.push(`│ ${navElement.text.slice(0, 76).padEnd(76)} │`);
    lines.push("└──────────────────────────────────────────────────────────────────────────────┘");
    lines.push("");
  }
  
  const contentBoxes = state.elements.filter(e => e.type === "content-box");
  for (let i = 0; i < contentBoxes.length; i++) {
    const box = contentBoxes[i];
    if (!box) continue;
    
    const header = state.elements.find(e => 
      e.type === "box-header" && 
      Math.abs(e.position.y - box.position.y) < 5
    );
    
    lines.push(`┌─ ${header ? header.text : `BOX ${i + 1}`} ─${"─".repeat(60)}┐`);
    
    const textLines = box.text.split('\n').slice(0, 15);
    for (const line of textLines) {
      const cleanLine = line.slice(0, 76).replace(/\s+/g, ' ');
      lines.push(`│ ${cleanLine.padEnd(76)} │`);
    }
    
    lines.push("└──────────────────────────────────────────────────────────────────────────────┘");
    lines.push("");
  }
  
  const footer = state.elements.find(e => e.type === "footer");
  if (footer) {
    lines.push("─".repeat(80));
    lines.push(footer.text.slice(0, 78).padEnd(78));
    lines.push("─".repeat(80));
  }
  
  return lines.join('\n');
}

export function analyzeScreenContent(state: ScreenState): {
  summary: string;
  keyElements: string[];
  issues: string[];
} {
  const keyElements: string[] = [];
  const issues: string[] = [];
  
  state.elements.forEach(el => {
    if (el.type === "content-box" && el.text.length > 100) {
      keyElements.push(`Content box: "${el.text.slice(0, 50)}..."`);
    }
    if (el.type === "box-header") {
      keyElements.push(`Header: "${el.text}"`);
    }
  });
  
  if (state.elements.length === 0) {
    issues.push("No elements detected - page may not be rendering correctly");
  }
  
  if (state.textContent.length < 100) {
    issues.push("Minimal text content detected");
  }
  
  const summary = `Screen capture shows ${state.elements.length} elements with ${state.textContent.length} characters of text content.`;
  
  return { summary, keyElements, issues };
}

export function findElementByReference(
  state: ScreenState, 
  userReference: string
): ScreenElement | null {
  const normalizedRef = userReference.toLowerCase();
  
  for (const element of state.elements) {
    if (element.text.toLowerCase().includes(normalizedRef)) {
      return element;
    }
  }
  
  const words = normalizedRef.split(' ').filter(w => w.length > 3);
  for (const word of words) {
    for (const element of state.elements) {
      if (element.text.toLowerCase().includes(word)) {
        return element;
      }
    }
  }
  
  return null;
}

if (import.meta.main) {
  console.log("🖥️  Screen Capture Module\n");
  console.log("Usage:");
  console.log("  bun run screen-capture.ts [url]");
  console.log("  bun run screen-capture.ts --analyze");
  console.log("  bun run screen-capture.ts --text");
  console.log("\nExamples:");
  console.log("  bun run screen-capture.ts http://localhost:8888/terminal-test.html");
  console.log("  bun run screen-capture.ts --text  # Output text representation");
  console.log("\nThis module allows AI to 'see' the screen and understand");
  console.log("what users are referring to when they mention elements.\n");
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === "--help") {
    process.exit(0);
  }
  
  if (command === "--text") {
    const url = args[1] || "http://localhost:8888/terminal-test.html";
    const state = await captureScreen(url);
    const textRep = generateScreenTextRepresentation(state);
    console.log(textRep);
  } else if (command === "--analyze") {
    const url = args[1] || "http://localhost:8888/terminal-test.html";
    const state = await captureScreen(url);
    const analysis = analyzeScreenContent(state);
    
    console.log("📊 Screen Analysis\n");
    console.log(analysis.summary);
    console.log("\n🔑 Key Elements:");
    analysis.keyElements.forEach(el => console.log(`  • ${el}`));
    
    if (analysis.issues.length > 0) {
      console.log("\n⚠️  Issues:");
      analysis.issues.forEach(issue => console.log(`  • ${issue}`));
    }
  } else if (command.startsWith("http")) {
    const state = await captureScreen(command);
    const analysis = analyzeScreenContent(state);
    
    console.log("✅ Screen captured successfully!");
    console.log(`\n${analysis.summary}`);
    console.log(`\nElements found: ${state.elements.length}`);
    console.log(`Text content: ${state.textContent.length} chars`);
    
    const outputFile = `/tmp/screen-capture-${Date.now()}.json`;
    await Bun.write(outputFile, JSON.stringify(state, null, 2));
    console.log(`\n💾 Full capture saved to: ${outputFile}`);
  } else {
    console.log("Unknown command. Use --help for usage information.");
    process.exit(1);
  }
}

export { captureScreen as default };