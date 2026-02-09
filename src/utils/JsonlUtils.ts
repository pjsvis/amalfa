import { appendFileSync, existsSync, promises as fsPromises } from "node:fs";

/**
 * The "to" Wrapper: Converts a promise into a [error, data] tuple.
 * Eliminates try/catch nesting.
 */
export async function to<T, E = Error>(
  promise: Promise<T>,
): Promise<[E, undefined] | [null, T]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (err) {
    return [err as E, undefined];
  }
}

/**
 * Parse a JSONL line with error handling.
 * Returns [error, null] on failure, [null, data] on success.
 */
export async function toJsonl<T>(
  line: string,
): Promise<[null, T] | [Error, null]> {
  if (!line.trim()) {
    return [new Error("Empty line"), null];
  }
  try {
    const data = JSON.parse(line);
    return [null, data as T];
  } catch (err) {
    return [err as Error, null];
  }
}

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
        const [err, data] = await toJsonl<T>(trimmed);
        if (err) {
          console.warn(`⚠️  JSONL parse error: ${err.message}`);
          continue;
        }
        yield data;
      } catch (err) {
        console.warn(`⚠️  JSONL parse error: ${err}`);
      }
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
