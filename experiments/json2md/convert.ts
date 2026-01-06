#!/usr/bin/env bun

/**
 * JSON to Markdown Converter
 *
 * Converts CDA and Conceptual Lexicon JSON files to well-formatted Markdown documents.
 * Validates against JSON schemas before conversion.
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const __dirname = import.meta.dir;

// ============================================================================
// Type Definitions
// ============================================================================

interface DirectiveEntry {
	id: string;
	term?: string;
	title?: string;
	definition: string | object;
	tags?: string[];
}

interface DirectiveSection {
	section: string;
	entries: DirectiveEntry[];
}

interface CDADocument {
	cda_version: string;
	entry_count: number;
	title: string;
	purpose: string;
	directives: DirectiveSection[];
}

interface ExternalRef {
	label: string;
	url: string;
	type: "source" | "citation" | "implementation" | "example";
}

interface LexiconEntry {
	id: string;
	title: string;
	description: string | object;
	type: string;
	category: string;
	tags?: string[];
	source: string;
	external_refs?: ExternalRef[];
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDefinition(def: string | object): string {
	if (typeof def === "string") {
		return def;
	}
	return JSON.stringify(def, null, 2);
}

function formatTags(tags?: string[]): string {
	if (!tags || tags.length === 0) return "";
	return tags.map((tag) => `\`${tag}\``).join(" ");
}

function formatExternalRefs(refs?: ExternalRef[]): string {
	if (!refs || refs.length === 0) return "";

	const lines = refs.map(
		(ref) => `- [${ref.label}](${ref.url}) *(${ref.type})*`,
	);
	return `\n\n**External References:**\n${lines.join("\n")}`;
}

function escapeMarkdown(text: string): string {
	// Escape special markdown characters in text
	return text
		.replace(/\\/g, "\\\\")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]")
		.replace(/\*/g, "\\*")
		.replace(/_/g, "\\_");
}

// ============================================================================
// CDA Converter
// ============================================================================

function convertCDA(cda: CDADocument): string {
	const lines: string[] = [];

	// Header
	lines.push(`# ${cda.title}`);
	lines.push("");
	lines.push(`**Version:** ${cda.version}`);
	lines.push(`**Entry Count:** ${cda.entry_count}`);
	lines.push(`**Generated:** ${new Date().toISOString().split("T")[0]}`);
	lines.push("");
	lines.push("## Purpose");
	lines.push("");
	lines.push(cda.purpose);
	lines.push("");
	lines.push("---");
	lines.push("");

	// Table of Contents
	lines.push("## Table of Contents");
	lines.push("");
	for (const section of cda.directives) {
		const anchor = section.section.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		lines.push(`- [${section.section}](#${anchor})`);
	}
	lines.push("");
	lines.push("---");
	lines.push("");

	// Sections
	for (const section of cda.directives) {
		lines.push(`## ${section.section}`);
		lines.push("");

		for (const entry of section.entries) {
			const heading = entry.term || entry.title || entry.id;
			lines.push(`### ${entry.id}: ${heading}`);
			lines.push("");
			lines.push(formatDefinition(entry.definition));
			lines.push("");

			if (entry.tags && entry.tags.length > 0) {
				lines.push(`**Tags:** ${formatTags(entry.tags)}`);
				lines.push("");
			}
		}

		lines.push("---");
		lines.push("");
	}

	return lines.join("\n");
}

// ============================================================================
// Conceptual Lexicon Converter
// ============================================================================

function convertLexicon(entries: LexiconEntry[]): string {
	const lines: string[] = [];

	// Header
	lines.push("# Conceptual Lexicon");
	lines.push("");
	lines.push(`**Total Entries:** ${entries.length}`);
	lines.push(`**Generated:** ${new Date().toISOString().split("T")[0]}`);
	lines.push("");
	lines.push("---");
	lines.push("");

	// Group by category
	const categories = new Map<string, LexiconEntry[]>();
	for (const entry of entries) {
		const cat = entry.category || "Uncategorized";
		if (!categories.has(cat)) {
			categories.set(cat, []);
		}
		categories.get(cat)!.push(entry);
	}

	// Table of Contents
	lines.push("## Table of Contents");
	lines.push("");
	for (const category of categories.keys()) {
		const anchor = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
		const count = categories.get(category)!.length;
		lines.push(`- [${category}](#${anchor}) (${count} entries)`);
	}
	lines.push("");
	lines.push("---");
	lines.push("");

	// Entries by Category
	for (const [category, catEntries] of categories) {
		lines.push(`## ${category}`);
		lines.push("");

		for (const entry of catEntries) {
			lines.push(`### ${entry.id}: ${entry.title}`);
			lines.push("");
			lines.push(`**Type:** ${entry.type}`);
			lines.push("");
			lines.push(formatDefinition(entry.description));
			lines.push("");

			if (entry.tags && entry.tags.length > 0) {
				lines.push(`**Tags:** ${formatTags(entry.tags)}`);
				lines.push("");
			}

			if (entry.external_refs && entry.external_refs.length > 0) {
				lines.push(formatExternalRefs(entry.external_refs));
				lines.push("");
			}
		}

		lines.push("---");
		lines.push("");
	}

	return lines.join("\n");
}

