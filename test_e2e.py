"""
Full end-to-end smoke test.
Run from policylens\ root: python test_e2e.py
"""
from rag_engine.ingestion.cleaner import DocumentCleaner
from rag_engine.chunking.clause_chunker import ClauseChunker
from rag_engine.embeddings.embedding_factory import get_embedder
from rag_engine.vector_store.store_factory import get_vector_store
from rag_engine.services.query_service import QueryService

POLICY_ID = "E2E-TEST-001"

SAMPLE_TEXT = """
## SECTION 1 - DEFINITIONS
1.1 Insured means the person named in the Schedule.
1.2 Deductible means the first amount of any claim payable.

## SECTION 2 - COVERAGE
2.1 We will pay for loss caused by fire, smoke, or explosion.
2.2 Coverage limit for fire damage is $50,000 per event.

## SECTION 3 - EXCLUSIONS
3.1 This policy does not cover flood or surface water damage.
3.2 This policy does not cover earthquake or earth movement.

## SECTION 4 - SCHEDULE OF DEDUCTIBLES
| Event  | Deductible |
|--------|------------|
| Fire   | $500       |
| Theft  | $1,000     |
"""

print("\n=== STEP 1: INGESTION ===")
cleaner = DocumentCleaner()
chunker = ClauseChunker()
embedder = get_embedder()
store = get_vector_store()

if store.policy_exists(POLICY_ID):
    store.delete_policy(POLICY_ID)
    print(f"Deleted existing {POLICY_ID}")

clean_text = cleaner.clean(SAMPLE_TEXT)
chunks = chunker.chunk(clean_text, POLICY_ID, "e2e_test.pdf")
texts = [t for t, _ in chunks]
metas = [m.model_dump() for _, m in chunks]
embeddings = embedder.embed_documents(texts)
store_tuples = list(zip(texts, embeddings, metas))
store.add_chunks(store_tuples)

count = store.get_policy_chunk_count(POLICY_ID)
print(f"Ingested {count} chunks for {POLICY_ID}")
assert count > 0, "No chunks stored!"

print("\n=== STEP 2: QUERY ===")
service = QueryService()

questions = [
    "Is flood damage covered?",
    "What is the fire deductible?",
    "What is the coverage limit for fire?"
]

for q in questions:
    print(f"\nQ: {q}")
    result = service.query(q, POLICY_ID)
    print(f"A: {result['answer']}")
    print(f"Sources: {result['source_count']}")

print("\n=== STEP 3: CLEANUP ===")
store.delete_policy(POLICY_ID)
print(f"Deleted {POLICY_ID}")
print("\n✅ END-TO-END TEST COMPLETE")
