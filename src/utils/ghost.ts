import { createHash } from "node:crypto";
import matter from "gray-matter";
import { execSync } from "node:child_process";

/**
 * Calculates a 'Substance Hash' of a file, ignoring metadata/frontmatter.
 * This is used to detect if the 'meat' of the file has changed.
 */
export function getSubstanceHash(content: string, filePath: string): string {
	const ext = filePath.split(".").pop()?.toLowerCase();

	let substance = content;

	if (ext === "md" || ext === "markdown") {
		try {
			const parsed = matter(content);
			substance = parsed.content.trim();
		} catch (e) {
			// Fallback for malformed frontmatter
			substance = content.trim();
		}
	} else if (ext === "ts" || ext === "js" || ext === "json") {
		// Remove lines containing amalfa_hash (trailing comments or keys)
		substance = content
			.split("\n")
			.filter(
				(line) =>
					!line.includes("amalfa_hash") && !line.includes("git_signature"),
			)
			.join("\n")
			.trim();
	}

	// Normalize newlines for consistency
	substance = substance.replace(/\r\n/g, "\n");

	return createHash("sha256").update(substance).digest("hex");
}

/**
 * Checks if a file has uncommitted changes in the working directory.
 * Returns true if the file is 'dirty' (modified by user and not committed).
 * Returns false if the file matches the Git index (clean).
 */
export function hasGitChanges(filePath: string): boolean {
	try {
		// git diff --quiet returns 1 if changes found, 0 if clean.
		execSync(`git diff --quiet "${filePath}"`, { stdio: "ignore" });
		return false;
	} catch {
		return true;
	}
}

/**
 * Commits a specific file to Git with a given message.
 * Used by the system to 'seal' its own changes.
 */
export function commitFile(filePath: string, message: string): boolean {
	try {
		execSync(`git add "${filePath}"`);
		execSync(`git commit -m "${message}"`);
		return true;
	} catch (e) {
		// It might be that there's nothing to commit if another process beat us to it
		// or if proper config is missing.
		return false;
	}
}
