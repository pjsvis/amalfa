import { appendFileSync, existsSync, promises as fsPromises } from "node:fs";

export class JsonlUtils {
	/**
	 * Append a single record to a JSONL file.
	 * Atomic operation (append-only).
	 */
	static append(path: string, data: unknown): void {
		appendFileSync(path, `${JSON.stringify(data)}\n`, "utf8");
	}

	/**
	 * Append a single record asynchronously.
	 */
	static async appendAsync(path: string, data: unknown): Promise<void> {
		await fsPromises.appendFile(path, `${JSON.stringify(data)}\n`, "utf8");
	}

	/**
	 * Stream a JSONL file line-by-line.
	 */
	static async *stream<T>(path: string): AsyncGenerator<T> {
		if (!existsSync(path)) return;

		const file = Bun.file(path);
		const text = await file.text();

		for (const line of text.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				yield JSON.parse(trimmed) as T;
			} catch (_) {}
		}
	}

	/**
	 * Process a file line-by-line with a callback.
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
	 * WARNING: Only use for strictly small files.
	 */
	static async readAll<T>(path: string): Promise<T[]> {
		const results: T[] = [];
		for await (const item of JsonlUtils.stream<T>(path)) {
			results.push(item);
		}
		return results;
	}
}
