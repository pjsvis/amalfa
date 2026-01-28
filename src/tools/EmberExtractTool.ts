import { writeFileSync } from "node:fs";
import { getDbPath } from "@src/cli/utils";
import { SidecarSquasher } from "@src/core/SidecarSquasher";
import { ResonanceDB } from "@src/resonance/db";
import { LangExtractClient } from "@src/services/LangExtractClient";
import type { ToolImplementation } from "@src/types/tools";
import { getLogger } from "@src/utils/Logger";
import { glob } from "glob";

const log = getLogger("EmberExtractTool");

export const EmberExtractTool: ToolImplementation = {
	schema: {
		name: "ember_extract",
		description:
			"Surgically extract symbols and relationships from a specific file or directory using LangExtract (LLM). Use this to populate the knowledge graph with deep code understanding for specific areas. Heavy operation.",
		inputSchema: {
			type: "object",
			properties: {
				path: {
					type: "string",
					description:
						"Relative path to file or directory to analyze (e.g., 'src/core')",
				},
				dry_run: {
					type: "boolean",
					description:
						"If true, only generates sidecars without squashing into DB",
				},
			},
			required: ["path"],
		},
	},
	handler: async (args: { path: string; dry_run?: boolean }) => {
		const targetPath = args.path;
		const isDryRun = args.dry_run || false;

		log.info({ targetPath, isDryRun }, "Starting surgical extraction");

		let files: string[] = [];
		if (await Bun.file(targetPath).exists()) {
			files = [targetPath];
		} else {
			files = await glob(`${targetPath}/**/*.{ts,md}`, {
				ignore: ["**/node_modules/**", "**/dist/**", "**/*.d.ts", "**/test/**"],
			});
		}

		if (files.length === 0) {
			return {
				content: [
					{ type: "text", text: `No suitable files found in ${targetPath}` },
				],
			};
		}

		// 2. Initialize Services
		const dbPath = await getDbPath();
		const db = new ResonanceDB(dbPath);
		const client = new LangExtractClient();
		const squasher = new SidecarSquasher(db);

		// Check sidecar availability
		if (!(await client.isAvailable())) {
			return {
				content: [
					{
						type: "text",
						text: "LangExtract sidecar not available (check python/uv setup)",
					},
				],
				isError: true,
			};
		}

		const results = {
			scanned: 0,
			extracted: 0,
			squashed_nodes: 0,
			squashed_edges: 0,
			errors: 0,
		};

		for (const file of files) {
			results.scanned++;
			try {
				const content = await Bun.file(file).text();

				if (content.length < 50) continue;

				log.debug({ file }, "Extracting...");
				const extracted = await client.extract(content);

				if (!extracted) {
					log.warn({ file }, "Extraction yielded no results");
					continue;
				}

				results.extracted++;

				const sidecar = {
					targetFile: file,
					generatedAt: new Date().toISOString(),
					confidence: 1.0,
					graphData: extracted,
					changes: {
						tags: { add: ["extracted"] },
					},
				};

				const sidecarPath = `${file}.ember.json`;
				writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2));

				if (!isDryRun) {
					const stats = await squasher.squashFile(sidecarPath);
					if (stats) {
						results.squashed_nodes += stats.nodes;
						results.squashed_edges += stats.edges;
					}
				}
			} catch (e) {
				log.error({ file, err: e }, "Extraction failed");
				results.errors++;
			}
		}

		await client.close();
		db.close();

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(results, null, 2),
				},
			],
		};
	},
};
