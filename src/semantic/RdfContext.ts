/**
 * RDF Context for Amalfa Semantic Layer
 * Defines ontology prefixes, URI templating, and namespace management
 * for the SPARQL-to-SQLite bridge.
 */

// === NAMESPACE DEFINITIONS ===

export const NAMESPACES = {
  ctx: "http://ctx.ai/ontology/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  prov: "http://www.w3.org/ns/prov#",
} as const;

// === ONTOLOGY CLASSES ===

export const CLASSES = {
  // Core Types
  Heuristic: "ctx:Heuristic",
  Directive: "ctx:Directive",
  SubstrateIssue: "ctx:SubstrateIssue",
  Concept: "ctx:Concept",
  Protocol: "ctx:Protocol",
  Document: "ctx:Document",
  Resource: "ctx:Resource",

  // Domain Types
  Contract: "ctx:Contract",
  Clause: "ctx:Clause",
  Party: "ctx:Party",
  Obligation: "ctx:Obligation",

  // Technical Types
  Component: "ctx:Component",
  API: "ctx:API",
  Dependency: "ctx:Dependency",
  Vulnerability: "ctx:Vulnerability",
} as const;

// === ONTOLOGY PREDICATES ===

export const PREDICATES = {
  // Governance Relationships
  implements: "ctx:implements",
  guided_by: "ctx:guided_by",
  mitigates: "ctx:mitigates",
  constrained_by: "ctx:constrained_by",

  // Structural Relationships
  hasPart: "ctx:hasPart",
  partOf: "ctx:partOf",
  relatesTo: "ctx:relatesTo",
  dependsOn: "ctx:dependsOn",

  // Provenance
  isDerivedFrom: "ctx:isDerivedFrom",
  hasSource: "ctx:hasSource",
  authoredBy: "ctx:authoredBy",

  // Document Relationships
  appearsIn: "ctx:appearsIn",
  cites: "ctx:cites",
  references: "ctx:references",

  // Domain-Specific
  obligates: "ctx:obligates",
  terminates: "ctx:terminates",
  amends: "ctx:amends",
  breaks: "ctx:breaks",
  fixes: "ctx:fixes",

  // Literal Properties
  term: "ctx:term",
  definition: "ctx:definition",
  label: "ctx:label",
  title: "ctx:title",
} as const;

// === URI TEMPLATING FUNCTIONS ===

/**
 * Expand a prefixed name to a full URI
 * @example expandPrefixedName("ctx:Heuristic") => "http://ctx.ai/ontology/Heuristic"
 */
export function expandPrefixedName(prefixed: string): string {
  const [prefix, local] = prefixed.split(":");
  if (!prefix || !local) {
    throw new Error(`Invalid prefixed name: ${prefixed}`);
  }
  const namespace = NAMESPACES[prefix as keyof typeof NAMESPACES];
  if (!namespace) {
    throw new Error(`Unknown prefix: ${prefix}`);
  }
  return `${namespace}${local}`;
}

/**
 * Create a ctx ontology URI for a resource
 * @example ctxUri("heuristic", "OH-058") => "ctx:heuristic/OH-058"
 */
export function ctxUri(category: string, id: string): string {
  return `ctx:${category}/${id}`;
}

/**
 * Create a ctx issue URI
 * @example issueUri("Biddability") => "ctx:issue/Biddability"
 */
export function issueUri(issueName: string): string {
  return ctxUri("issue", issueName);
}

/**
 * Create a ctx directive URI
 * @example directiveUri("ADV-8") => "ctx:directive/ADV-8"
 */
export function directiveUri(directiveId: string): string {
  return ctxUri("directive", directiveId);
}

/**
 * Create a ctx heuristic URI
 * @example heuristicUri("OH-058") => "ctx:heuristic/OH-058"
 */
export function heuristicUri(heuristicId: string): string {
  return ctxUri("heuristic", heuristicId);
}

/**
 * Create a ctx resource URI (generic)
 * @example resourceUri("document-123") => "ctx:resource/document-123"
 */
export function resourceUri(resourceId: string): string {
  return ctxUri("resource", resourceId);
}

/**
 * Create a ctx document URI
 * @example documentUri("brief-sparql-sqlite") => "ctx:document/brief-sparql-sqlite"
 */
