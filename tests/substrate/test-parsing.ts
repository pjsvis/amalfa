#!/usr/bin/env bun
// @ts-nocheck
/**
 * Simple parsing test to isolate the issue
 */

import { z } from "zod";

// Zod Schemas (same as LangExtractClient)
const EntitySchema = z.object({
	name: z.string(),
	type: z.string(),
	description: z.string().optional(),
});

const RelationshipSchema = z.object({
	source: z.string(),
	target: z.string(),
	type: z.string(),
	description: z.string().optional(),
});

const GraphDataSchema = z.object({
	entities: z.array(EntitySchema),
	relationships: z.array(RelationshipSchema),
});

// This is the exact JSON string returned by the substrate
const SUBSTRATE_RESPONSE = `{
  "entities": [
    {
      "name": "Authentication System",
      "type": "System",
      "description": "The overall system designed for user authentication."
    },
    {
      "name": "JWT Tokens",
      "type": "Technology",
      "description": "JSON Web Tokens used for stateless authentication."
    },
    {
      "name": "Stateless Authentication",
      "type": "Concept",
      "description": "The method of authentication employed by the system."
    },
    {
      "name": "AuthController",
      "type": "Component",
      "description": "Handles login and logout endpoints."
    },
    {
      "name": "JWTService",
      "type": "Component",
      "description": "Manages token generation and validation."
    },
    {
      "name": "RefreshTokenRepository",
      "type": "Component",
      "description": "Stores refresh tokens."
    },
    {
      "name": "Refresh Tokens",
      "type": "Concept",
      "description": "Tokens stored in the database for persistence."
    },
    {
      "name": "Database",
      "type": "Storage",
      "description": "Location where refresh tokens are stored."
    },
    {
      "name": "Signed JWT",
      "type": "Data Structure",
      "description": "Generated upon login, containing user ID and role."
    },
    {
      "name": "User",
      "type": "Actor",
      "description": "Entity that initiates the login process."
    }
  ],
  "relationships": [
    {
      "source": "Authentication System",
      "target": "JWT Tokens",
      "type": "USES",
      "description": "The system relies on JWT tokens for authentication."
    },
    {
      "source": "JWT Tokens",
      "target": "Stateless Authentication",
      "type": "ENABLES",
      "description": "JWT tokens enable stateless authentication."
    },
    {
      "source": "AuthController",
      "target": "User",
      "type": "INTERACTS_WITH",
      "description": "Handles login/logout endpoints for the user."
    },
    {
      "source": "JWTService",
      "target": "Signed JWT",
      "type": "GENERATES",
      "description": "JWTService is responsible for generating the signed JWT upon login."
    },
    {
      "source": "JWTService",
      "target": "JWT Tokens",
      "type": "VALIDATES",
      "description": "JWTService manages the validation of tokens."
    },
    {
      "source": "RefreshTokenRepository",
      "target": "Refresh Tokens",
      "type": "STORES",
      "description": "The repository component manages storage of refresh tokens."
    },
    {
      "source": "RefreshTokenRepository",
      "target": "Database",
      "type": "PERSISTS_TO",
      "description": "The repository stores data within the database."
    },
    {
      "source": "Signed JWT",
      "target": "User",
      "type": "CONTAINS_ATTRIBUTES_OF",
      "description": "The signed JWT contains the user ID and role."
    }
  ]
}`;

console.log("🧪 Parsing Test");
console.log("=".repeat(80));
console.log("");

// Step 1: Parse the JSON
console.log("Step 1: Parsing JSON string...");
let parsed: unknown;
try {
	parsed = JSON.parse(SUBSTRATE_RESPONSE);
	console.log("✅ JSON parsed successfully");
	console.log(`   Type: ${typeof parsed}`);
	console.log(`   Keys: ${Object.keys(parsed as object).join(", ")}`);
	console.log("");
} catch (error) {
	console.error("❌ JSON parsing failed:", error);
	process.exit(1);
}

// Step 2: Check structure
console.log("Step 2: Checking structure...");
const parsedObj = parsed as Record<string, unknown>;
console.log(`   Has 'entities': ${"entities" in parsedObj}`);
console.log(`   Has 'relationships': ${"relationships" in parsedObj}`);
console.log(`   entities type: ${typeof parsedObj.entities}`);
console.log(`   relationships type: ${typeof parsedObj.relationships}`);
console.log(`   entities is array: ${Array.isArray(parsedObj.entities)}`);
console.log(
	`   relationships is array: ${Array.isArray(parsedObj.relationships)}`,
);
console.log("");

// Step 3: Validate with Zod
console.log("Step 3: Validating with Zod schema...");
try {
	const result = GraphDataSchema.parse(parsed);
	console.log("✅ Zod validation passed");
	console.log(`   Entities: ${result.entities.length}`);
	console.log(`   Relationships: ${result.relationships.length}`);
	console.log("");
} catch (error) {
	console.error("❌ Zod validation failed:");
	if (error instanceof z.ZodError) {
		console.error("   Errors:");
		for (const issue of error.issues) {
			console.error(`     - ${issue.path.join(".")}: ${issue.message}`);
			console.error(
				`       Expected: ${issue.expected}, Received: ${issue.received}`,
			);
		}
	} else {
		console.error("   ", error);
	}
	process.exit(1);
}

console.log("✅ All tests passed!");
