import { getSubstanceHash } from "@src/utils/ghost";
import matter from "gray-matter";

console.log("👻 Verifying Ghost Signature Logic...");

const mk1 = `---
title: Test
amalfa_hash: abc
---
Hello World
`;

const mk1_changed_meta = `---
title: Test Changed
tags: [new]
amalfa_hash: xyz
---
Hello World
`;

const mk1_changed_body = `---
title: Test
amalfa_hash: abc
---
Hello World Modified
`;

const h1 = getSubstanceHash(mk1, "test.md");
const h2 = getSubstanceHash(mk1_changed_meta, "test.md");
const h3 = getSubstanceHash(mk1_changed_body, "test.md");

console.log(`Original Hash: ${h1}`);
console.log(`Meta Change Hash: ${h2}`);
console.log(`Body Change Hash: ${h3}`);

if (h1 === h2) {
    console.log("✅ SUCCESS: Metadata change ignored.");
} else {
    console.error("❌ FAILURE: Metadata change affected hash.");
}

if (h1 !== h3) {
    console.log("✅ SUCCESS: Body change detected.");
} else {
    console.error("❌ FAILURE: Body change ignored.");
}

// Git check requires filesystem interaction, skipping for unit test
// But we can verify imports work.
console.log("✅ Verification Complete.");