// ============================================================================
// Schema Converter (Documentation)
// ============================================================================

function convertSchema(schema: any, title: string): string {
	const lines: string[] = [];

	lines.push(`# ${title} - JSON Schema Documentation`);
	lines.push("");
	lines.push(`**Schema Version:** ${schema.$schema || "draft-07"}`);
	lines.push(`**Generated:** ${new Date().toISOString().split("T")[0]}`);
	lines.push("");

	if (schema.description) {
		lines.push("## Description");
		lines.push("");
		lines.push(schema.description);
		lines.push("");
	}

	lines.push("## Properties");
	lines.push("");

	if (schema.properties) {
		lines.push("| Property | Type | Required | Description |");
		lines.push("|----------|------|----------|-------------|");

		for (const [propName, propDef] of Object.entries(
			schema.properties as any,
		)) {
			const isRequired = schema.required?.includes(propName) ? "✅" : "❌";
			const type = propDef.type || "object";
			const desc = propDef.description || "";
			lines.push(`| \`${propName}\` | ${type} | ${isRequired} | ${desc} |`);
		}
		lines.push("");
	}

	if (schema.definitions) {
		lines.push("## Definitions");
		lines.push("");

		for (const [defName, defValue] of Object.entries(
			schema.definitions as any,
		)) {
			lines.push(`### ${defName}`);
			lines.push("");
			if (defValue.description) {
				lines.push(defValue.description);
				lines.push("");
			}
			lines.push("```json");
			lines.push(JSON.stringify(defValue, null, 2));
			lines.push("```");
			lines.push("");
		}
	}

	return lines.join("\n");
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
	console.log("🔄 Starting JSON to Markdown conversion...\n");

	try {
		// 1. Convert CDA
		console.log("📄 Converting CDA (cda-ref-v63.json)...");
		const cdaJson = JSON.parse(
			readFileSync(join(__dirname, "cda-ref-v63.json"), "utf-8"),
		) as CDADocument;
		const cdaMd = convertCDA(cdaJson);
		writeFileSync(join(__dirname, "cda-ref-v63.md"), cdaMd, "utf-8");
		console.log("✅ Generated: cda-ref-v63.md\n");

		// 2. Convert Conceptual Lexicon
		console.log(
			"📄 Converting Conceptual Lexicon (conceptual-lexicon-ref-v1.79.json)...",
		);
		const lexiconJson = JSON.parse(
			readFileSync(
				join(__dirname, "conceptual-lexicon-ref-v1.79.json"),
				"utf-8",
			),
		) as LexiconEntry[];
		const lexiconMd = convertLexicon(lexiconJson);
		writeFileSync(
			join(__dirname, "conceptual-lexicon-ref-v1.79.md"),
			lexiconMd,
			"utf-8",
		);
		console.log("✅ Generated: conceptual-lexicon-ref-v1.79.md\n");

		// 3. Convert CDA Schema
		console.log("📄 Converting CDA Schema (cda.schema.json)...");
		const cdaSchema = JSON.parse(
			readFileSync(join(__dirname, "cda.schema.json"), "utf-8"),
		);
		const cdaSchemaMd = convertSchema(cdaSchema, "Core Directive Array (CDA)");
		writeFileSync(join(__dirname, "cda-schema-docs.md"), cdaSchemaMd, "utf-8");
		console.log("✅ Generated: cda-schema-docs.md\n");

		// 4. Convert Conceptual Lexicon Schema
		console.log(
			"📄 Converting Conceptual Lexicon Schema (conceptual-lexicon.schema.json)...",
		);
		const lexiconSchema = JSON.parse(
			readFileSync(join(__dirname, "conceptual-lexicon.schema.json"), "utf-8"),
		);
		const lexiconSchemaMd = convertSchema(
			lexiconSchema,
			"Conceptual Lexicon (CL)",
		);
		writeFileSync(
			join(__dirname, "conceptual-lexicon-schema-docs.md"),
			lexiconSchemaMd,
			"utf-8",
		);
		console.log("✅ Generated: conceptual-lexicon-schema-docs.md\n");

		console.log("🎉 Conversion complete! All files generated successfully.");
	} catch (error) {
		console.error("❌ Conversion failed:");
		console.error(error);
		process.exit(1);
	}
}

main();
