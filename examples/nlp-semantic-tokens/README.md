# NLP Semantic Token Identification Examples

## Overview
Examples demonstrating semantic token identification in documents using Python and TypeScript.

## Python Libraries

### 1. spaCy (Recommended)
**File:** `python_spacy_example.py`

**Features:**
- Fast and production-ready
- Part-of-speech tagging
- Named entity recognition (NER)
- Dependency parsing
- Semantic similarity
- Noun chunk extraction

**Installation:**
```bash
pip install spacy
python -m spacy download en_core_web_sm
```

**Pros for TypeScript conversion:**
- Clear API structure
- Object-oriented design
- Easy to replicate patterns

### 2. NLTK
**File:** `python_nltk_example.py`

**Features:**
- Sentence/word tokenization
- POS tagging
- Named entity recognition
- WordNet semantic relations
- Extensive linguistic resources

**Installation:**
```bash
pip install nltk
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger'); nltk.download('maxent_ne_chunker'); nltk.download('words'); nltk.download('wordnet')"
```

## TypeScript Libraries

### 1. Compromise (Easiest Migration)
**File:** `typescript_compromise_example.ts`

**Features:**
- Lightweight, client-side NLP
- No external dependencies
- POS tagging
- Named entity extraction
- Simple API similar to spaCy

**Installation:**
```bash
npm install compromise
```

**Best for:** Converting spaCy code patterns

### 2. Transformers.js (Most Powerful)
**File:** `typescript_transformers_example.ts`

**Features:**
- State-of-the-art transformer models
- Named entity recognition
- Sentiment analysis
- Zero-shot classification
- Embeddings/feature extraction
- Runs in browser or Node.js

**Installation:**
```bash
npm install @xenova/transformers
```

**Important Notes:**
- **NOT an LLM:** Uses pre-trained encoder models (BERT, DistilBERT), not generative LLMs like GPT
- **Model Size:** 100-500MB per model (vs 7GB+ for LLMs)
- **Purpose:** Task-specific (classification, NER, embeddings) not text generation
- **Performance:** Fast inference after initial model download
- **Offline:** Models download once and cache locally
- **First Run:** Initial download takes time, subsequent runs are fast

**Best for:** Advanced semantic analysis, embeddings, production-grade NER

## Compromise Categories

### Built-in Entity Types
Compromise supports many categories out-of-the-box:

**Named Entities:**
- `.people()` - Person names
- `.places()` - Locations, cities, countries
- `.organizations()` - Companies, institutions
- `.dates()` - Temporal expressions
- `.money()` - Currency amounts
- `.emails()` - Email addresses
- `.urls()` - Web URLs
- `.phoneNumbers()` - Phone numbers
- `.hashtags()` - Social media hashtags
- `.quotations()` - Quoted text

**Part-of-Speech:**
- `.nouns()` - All nouns
- `.verbs()` - All verbs
- `.adjectives()` - Descriptive words
- `.adverbs()` - Manner/degree words
- `.pronouns()` - I, you, he, she, etc.
- `.conjunctions()` - and, or, but
- `.prepositions()` - in, on, at

**Other:**
- `.topics()` - Main terms/concepts
- `.numbers()` - Numeric values
- `.percentages()` - Percentage values

### Custom Entity Definitions

**Method 1: Extend with word lists**
```typescript
doc.extend({
  words: {
    'tesla': 'Company',
    'bitcoin': 'Cryptocurrency'
  }
});
```

**Method 2: Pattern matching**
```typescript
doc.extend({
  patterns: {
    'model 3': 'Product',
    'electric vehicles': 'Category'
  }
});
```

**Method 3: Dynamic tagging**
```typescript
doc.match('react').tag('Framework');
doc.match('#Framework').out('array');
```

**Method 4: Match syntax patterns**
```typescript
doc.match('#Person #Verb #Noun');
doc.match('#Adjective+ #Noun');
doc.match('[bought|purchased] #Value #Noun');
```

### Tag Hierarchy
Compromise uses hierarchical tags:
- `Person` → `ProperNoun` → `Noun`
- `FirstName` → `Person` → `ProperNoun` → `Noun`
- `City` → `Place` → `ProperNoun` → `Noun`

When you match `#Noun`, it includes all subtypes.

## Conversion Strategy: Python → TypeScript

### Pattern Mapping

