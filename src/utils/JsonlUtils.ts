import { appendFileSync, promises as fsPromises } from "node:fs";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";

export class JsonlUtils {
	/**
	 * Append a single record to a JSONL file.
	 * Atomic operation (append-only).
	 * @param path File path
	 * @param data Data object to stringify
	 */
	static append(path: string, data: unknown): void {
		// Just append the line. If file doesn't exist, it's created.
		// We use synchronous append for atomicity in simple CLI use cases,
		// but async is available via fsPromises if needed.
		appendFileSync(path, `${JSON.stringify(data)}\n`, "utf8");
	}

	/**
	 * Append a single record asynchronously.
	 * @param path File path
	 * @param data Data object
	 */
	static async appendAsync(path: string, data: unknown): Promise<void> {
		await fsPromises.appendFile(path, `${JSON.stringify(data)}\n`, "utf8");
	}

	/**
	 * Stream a JSONL file line-by-line using Bun native streams.
	 * This leverages Bun's optimized file I/O.
	 * @param path File path
	 */
	static async *stream<T>(path: string): AsyncGenerator<T> {
		const file = Bun.file(path);
		if (!(await file.exists())) return;

		// Use Bun's native stream
		const stream = file.stream();

		// Convert Web ReadableStream to Node Readable for readline
		// @ts-expect-error
		const nodeStream = Readable.fromWeb(stream);

		const rl = createInterface({
			input: nodeStream,
			crlfDelay: Number.POSITIVE_INFINITY,
		});

		for await (const line of rl) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				yield JSON.parse(trimmed) as T;
			} catch (_) {}
		}
	}

	/**
	 * Process a file line-by-line with a callback.
	 * @param path File path
	 * @param onLine Callback function
	 */
	static async process<T>(
		path: string,
		onLine: (data: T) => Promise<void> | void,
	): Promise<void> {
		for await (const item of JsonlUtils.stream<T>(path)) {
			await onLine(item);
		}
	}

	/**
	 * Read all records into memory.
	 * WARNING: Only use for strictly small files (e.g. stop-list).
	 * @param path File path
	 */
	static async readAll<T>(path: string): Promise<T[]> {
		const results: T[] = [];
		for await (const item of JsonlUtils.stream<T>(path)) {
			results.push(item);
		}
		return results;
	}
}
