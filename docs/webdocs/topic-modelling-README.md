# topic modelling and latent semantic analysis

- topic modelling: token discovery
- latent semantic analysis: relationships

```typescript
import * as lda from "lda";

// Example: System prompt or text corpus
const documents = [
  "You are a helpful AI assistant.",
  "Always be honest and provide accurate information.",
  "Avoid generating harmful or unethical content.",
  "Be concise unless asked to explain in detail.",
  "Use markdown formatting when appropriate.",
  "Answer questions clearly and politely.",
];

// Tokenize each document into words
const words = documents.map((doc) =>
  doc
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2),
);

// Run LDA
const result = lda(words, 3, 100); // (words, numTopics, numIterations)

// Print topics
result.forEach((topic, topicIndex) => {
  console.log(`Topic ${topicIndex + 1}:`);
  const topTerms = topic
    .slice(0, 4)
    .map((t) => `${t.term} (${t.weight.toFixed(3)})`);
  console.log(topTerms.join(", "));
});
```

- expected output

```text
Topic 1: helpful, assistant, polite, clear
Topic 2: honest, accurate, information, answer
Topic 3: avoid, harmful, unethical, content
```

- remove stop words firt for better results

```typescript
const stopwords = new Set([
  "you",
  "are",
  "the",
  "and",
  "or",
  "is",
  "in",
  "on",
  "at",
  "to",
  "of",
  "be",
  "as",
]);

const filteredWords = (word) => !stopwords.has(word);
const words = documents.map((doc) =>
  doc
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && filteredWords(word)),
);
```

🚀 Next Steps (When You're Ready) Once comfortable, explore:

Clustering with embeddings (e.g., using Sentence-BERT via API or ONNX).
Integrating with Python via pyodide or a backend if you need BERTopic or Gensim.
But for getting started quickly in TypeScript — lda is the simplest and most
effective choice.
