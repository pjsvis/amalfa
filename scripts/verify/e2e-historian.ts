import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { AMALFA_DIRS } from "../../src/config/defaults";
import { Historian } from "../../src/utils/Historian";

console.log("Testing Historian...");

const historian = new Historian();
const callId = historian.recordCall("test_tool", { foo: "bar" });
historian.recordResult(callId, "test_tool", { result: "baz" }, 100);

const sessionsDir = join(AMALFA_DIRS.base, "sessions");
const files = readdirSync(sessionsDir);
console.log("Sessions:", files);

if (files.length === 0) {
  throw new Error("No session file created");
}

const lastFile = files.sort().pop()!;
const content = readFileSync(join(sessionsDir, lastFile), "utf-8");
console.log("Content:\n", content);

if (!content.includes("test_tool")) {
  throw new Error("Content missing tool name");
}
console.log("✅ Historian Test Passed");
