import spacy

nlp = spacy.load("en_core_web_sm")

text = "Apple Inc. is looking at buying U.K. startup for $1 billion. Tim Cook announced this in San Francisco."

doc = nlp(text)

print("=== TOKENS WITH POS TAGS ===")
for token in doc:
    print(f"{token.text:15} {token.pos_:10} {token.dep_:10} {token.lemma_}")

print("\n=== NAMED ENTITIES ===")
for ent in doc.ents:
    print(f"{ent.text:20} {ent.label_:15} {ent.start_char}-{ent.end_char}")

print("\n=== NOUN CHUNKS ===")
for chunk in doc.noun_chunks:
    print(f"{chunk.text:30} {chunk.root.text:15} {chunk.root.dep_}")

print("\n=== SEMANTIC SIMILARITY ===")
doc1 = nlp("I like cats")
doc2 = nlp("I like dogs")
doc3 = nlp("I enjoy programming")
print(f"Cats vs Dogs: {doc1.similarity(doc2):.3f}")
print(f"Cats vs Programming: {doc1.similarity(doc3):.3f}")
