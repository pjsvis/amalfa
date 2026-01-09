import type { Config } from "drizzle-kit";

export default {
	schema: "./src/resonance/drizzle/schema.ts",
	out: "./src/resonance/drizzle/migrations",
	dialect: "sqlite",
	dbCredentials: {
		url: ".amalfa/resonance.db",
	},
} satisfies Config;