| Python (spaCy) | TypeScript (Compromise) | TypeScript (Transformers.js) |
|----------------|-------------------------|------------------------------|
| `nlp(text)` | `nlp(text)` | `await pipeline(task, model)` |
| `doc.ents` | `doc.people()`, `doc.places()` | `await ner(text)` |
| `token.pos_` | `term.tags` | N/A (use compromise) |
| `doc.similarity()` | N/A | `await extractor(text)` + cosine |
| `doc.noun_chunks` | `doc.nouns()` | N/A (use compromise) |

### Example Conversion

**Python (spaCy):**
```python
doc = nlp(text)
for ent in doc.ents:
    print(ent.text, ent.label_)
```

**TypeScript (Compromise):**
```typescript
const doc = nlp(text);
const people = doc.people().out('array');
const places = doc.places().out('array');
```

**TypeScript (Transformers.js):**
```typescript
const ner = await pipeline('token-classification', 'Xenova/bert-base-NER');
const entities = await ner(text);
```

## Key Semantic Token Types

1. **Named Entities:** PERSON, ORG, GPE, MONEY, DATE
2. **Part-of-Speech:** NOUN, VERB, ADJ, ADV
3. **Dependency Relations:** subject, object, modifier
4. **Semantic Roles:** agent, patient, theme
5. **Embeddings:** Vector representations for similarity

## Use Cases

- **Document Classification:** Identify topics and categories
- **Information Extraction:** Extract entities and relationships
- **Semantic Search:** Find similar content
- **Text Summarization:** Identify key concepts
- **Question Answering:** Understand semantic structure

## Performance Considerations

| Library | Speed | Accuracy | Bundle Size | Offline |
|---------|-------|----------|-------------|---------|
| spaCy | Fast | High | N/A (Python) | Yes |
| NLTK | Medium | Medium | N/A (Python) | Yes |
| Compromise | Very Fast | Medium | ~200KB | Yes |
| Transformers.js | Slow (first load) | Very High | ~5-50MB | Yes |

## Performance Considerations

| Library | Speed | Accuracy | Bundle Size | Offline | Model Type |
|---------|-------|----------|-------------|---------|------------|
| spaCy | Fast | High | N/A (Python) | Yes | Statistical + Rules |
| NLTK | Medium | Medium | N/A (Python) | Yes | Rules + Lexicons |
| Compromise | Very Fast | Medium | ~200KB | Yes | Rules-based |
| Transformers.js | Slow (first load) | Very High | ~5-50MB | Yes | Neural (BERT/DistilBERT) |

**Model Type Comparison:**
- **Rules-based (Compromise):** Fast, lightweight, deterministic, limited accuracy
- **Statistical (spaCy):** Balanced speed/accuracy, requires training data
- **Neural Transformers:** Highest accuracy, larger size, contextual understanding
- **LLMs (GPT, etc.):** Generative, 7GB+, overkill for token classification

## Recommendations

1. **For simple tokenization/POS:** Use Compromise
2. **For custom entity extraction:** Use Compromise with `.extend()` and `.match()`
3. **For advanced NER/embeddings:** Use Transformers.js
4. **For production Python:** Use spaCy
5. **For research/experimentation:** Use NLTK
6. **For browser/client-side:** Use Compromise (lightweight) or Transformers.js (accurate)

## Compromise Extensibility

Compromise is highly extensible:
- **100+ built-in tags** for POS and entities
- **Custom word lists** for domain-specific terms
- **Pattern matching** with regex-like syntax
- **Plugin system** for additional functionality
- **No training required** - just define patterns

Example use cases:
- Medical terms: Define drug names, symptoms, procedures
- Legal documents: Identify case citations, statutes, parties
- Technical docs: Extract API names, code snippets, versions
- Social media: Hashtags, mentions, emojis

## Running Examples

**Python:**
```bash
python python_spacy_example.py
python python_nltk_example.py
```

**TypeScript:**
```bash
npx tsx typescript_compromise_example.ts
npx tsx typescript_transformers_example.ts
```

## Additional Resources

- [Compromise Documentation](https://compromise.cool/)
- [Compromise Tags Reference](https://observablehq.com/@spencermountain/compromise-tags)
- [Transformers.js Models](https://huggingface.co/models?library=transformers.js)
- [spaCy Documentation](https://spacy.io/)
- [NLTK Book](https://www.nltk.org/book/)
