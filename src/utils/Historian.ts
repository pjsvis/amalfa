/**
 * Historian Protocol
 *
 * Persists agent thought loops and tool interactions to disk.
 * This enables "Recall" (querying past sessions) and debugging.
 *
 * Storage: .amalfa/sessions/session_{uuid}.jsonl
 */

import { randomUUID } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { AMALFA_DIRS, initAmalfaDirs } from "@src/config/defaults";
import { getLogger } from "./Logger";

const log = getLogger("Historian");

export type HistorianEventType = "call" | "result" | "error";

export interface HistorianEvent {
	id: string;
	callId: string;
	sessionId: string;
	timestamp: string;
	type: HistorianEventType;
	tool: string;
	// biome-ignore lint/suspicious/noExplicitAny: generic payload
	payload: any;
	durationMs?: number;
}

export class Historian {
	private sessionId: string;
	private filePath: string;

	constructor() {
		initAmalfaDirs();
		this.sessionId = randomUUID();

		const sessionsDir = join(AMALFA_DIRS.base, "sessions");
		if (!existsSync(sessionsDir)) {
			mkdirSync(sessionsDir, { recursive: true });
		}

		this.filePath = join(sessionsDir, `session_${this.sessionId}.jsonl`);

		log.info(
			{ sessionId: this.sessionId, path: this.filePath },
			"📜 Historian session started",
		);

		this.appendLog({
			id: randomUUID(),
			callId: "system",
			sessionId: this.sessionId,
			timestamp: new Date().toISOString(),
			type: "call",
			tool: "system",
			payload: { event: "session_start" },
		});
	}

	/**
	 * Record a tool call (request)
	 * @returns callId to be used for matching result
	 */
	// biome-ignore lint/suspicious/noExplicitAny: generic args
	recordCall(tool: string, args: any): string {
		const callId = randomUUID();
		this.appendLog({
			id: randomUUID(),
			callId,
			sessionId: this.sessionId,
			timestamp: new Date().toISOString(),
			type: "call",
			tool,
			payload: args,
		});
		return callId;
	}

	recordResult(
		callId: string,
		tool: string,
		// biome-ignore lint/suspicious/noExplicitAny: generic result
		result: any,
		durationMs: number,
	): void {
		this.appendLog({
			id: randomUUID(),
			callId,
			sessionId: this.sessionId,
			timestamp: new Date().toISOString(),
			type: "result",
			tool,
			payload: result,
			durationMs,
		});
	}

	recordError(
		callId: string,
		tool: string,
		// biome-ignore lint/suspicious/noExplicitAny: generic error
		error: any,
		durationMs: number,
	): void {
		this.appendLog({
			id: randomUUID(),
			callId,
			sessionId: this.sessionId,
			timestamp: new Date().toISOString(),
			type: "error",
			tool,
			payload: {
				message: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
			},
			durationMs,
		});
	}

	private appendLog(event: HistorianEvent): void {
		try {
			appendFileSync(this.filePath, `${JSON.stringify(event)}\n`);
		} catch (e) {
			log.error({ err: e }, "Failed to append to history log");
		}
	}
}

let _instance: Historian | null = null;

export function getHistorian(): Historian {
	if (!_instance) {
		_instance = new Historian();
	}
	return _instance;
}
