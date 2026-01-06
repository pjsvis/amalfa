import { marked } from "marked";

const file = Bun.file("scratchpads/dummy-debrief-boxed.md");
const src = await file.text();

const tokens = marked.lexer(src);
console.log(JSON.stringify(tokens, null, 2));