export function documentUri(docId: string): string {
  return ctxUri("document", docId);
}

// === SPARQL PREFIX DECLARATIONS ===

/**
 * Generate SPARQL PREFIX declarations for all known namespaces
 */
export function sparqlPrefixes(): string {
  return Object.entries(NAMESPACES)
    .map(([prefix, uri]) => `PREFIX ${prefix}: <${uri}>`)
    .join("\n");
}

/**
 * Generate SPARQL PREFIX declarations for specific namespaces
 */
export function sparqlPrefixesFor(
  ...prefixes: (keyof typeof NAMESPACES)[]
): string {
  return prefixes
    .map((prefix) => `PREFIX ${prefix}: <${NAMESPACES[prefix]}>`)
    .join("\n");
}

// === EDGE TYPE TO PREDICATE MAPPING ===

/**
 * Map SQLite edge types to RDF predicates
 * Normalizes legacy edge types to semantic predicates
 */
export const EDGE_TYPE_TO_PREDICATE: Record<string, string> = {
  // Current EdgeWeaver types → RDF predicates
  TAGGED_AS: "ctx:taggedAs",
  EXEMPLIFIES: "ctx:exemplifies",
  CITES: "ctx:cites",
  LINKS_TO: "ctx:linksTo",
  RELATED_TO: "ctx:relatesTo",

  // Semantic predicates (for Triplifier output)
  IMPLEMENTS: "ctx:implements",
  GUIDED_BY: "ctx:guided_by",
  MITIGATES: "ctx:mitigates",
  CONSTRAINED_BY: "ctx:constrained_by",

  // Provenance
  DERIVED_FROM: "ctx:isDerivedFrom",
  APPEARS_IN: "ctx:appearsIn",
};

/**
 * Normalize an edge type to a semantic predicate
 */
export function normalizePredicate(edgeType: string): string {
  const normalized = EDGE_TYPE_TO_PREDICATE[edgeType.toUpperCase()];
  return normalized || `ctx:${edgeType.toLowerCase()}`;
}

// === TYPE INFERENCE ===

/**
 * Infer RDF class from node type
 */
export function inferClassFromType(nodeType: string): string {
  const typeMap: Record<string, string> = {
    heuristic: "ctx:Heuristic",
    directive: "ctx:Directive",
    concept: "ctx:Concept",
    protocol: "ctx:Protocol",
    document: "ctx:Document",
    issue: "ctx:SubstrateIssue",
    resource: "ctx:Resource",
  };
  return typeMap[nodeType.toLowerCase()] || "ctx:Resource";
}

// === TRIPLE INTERFACE ===

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  objectType: "uri" | "literal";
  datatype?: string;
  language?: string;
}

export interface TripleWithProvenance extends Triple {
  sourceDocument?: string;
  confidence?: number;
  veracity?: number;
}

// === UTILITY: FORMAT TRIPLE AS N-TRIPLES ===

/**
 * Format a triple as N-Triples string
 */
export function formatAsNTriples(triple: Triple): string {
  const subject = triple.subject.startsWith("<")
    ? triple.subject
    : `<${expandPrefixedName(triple.subject)}>`;

  const predicate = triple.predicate.startsWith("<")
    ? triple.predicate
    : `<${expandPrefixedName(triple.predicate)}>`;

  let object: string;
  if (triple.objectType === "uri") {
    object = triple.object.startsWith("<")
      ? triple.object
      : `<${expandPrefixedName(triple.object)}>`;
  } else {
    // Literal
    const escaped = triple.object
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");

    if (triple.datatype) {
      object = `"${escaped}"^^<${triple.datatype}>`;
    } else if (triple.language) {
      object = `"${escaped}"@${triple.language}`;
    } else {
      object = `"${escaped}"`;
    }
  }

  return `${subject} ${predicate} ${object} .`;
}

// === DEFAULT EXPORT ===

export default {
  NAMESPACES,
  CLASSES,
  PREDICATES,
  expandPrefixedName,
  ctxUri,
  issueUri,
  directiveUri,
  heuristicUri,
  resourceUri,
  documentUri,
  sparqlPrefixes,
  sparqlPrefixesFor,
  normalizePredicate,
  inferClassFromType,
  formatAsNTriples,
  EDGE_TYPE_TO_PREDICATE,
};
