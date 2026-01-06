import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.tag import pos_tag
from nltk.chunk import ne_chunk
from nltk.corpus import wordnet

text = "Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook announced this in San Francisco."

print("=== SENTENCE TOKENIZATION ===")
sentences = sent_tokenize(text)
for i, sent in enumerate(sentences):
    print(f"{i+1}. {sent}")

print("\n=== WORD TOKENIZATION & POS TAGGING ===")
tokens = word_tokenize(text)
pos_tags = pos_tag(tokens)
for word, tag in pos_tags:
    print(f"{word:15} {tag}")

print("\n=== NAMED ENTITY RECOGNITION ===")
named_entities = ne_chunk(pos_tags)
for chunk in named_entities:
    if hasattr(chunk, 'label'):
        print(f"{' '.join(c[0] for c in chunk):20} {chunk.label()}")

print("\n=== WORDNET SEMANTIC RELATIONS ===")
word = "computer"
synsets = wordnet.synsets(word)
if synsets:
    print(f"Synsets for '{word}':")
    for syn in synsets[:3]:
        print(f"  {syn.name()}: {syn.definition()}")
        print(f"    Hypernyms: {[h.name() for h in syn.hypernyms()]}")
