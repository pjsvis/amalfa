import nlp from "compromise";

const text =
	"Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook announced this in San Francisco.";

const doc = nlp(text);

console.log("=== TOKENS WITH POS TAGS ===");
doc.terms().forEach((term: any) => {
	console.log(`${term.text.padEnd(15)} ${term.tags.join(", ")}`);
});

console.log("\n=== NAMED ENTITIES (BUILT-IN) ===");
const people = doc.people().out("array");
const places = doc.places().out("array");
const organizations = doc.organizations().out("array");
const money = doc.money().out("array");
const dates = doc.dates().out("array");
const emails = doc.emails().out("array");
const urls = doc.urls().out("array");
const phoneNumbers = doc.phoneNumbers().out("array");
const hashtags = doc.hashtags().out("array");
const quotations = doc.quotations().out("array");

console.log("People:", people);
console.log("Places:", places);
console.log("Organizations:", organizations);
console.log("Money:", money);
console.log("Dates:", dates);
console.log("Emails:", emails);
console.log("URLs:", urls);
console.log("Phone Numbers:", phoneNumbers);
console.log("Hashtags:", hashtags);
console.log("Quotations:", quotations);

console.log("\n=== PART-OF-SPEECH CATEGORIES ===");
const nouns = doc.nouns().out("array");
const verbs = doc.verbs().out("array");
const adjectives = doc.adjectives().out("array");
const adverbs = doc.adverbs().out("array");

console.log("Nouns:", nouns);
console.log("Verbs:", verbs);
console.log("Adjectives:", adjectives);
console.log("Adverbs:", adverbs);

console.log("\n=== TOPICS (MAIN TERMS) ===");
const topics = doc.topics().out("array");
console.log(topics);

console.log("\n=== CUSTOM ENTITY DEFINITIONS ===");

const customDoc = nlp(
	"Tesla Model 3 and Rivian R1T are electric vehicles. Bitcoin reached $50000.",
);

customDoc.extend({
	words: {
		tesla: "Company",
		rivian: "Company",
		bitcoin: "Cryptocurrency",
	},
	patterns: {
		"model 3": "Product",
		r1t: "Product",
		"electric vehicles": "Category",
	},
});

console.log("Custom Companies:", customDoc.match("#Company").out("array"));
console.log("Custom Products:", customDoc.match("#Product").out("array"));
console.log("Custom Crypto:", customDoc.match("#Cryptocurrency").out("array"));

console.log("\n=== PATTERN MATCHING ===");
const patternDoc = nlp("John bought 5 apples and 3 oranges yesterday.");

console.log("Numbers:", patternDoc.match("#Value").out("array"));
console.log("Past tense verbs:", patternDoc.match("#PastTense").out("array"));
console.log(
	"Person + Verb pattern:",
	patternDoc.match("#Person #Verb").out("array"),
);

console.log("\n=== CUSTOM TAG ADDITION ===");
const tagDoc = nlp("React and Vue are frameworks. Python is a language.");

tagDoc.match("react").tag("Framework");
tagDoc.match("vue").tag("Framework");
tagDoc.match("python").tag("ProgrammingLanguage");

console.log("Frameworks:", tagDoc.match("#Framework").out("array"));
console.log("Languages:", tagDoc.match("#ProgrammingLanguage").out("array"));
