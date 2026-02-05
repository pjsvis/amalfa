#!/usr/bin/env bun
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3013";
const OUTPUT_DIR = "tests/e2e/output";

function log(msg: string, data?: Record<string, unknown>) {
	console.log("[E2E-Dashboard]", msg, data ? JSON.stringify(data) : "");
}

interface TestResult {
	name: string;
	passed: boolean;
	duration: number;
	error?: string;
}

let browser: any;
let context: any;

async function startDashboard(): Promise<boolean> {
	log("Starting dashboard server...");
	const pidFile = ".amalfa/runtime/dashboard.pid";
	if (existsSync(pidFile)) {
		try {
			const pid = (await Bun.file(pidFile).text()).trim();
			log("Dashboard may already be running", { pid });
		} catch {}
	}
	const proc = Bun.spawn(["bun", "src/cli.ts", "dashboard", "start"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	await new Promise((r) => setTimeout(r, 3000));
	if ((await proc.exited) !== 0) {
		log("Failed to start", { stderr: await new Response(proc.stderr).text() });
		return false;
	}
	log("Dashboard started");
	return true;
}

async function stopDashboard(): Promise<void> {
	log("Stopping dashboard server...");
	Bun.spawn(["bun", "src/cli.ts", "dashboard", "stop"], {
		stdout: "inherit",
		stderr: "inherit",
	});
}

async function initBrowser(): Promise<void> {
	const { chromium } = await import("playwright");
	browser = await chromium.launch({ headless: true, channel: "chromium" });
	context = await browser.newContext();
}

async function closeBrowser(): Promise<void> {
	if (browser) await browser.close();
}

async function runAllTests(): Promise<void> {
	console.log(`\n${"=".repeat(60)}`);
	console.log("AMALFA Dashboard E2E Test Suite");
	console.log(`${"=".repeat(60)}\n`);
	if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
	const results: TestResult[] = [];

	try {
		if (!(await startDashboard())) {
			console.error("Dashboard failed to start");
			process.exit(1);
		}
		await initBrowser();

		const tests = [
			{
				name: "Dashboard loads",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, {
						waitUntil: "networkidle",
						timeout: 30000,
					});
					const title = await page.title();
					if (!title.includes("amalfa")) throw new Error(`Title: ${title}`);
				},
			},
			{
				name: "System health widget",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					const body = await page.evaluate(() => document.body.innerHTML);
					if (!body.includes("ONLINE") && !body.includes("Status"))
						throw new Error("No status");
					if (!body.includes("uptime") && !body.includes("Uptime"))
						throw new Error("No uptime");
				},
			},
			{
				name: "Services table",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					const table = await page.evaluate(
						() => !!document.querySelector("#services-table"),
					);
					const tbody = await page.evaluate(
						() => !!document.querySelector("#services-list"),
					);
					if (!table || !tbody) throw new Error("Table structure missing");
				},
			},
			{
				name: "Graph stats",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					await page.waitForTimeout(3000);
					const body = await page.evaluate(() => document.body.innerHTML);
					if (!body.includes("Nodes")) throw new Error("No Nodes");
					if (!body.includes("Edges")) throw new Error("No Edges");
					if (!body.includes("Vectors")) throw new Error("No Vectors");
				},
			},
			{
				name: "Navigation links",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					const body = await page.evaluate(() => document.body.innerHTML);
					if (!body.includes("SYSTEM")) throw new Error("No SYSTEM");
					if (!body.includes("GRAPH")) throw new Error("No GRAPH");
					if (!body.includes("DOCS")) throw new Error("No DOCS");
				},
			},
			{
				name: "SSE stream updates",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					await page.waitForTimeout(5000);
					const uptime = await page.$eval(
						"#uptime",
						(el: any) => el.textContent,
					);
					if (!uptime || !uptime.includes("s"))
						throw new Error(`Uptime: ${uptime}`);
				},
			},
			{
				name: "No console errors",
				run: async () => {
					const page = await context.newPage();
					const errors: string[] = [];
					page.on("console", (m: any) => {
						if (m.type() === "error") errors.push(m.text());
					});
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					await page.waitForTimeout(3000);
					const critical = errors.filter(
						(e) => !e.includes("favicon") && !e.includes("404"),
					);
					if (critical.length > 0) throw new Error(critical.join("; "));
				},
			},
			{
				name: "Service action buttons",
				run: async () => {
					const page = await context.newPage();
					await page.goto(DASHBOARD_URL, { waitUntil: "networkidle" });
					const body = await page.evaluate(() => document.body.innerHTML);
					if (!body.includes("start") && !body.includes("stop"))
						throw new Error("No buttons");
				},
			},
		];

		for (const t of tests) {
			const start = Date.now();
			let result: TestResult;
			try {
				await t.run();
				result = { name: t.name, passed: true, duration: Date.now() - start };
			} catch (e) {
				result = {
					name: t.name,
					passed: false,
					duration: Date.now() - start,
					error: String(e),
				};
			}
			results.push(result);
			console.log(
				`${result.passed ? "✓" : "✗"} ${result.name.padEnd(30)} ${result.duration}ms`,
			);
			if (!result.passed && result.error)
				console.log(`  Error: ${result.error}`);
		}

		console.log(`\n${"-".repeat(60)}`);
		const passed = results.filter((r) => r.passed).length;
		const failed = results.filter((r) => !r.passed).length;
		console.log(`Results: ${passed} passed, ${failed} failed`);

		if (failed > 0) {
			console.log("\nFailed:");
			for (const r of results) {
				if (!r.passed) console.log(`  - ${r.name}: ${r.error}`);
			}
		}

		writeFileSync(
			join(OUTPUT_DIR, "test-results.json"),
			JSON.stringify(
				{
					timestamp: new Date().toISOString(),
					summary: { passed, failed, total: results.length },
					results,
				},
				null,
				2,
			),
		);

		console.log(`\nResults: ${OUTPUT_DIR}/test-results.json`);
		process.exit(failed > 0 ? 1 : 0);
	} finally {
		await closeBrowser();
		await stopDashboard();
	}
}

runAllTests().catch((e) => {
	console.error(e);
	process.exit(1);
});
