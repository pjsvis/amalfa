---
date: 2026-02-01
tags: [fafcas, pipeline, corruption, forensics, vector-search, cross-domain]
---

## Debrief: FAFCAS Protocol Investigation & Pipeline Restoration

## Accomplishments

- **Database Restoration**: Successfully restored corrupted database from 916 nodes to 1,668 nodes with proper FAFCAS-compliant 384-dim embeddings
- **Cross-Domain Edge Pipeline**: Created new Pipeline C connecting knowledge and lexicon domains with 4,575 high-quality edges (avg confidence 0.732)
- **Search Quality Recovery**: Restored vector search from broken state (0.04 scores) to excellent performance (0.8+ scores) - **20x improvement**
- **Buffer Access Pattern Fix**: Identified and fixed systematic vector corruption caused by wrong `Float32Array` construction pattern across multiple files
- **Pipeline B Clean Re-ingestion**: Successfully re-ran lexicon ingestion with clean 384-dim vectors, eliminating 4x dimension corruption
- **Dashboard Visualization Fix**: Resolved frontend visualization issues by adding missing `/api/health` endpoint and fixing database file serving with proper headers
- **SSOT Compliance**: Fixed multiple configuration violations where scripts hard-coded paths instead of using `getDbPath()` from amalfa.settings.json
- **Documentation Updates**: Updated Full System Check Brief to include Pipeline C, correct baselines, and FAFCAS compliance checks

## Problems

- **Agent Negligence - FAFCAS Ignorance**: Previous agent failed to read extensive FAFCAS documentation despite implementing vector similarity, resulting in wrong cosine similarity calculations instead of dot product optimization
- **SSOT Violations**: Created pipeline files that hard-coded database paths (`.amalfa/resonance.db`) instead of respecting configuration SSOT
- **Buffer Access Pattern Bug**: Used `new Float32Array(row.embedding)` instead of `new Float32Array(row.embedding.buffer, offset, length/4)` causing 4x dimension expansion and value corruption
- **Memory Management Anti-Pattern**: Loaded all 1,659 nodes into memory simultaneously (10MB) instead of using streaming or database-optimized search
- **Dimension Mismatch**: Database contained 1536-dim corrupted vectors while expecting 384-dim FAFCAS vectors, causing completely broken similarity calculations
- **Search System Degradation**: Vector search had been broken for extended period with terrible results (0.04-0.05 scores) that should have been 0.7-0.9
- **Corruption Cascade**: Original Pipeline A corruption led to Pipeline B issues, requiring complete database cleanup and re-ingestion

## Lessons Learned

- **RTFM is Mandatory**: Agent failed to check existing FAFCAS documentation (`embeddings-and-fafcas-protocol-playbook.md`) before implementing vector operations - this is completely unacceptable negligence
- **Test Assumptions**: Never assume vector normalization, dimensions, or storage format without verification - the database vectors were 4x corrupted for unknown duration
- **Buffer Handling is Critical**: TypedArray buffer access patterns must be exact - wrong pattern causes systematic data corruption that preserves norms but destroys semantic meaning
- **Forensic Investigation Works**: Stage-by-stage verification (JSONL → Database → Retrieval) pinpointed exact corruption source in ResonanceDB buffer handling
- **Search Quality is Measurable**: Dramatic score changes (0.04 → 0.8) provided clear evidence of corruption vs restoration
- **FAFCAS Protocol Enforcement**: "Fast As F*ck, Cool As Sh*t" requires unit-normalized vectors (L2 norm = 1.0) for dot product optimization
- **Cross-Domain Linking Effectiveness**: Proper vector similarity creates meaningful entity-document relationships, reducing orphaned nodes from 978 to ~200
- **SSOT Violations Cascade**: Hard-coded paths create maintenance debt and configuration drift - all database access must use `getDbPath()`
- **Pipeline Interdependencies**: Document and lexicon embeddings must have matching dimensions for cross-domain similarity to work

## Technical Findings

### Vector Corruption Pattern
```typescript
// ❌ WRONG (caused 4x corruption)
new Float32Array(row.embedding)

// ✅ CORRECT (preserves 384-dim)  
new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.byteLength / 4)
```

### FAFCAS Compliance Verification
- **Original corrupt state**: 1536-dim vectors, norms 5000-10000
- **After fixes**: 384-dim vectors, norms 1.0
- **Search improvement**: 0.04 → 0.8+ scores (20x better)

### Files Fixed
1. `src/pipeline/cross-domain/01-generate-edges.ts` - Buffer access + SSOT
2. `src/pipeline/cross-domain/02-ingest.ts` - SSOT compliance  
3. `src/services/dashboard-daemon.ts` - Health endpoint + file serving
4. Complete database re-ingestion (Pipeline A + B)

### Artifacts Created
1. `src/pipeline/cross-domain/` - Cross-domain edge generation pipeline
2. `briefs/2026-02-01-cross-domain-pipeline-ssot-violations.md` - Violation documentation
3. `scripts/lab/` - Forensic investigation scripts
4. Updated `briefs/system-check-2026-02-01.md` - Added Pipeline C verification

## Future Safeguards

1. **Mandatory Documentation Review**: Always check existing playbooks before implementing vector operations
2. **FAFCAS Compliance Testing**: Add vector norm verification to CI/CD pipeline
3. **SSOT Linting**: Implement pre-commit hooks to prevent hard-coded configuration paths
4. **Buffer Access Standards**: Document correct TypedArray patterns in playbooks
5. **Search Quality Monitoring**: Add baseline search quality tests to detect degradation

## Status
- ✅ **FAFCAS Protocol**: Fully operational with 384-dim unit-normalized vectors
- ✅ **Search System**: Restored to excellent performance (0.8+ scores)
- ✅ **Cross-Domain Links**: 4,575 edges connecting documents to entities
- ✅ **Pipeline Integrity**: All three pipelines (A, B, C) working correctly
- ✅ **Visualization**: Dashboard serving graph with proper node counts

**System is now fully operational with FAFCAS compliance and high-quality vector search.**