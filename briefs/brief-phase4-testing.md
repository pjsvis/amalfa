## Task: Phase 4 - Testing & Quality

**Objective:** Improve test coverage, fix placeholder tests, and expand coverage to critical modules.

**TODO Items:** #15, #16

- [ ] Tests folder cleanup (#15)
- [ ] Expand test coverage to critical modules (#16)

## Key Actions Checklist:

### Test Cleanup (#15)
- [ ] Fix or delete `tests/harvester.test.ts` (placeholder `expect(true).toBe(true)`)
- [ ] Delete `tests/unit/` (empty directory)
- [ ] Keep: `DatabaseFactory.test.ts`, `weaver.test.ts`, `bento_normalizer.test.ts`
- [ ] Keep: `daemon-realtime.test.ts`, `fafcas_compliance.test.ts`
- [ ] Keep: `tests/fixtures/` directory

### Critical Coverage Gaps (#16)

**High Priority - Core Modules:**
- [ ] `GraphEngine.test.ts`:
  - [ ] Test `load()` from DB
  - [ ] Test `getNeighbors()`, `getNodeAttributes()`
  - [ ] Test `findShortestPath()`
  - [ ] Test `detectCommunities()`, `getPagerank()`, `getBetweenness()`
  - [ ] Test `getAdamicAdar()`, `findStructuralCandidates()`
  
- [ ] `VectorEngine.test.ts`:
  - [ ] Test embedding generation
  - [ ] Test similarity search
  - [ ] Test upsert and retrieval
  
- [ ] `ResonanceDB.test.ts`:
  - [ ] Test `insertNode()`, `insertEdge()`
  - [ ] Test `getNode()`, `getEdge()`
  - [ ] Test transactions: `beginTransaction()`, `commit()`, `rollback()`
  - [ ] Test migrations

**Medium Priority:**
- [ ] `LouvainGate.test.ts`:
  - [ ] Test super-node detection
  - [ ] Test shared neighbor logic
  - [ ] Test edge rejection
  
- [ ] `AmalfaIngestor.test.ts`:
  - [ ] Test file ingestion
  - [ ] Test directory scanning
  - [ ] Test content normalization

- [ ] CLI tests (e.g., `cli.test.ts`):
  - [ ] Test `amalfa init`
  - [ ] Test `amalfa stats`
  - [ ] Test `amalfa doctor`

## Coverage Targets:

| Module | Current | Target |
| :--- | :--- | :--- |
| GraphEngine | 0% | 80% |
| VectorEngine | 0% | 80% |
| ResonanceDB | 0% | 80% |
| EdgeWeaver | ✅ ~90% | - |
| BentoNormalizer | ✅ ~90% | - |

## Verification:

- [ ] `bun test` passes with all new tests
- [ ] Coverage report shows improvement in core modules
- [ ] No more placeholder tests
