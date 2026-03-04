/**
 * Semantic Layer for Amalfa
 *
 * This module provides RDF/SPARQL capabilities over the SQLite property graph,
 * enabling deterministic logical queries alongside probabilistic vector search.
 *
 * @example
 * ```typescript
 * import { SparqlConnector, TripleMapper, RdfContext } from '@src/semantic';
 *
 * const connector = new SparqlConnector(db);
 * const result = await connector.query(`
 *   PREFIX ctx: <http://ctx.ai/ontology/>
 *   SELECT ?h WHERE {
 *     ?h a ctx:Heuristic ;
 *        ctx:mitigates ctx:issue/Biddability .
 *   }
 * `);
 * ```
 */

// RDF Context & Ontology
// Re-export default for convenience
export {
  CLASSES,
  ctxUri,
  default as RdfContext,
  directiveUri,
  documentUri,
  EDGE_TYPE_TO_PREDICATE,
  expandPrefixedName,
  formatAsNTriples,
  heuristicUri,
  inferClassFromType,
  issueUri,
  NAMESPACES,
  normalizePredicate,
  PREDICATES,
  resourceUri,
  sparqlPrefixes,
  sparqlPrefixesFor,
  type Triple,
  type TripleWithProvenance,
} from "./RdfContext";
// Core Components
export {
  type Binding,
  default as SparqlConnectorDefault,
  type ParsedQuery,
  SparqlConnector,
  type SparqlResult,
} from "./SparqlConnector";
export {
  default as TripleMapperDefault,
  type EdgeRow,
  type NodeRow,
  TripleMapper,
} from "./TripleMapper";
