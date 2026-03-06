/**
 * SparqlConnector.ts
 * SPARQL Query Engine for SQLite
 *
 * This module implements a SPARQL-to-SQL translation layer that allows
 * querying the SQLite property graph using SPARQL syntax. It provides
 * a deterministic, logical query capability alongside the existing
 * probabilistic vector search.
 *
 * Design Philosophy (PHI-14: Architectural Specialisation):
 * - Simple SPARQL subset (SELECT, WHERE, FILTER, OPTIONAL)
 * - Direct SQL translation (no intermediate triple store)
 * - Composable query building
 */

import type { Database } from "bun:sqlite";
import {
  EDGE_TYPE_TO_PREDICATE,
  normalizePredicate,
  type TripleWithProvenance,
} from "./RdfContext";
import { TripleMapper } from "./TripleMapper";

// === QUERY RESULT TYPES ===

export interface Binding {
  [variable: string]: {
    value: string;
    type: "uri" | "literal";
    datatype?: string;
  };
}

export interface SparqlResult {
  head: { vars: string[] };
  results: { bindings: Binding[] };
  triples?: TripleWithProvenance[];
  timing: {
    parse: number;
    execute: number;
    total: number;
  };
}

export interface ParsedQuery {
  type: "SELECT" | "CONSTRUCT" | "ASK" | "DESCRIBE";
  variables: string[];
  patterns: TriplePattern[];
  filters: FilterExpression[];
  optionals: TriplePattern[][];
  limit?: number;
  offset?: number;
  orderBy?: { variable: string; direction: "ASC" | "DESC" }[];
}

export interface TriplePattern {
  subject: { type: "variable" | "uri" | "literal"; value: string };
  predicate: { type: "variable" | "uri"; value: string };
  object: { type: "variable" | "uri" | "literal"; value: string };
}

export interface FilterExpression {
  type: "comparison" | "existence" | "regex";
  variable?: string;
  operator?: "=" | "!=" | "<" | ">" | "<=" | ">=";
  value?: string;
  pattern?: TriplePattern[];
  negated?: boolean;
}

// === SPARQL CONNECTOR CLASS ===

export class SparqlConnector {
  private db: Database;
  private mapper: TripleMapper;

  constructor(db: Database) {
    this.db = db;
    this.mapper = new TripleMapper(db);
  }

  /**
   * Execute a SPARQL query against the SQLite database
   */
  async query(sparql: string): Promise<SparqlResult> {
    const startTime = performance.now();
    const parseStart = performance.now();

    // Parse the SPARQL query
    const parsed = this.parseQuery(sparql);
    const parseEnd = performance.now();

    const executeStart = performance.now();

    // Execute based on query type
    let result: SparqlResult;
    switch (parsed.type) {
      case "SELECT":
        result = await this.executeSelect(parsed);
        break;
      case "CONSTRUCT":
        result = await this.executeConstruct(parsed);
        break;
      case "ASK":
        result = await this.executeAsk(parsed);
        break;
      case "DESCRIBE":
        result = await this.executeDescribe(parsed);
        break;
      default:
        throw new Error(`Unsupported query type: ${(parsed as any).type}`);
    }

    const executeEnd = performance.now();
    const endTime = performance.now();

    result.timing = {
      parse: parseEnd - parseStart,
      execute: executeEnd - executeStart,
      total: endTime - startTime,
    };

    return result;
  }

  /**
   * Parse SPARQL query string into structured representation
   * Supports a subset of SPARQL 1.1
   */
  private parseQuery(sparql: string): ParsedQuery {
    // Normalize whitespace (don't remove comments - breaks URLs with #)
    const normalized = sparql
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    // Skip PREFIX declarations to find query type
    // Split by PREFIX, filter empty, rejoin - handles multiple PREFIX lines reliably
    const withoutPrefixes = normalized
      .split(/PREFIX\s+\w+:\s*<[^>]+>\s*/i)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .join(" ")
      .trim();

    // Extract query type
    const typeMatch = withoutPrefixes.match(
      /^(SELECT|CONSTRUCT|ASK|DESCRIBE)/i,
    );
    if (!typeMatch) {
      throw new Error(
        `Invalid SPARQL query: must start with SELECT, CONSTRUCT, ASK, or DESCRIBE. Got: "${withoutPrefixes.substring(0, 50)}..."`,
      );
    }
    const type = (typeMatch[1] ?? "").toUpperCase() as ParsedQuery["type"];

    // Extract variables for SELECT
    const variables: string[] = [];
    if (type === "SELECT") {
      const varMatch = normalized.match(
        /SELECT\s+(DISTINCT\s+)?(.+?)\s+WHERE/i,
      );
      if (varMatch) {
        const varList = varMatch[2] ?? "";
        if (varList === "*") {
          // SELECT * - will be populated during pattern matching
        } else {
          const vars = varList.match(/\?(\w+)/g);
          if (vars) {
            variables.push(...vars.map((v) => v.substring(1)));
          }
        }
      }
    }

    // Extract WHERE clause (WHERE keyword is optional in ASK and some SELECT forms)
    // PHI-15: Use greedy match to capture nested braces (up to the last })
    const whereMatch = normalized.match(/(?:WHERE)?\s*\{([\s\S]+)\}/i);
    const patterns: TriplePattern[] = [];
    const filters: FilterExpression[] = [];
    const optionals: TriplePattern[][] = [];

    if (whereMatch) {
      const whereClause = whereMatch[1] ?? "";
      this.parseWhereClause(whereClause, patterns, filters, optionals);
    }

    // Extract LIMIT
    const limitMatch = normalized.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch?.[1] ? parseInt(limitMatch[1], 10) : undefined;

    // Extract OFFSET
    const offsetMatch = normalized.match(/OFFSET\s+(\d+)/i);
    const offset = offsetMatch?.[1] ? parseInt(offsetMatch[1], 10) : undefined;

    // Extract ORDER BY
    const orderByMatch = normalized.match(
      /ORDER\s+BY\s+(DESC|ASC)?\s*\?(\w+)/i,
    );
    const orderBy = orderByMatch
      ? [
          {
            variable: orderByMatch[2] ?? "",
            direction: (orderByMatch[1] || "ASC") as "ASC" | "DESC",
          },
        ]
      : undefined;

    return {
      type,
      variables,
      patterns,
      filters,
      optionals,
      limit,
      offset,
      orderBy,
    };
  }

  /**
   * Parse WHERE clause content into patterns and filters
   */
  private parseWhereClause(
    clause: string,
    patterns: TriplePattern[],
    filters: FilterExpression[],
    optionals: TriplePattern[][],
  ): void {
    // Handle OPTIONAL clauses
    const optionalRegex = /OPTIONAL\s*\{([^}]+)\}/gi;
    let optionalMatch = optionalRegex.exec(clause);
    while (optionalMatch !== null) {
      const optionalPatterns: TriplePattern[] = [];
      this.parseTriplePatterns(optionalMatch[1] ?? "", optionalPatterns);
      optionals.push(optionalPatterns);
      optionalMatch = optionalRegex.exec(clause);
    }

    // Remove OPTIONAL clauses for main pattern parsing
    let remaining = clause.replace(optionalRegex, "");

    // Handle FILTER NOT EXISTS
    const filterNotExistsRegex = /FILTER\s+NOT\s+EXISTS\s*\{([\s\S]+?)\}/gi;
    let filterMatch = filterNotExistsRegex.exec(remaining);
    while (filterMatch !== null) {
      const filterPatterns: TriplePattern[] = [];
      this.parseTriplePatterns(filterMatch[1] ?? "", filterPatterns);
      filters.push({
        type: "existence",
        pattern: filterPatterns,
        negated: true,
      });
      filterMatch = filterNotExistsRegex.exec(remaining);
    }
    remaining = remaining.replace(filterNotExistsRegex, "");

    // Handle FILTER EXISTS
    const filterExistsRegex = /FILTER\s+EXISTS\s*\{([\s\S]+?)\}/gi;
    filterMatch = filterExistsRegex.exec(remaining);
    while (filterMatch !== null) {
      const filterPatterns: TriplePattern[] = [];
      this.parseTriplePatterns(filterMatch[1] ?? "", filterPatterns);
      filters.push({
        type: "existence",
        pattern: filterPatterns,
        negated: false,
      });
      filterMatch = filterExistsRegex.exec(remaining);
    }
    remaining = remaining.replace(filterExistsRegex, "");

    // Handle comparison filters
    const comparisonRegex =
      /FILTER\s*\(\s*\?(\w+)\s*(=|!=|<|>|<=|>=)\s*(.+?)\s*\)/gi;
    filterMatch = comparisonRegex.exec(remaining);
    while (filterMatch !== null) {
      filters.push({
        type: "comparison",
        variable: filterMatch[1] ?? "",
        operator: filterMatch[2] as FilterExpression["operator"],
        value: (filterMatch[3] ?? "").trim().replace(/["']/g, ""),
      });
      filterMatch = comparisonRegex.exec(remaining);
    }
    remaining = remaining.replace(comparisonRegex, "");

    // Parse main triple patterns
    this.parseTriplePatterns(remaining, patterns);
  }

  /**
   * Parse triple patterns from a string
   */
  private parseTriplePatterns(input: string, patterns: TriplePattern[]): void {
    // Match triple patterns: ?s ?p ?o . or <uri> ?p "literal" .
    // Groups: 1-5: subject, 6-10: predicate (10 is 'a'), 11-15: object
    const tripleRegex =
      /(?:(\?\w+)|<([^>]+)>|"([^"]*)"|(\w+):(\w+))\s+(?:(\?\w+)|<([^>]+)>|(\w+):(\w+)|(a))\s+(?:(\?\w+)|<([^>]+)>|"([^"]*)"|(\w+):(\w+))\s*\./g;

    let match = tripleRegex.exec(input);
    while (match !== null) {
      const subject = this.parseTerm(
        match[1],
        match[2],
        match[3],
        match[4],
        match[5],
      );

      // Handle 'a' specifically or parse other terms
      const predicate =
        match[10] === "a"
          ? ({ type: "uri", value: "rdf:type" } as const)
          : this.parseTerm(
              match[6],
              match[7],
              undefined,
              match[8],
              match[9],
              true,
            );

      const object = this.parseTerm(
        match[11],
        match[12],
        match[13],
        match[14],
        match[15],
      );

      if (subject && predicate && object && predicate.type !== "literal") {
        patterns.push({
          subject,
          predicate: predicate as { type: "variable" | "uri"; value: string },
          object,
        });
      }
      match = tripleRegex.exec(input);
    }
  }

  /**
   * Parse a single term (subject, predicate, or object)
   */
  private parseTerm(
    variable: string | undefined,
    uri: string | undefined,
    literal: string | undefined,
    prefix: string | undefined,
    local: string | undefined,
    _isPredicate = false,
  ): { type: "variable" | "uri" | "literal"; value: string } | null {
    if (variable) {
      return { type: "variable", value: variable.substring(1) }; // Remove ?
    }
    if (uri) {
      return { type: "uri", value: uri };
    }
    if (literal !== undefined) {
      return { type: "literal", value: literal };
    }
    if (prefix && local) {
      return { type: "uri", value: `${prefix}:${local}` };
    }
    return null;
  }

  /**
   * Execute SELECT query
   */
  private async executeSelect(parsed: ParsedQuery): Promise<SparqlResult> {
    const bindings = this.translateAndExecute(parsed);

    // Determine variables
    const vars =
      parsed.variables.length > 0
        ? parsed.variables
        : this.inferVariables(parsed.patterns);

    return {
      head: { vars },
      results: { bindings },
      timing: { parse: 0, execute: 0, total: 0 },
    };
  }

  /**
   * Execute CONSTRUCT query
   */
  private async executeConstruct(parsed: ParsedQuery): Promise<SparqlResult> {
    const bindings = this.translateAndExecute(parsed);
    const triples: TripleWithProvenance[] = [];

    // Convert bindings to triples
    for (const binding of bindings) {
      for (const pattern of parsed.patterns) {
        const triple = this.bindingToTriple(binding, pattern);
        if (triple) {
          triples.push(triple);
        }
      }
    }

    const vars = this.inferVariables(parsed.patterns);
    return {
      head: { vars },
      results: { bindings },
      triples,
      timing: { parse: 0, execute: 0, total: 0 },
    };
  }

  /**
   * Execute ASK query (returns boolean)
   */
  private async executeAsk(parsed: ParsedQuery): Promise<SparqlResult> {
    const sqlBuilder = new SqlBuilder(this.db);

    // Add base patterns
    for (const pattern of parsed.patterns) {
      sqlBuilder.addPattern(pattern);
    }

    // Add filters
    for (const filter of parsed.filters) {
      sqlBuilder.addFilter(filter);
    }

    const { sql, params } = sqlBuilder.buildExists();
    const row = this.db.query(sql).get(...params) as Record<
      string,
      unknown
    > | null;
    const result = row !== null;

    return {
      head: { vars: ["_ask"] },
      results: {
        bindings: [{ _ask: { value: result.toString(), type: "literal" } }],
      },
      timing: { parse: 0, execute: 0, total: 0 },
    };
  }

  /**
   * Execute DESCRIBE query
   */
  private async executeDescribe(parsed: ParsedQuery): Promise<SparqlResult> {
    // Get all triples for matching resources
    const triples = this.mapper.extractAllTriples();

    const vars = this.inferVariables(parsed.patterns);
    return {
      head: { vars },
      results: { bindings: [] },
      triples: triples.slice(0, parsed.limit || 1000),
      timing: { parse: 0, execute: 0, total: 0 },
    };
  }

  /**
   * Translate SPARQL to SQL and execute
   * This is the core translation logic
   */
  private translateAndExecute(parsed: ParsedQuery): Binding[] {
    // Build SQL query from patterns
    const sqlBuilder = new SqlBuilder(this.db);
    sqlBuilder.setLimit(parsed.limit, parsed.offset);
    sqlBuilder.setOrderBy(parsed.orderBy);

    // Add base patterns
    for (const pattern of parsed.patterns) {
      sqlBuilder.addPattern(pattern);
    }

    // Add filters
    for (const filter of parsed.filters) {
      sqlBuilder.addFilter(filter);
    }

    // Build and execute SQL
    const { sql, params } = sqlBuilder.build();

    try {
      const rows = this.db.query(sql).all(...params) as Record<
        string,
        unknown
      >[];

      // Convert rows to bindings
      return rows.map((row) =>
        this.rowToBinding(row, sqlBuilder.getVariableMapping()),
      );
    } catch (error) {
      console.error("SQL execution error:", error);
      console.error("Generated SQL:", sql);
      console.error("Params:", params);
      return [];
    }
  }

  /**
   * Infer variables from patterns when SELECT * is used
   */
  private inferVariables(patterns: TriplePattern[]): string[] {
    const vars = new Set<string>();
    for (const pattern of patterns) {
      if (pattern.subject.type === "variable") vars.add(pattern.subject.value);
      if (pattern.predicate.type === "variable")
        vars.add(pattern.predicate.value);
      if (pattern.object.type === "variable") vars.add(pattern.object.value);
    }
    return Array.from(vars);
  }

  /**
   * Convert a database row to a SPARQL binding
   */
  private rowToBinding(
    row: Record<string, unknown>,
    varMapping: Map<string, string>,
  ): Binding {
    const binding: Binding = {};

    for (const [varName, columnName] of varMapping) {
      // When we use column aliases (AS "varName"), the row key is the alias, not the original column name
      const value = row[varName] ?? row[columnName];
      if (value !== null && value !== undefined) {
        binding[varName] = {
          value: String(value),
          type:
            columnName.includes("_type") || columnName === "type"
              ? "uri"
              : "literal",
        };
      }
    }

    return binding;
  }

  /**
   * Convert a binding and pattern to a triple
   */
  private bindingToTriple(
    binding: Binding,
    pattern: TriplePattern,
  ): TripleWithProvenance | null {
    const getValue = (term: { type: string; value: string }): string | null => {
      if (term.type === "variable") {
        return binding[term.value]?.value || null;
      }
      return term.value;
    };

    const subject = getValue(pattern.subject);
    const predicate = getValue(pattern.predicate);
    const object = getValue(pattern.object);

    if (!subject || !predicate || !object) {
      return null;
    }

    return {
      subject,
      predicate,
      object,
      objectType: pattern.object.type === "literal" ? "literal" : "uri",
    };
  }

  /**
   * Get the underlying TripleMapper for direct triple access
   */
  getMapper(): TripleMapper {
    return this.mapper;
  }

  /**
   * Get database statistics
   */
  getStats() {
    return this.mapper.getStats();
  }
}

// === SQL BUILDER HELPER CLASS ===

class SqlBuilder {
  private tables: string[] = [];
  private conditions: string[] = [];
  private params: (string | number)[] = [];
  private variableMapping = new Map<string, string>();
  private aliasCounter = 0;
  private db: Database;
  private limit?: number;
  private offset?: number;
  private orderBy?: { variable: string; direction: "ASC" | "DESC" }[];

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Set limit and offset
   */
  setLimit(limit?: number, offset?: number): void {
    this.limit = limit;
    this.offset = offset;
  }

  /**
   * Set order by
   */
  setOrderBy(
    orderBy?: { variable: string; direction: "ASC" | "DESC" }[],
  ): void {
    this.orderBy = orderBy;
  }

  /**
   * Add a triple pattern to the SQL query
   */
  addPattern(pattern: TriplePattern): void {
    const alias = `e${this.aliasCounter++}`;

    // Simplify predicate for dispatch
    const pred = this.simplifyUri(pattern.predicate.value);

    if (
      pattern.predicate.type === "uri" &&
      (pred === "rdf:type" || pred === "type")
    ) {
      this.addTypePattern(pattern, alias);
    } else if (
      pattern.predicate.type === "uri" &&
      (pred === "rdfs:label" || pred === "label" || pred === "title")
    ) {
      this.addLabelPattern(pattern, alias);
    } else {
      this.addEdgePattern(pattern, alias);
    }
  }

  /**
   * Add a type pattern (queries the nodes table)
   */
  private addTypePattern(pattern: TriplePattern, _alias: string): void {
    const nodeAlias = `n${this.aliasCounter++}`;
    this.tables.push(`nodes AS ${nodeAlias}`);

    // Subject variable
    if (pattern.subject.type === "variable") {
      this.handleVariable(pattern.subject.value, `${nodeAlias}.id`);
    } else {
      // Subject is a specific URI
      const subjectValue = this.resolveUri(pattern.subject.value);
      this.conditions.push(`${nodeAlias}.id = ?`);
      this.params.push(subjectValue);
    }

    // Object (the type)
    if (pattern.object.type === "variable") {
      this.handleVariable(pattern.object.value, `${nodeAlias}.type`);
    } else if (pattern.object.type === "uri") {
      const typeValue = this.resolveClass(pattern.object.value);
      this.conditions.push(`${nodeAlias}.type = ?`);
      this.params.push(typeValue);
    }
  }

  /**
   * Add a label pattern (queries the nodes table for title)
   */
  private addLabelPattern(pattern: TriplePattern, _alias: string): void {
    const nodeAlias = `n${this.aliasCounter++}`;
    this.tables.push(`nodes AS ${nodeAlias}`);

    // Subject variable
    if (pattern.subject.type === "variable") {
      this.handleVariable(pattern.subject.value, `${nodeAlias}.id`);
    } else {
      const subjectValue = this.resolveUri(pattern.subject.value);
      this.conditions.push(`${nodeAlias}.id = ?`);
      this.params.push(subjectValue);
    }

    // Object (the label) - bind to title column
    if (pattern.object.type === "variable") {
      this.handleVariable(pattern.object.value, `${nodeAlias}.title`);
    } else {
      this.conditions.push(`${nodeAlias}.title = ?`);
      this.params.push(pattern.object.value);
    }
  }

  /**
   * Add an edge pattern (queries the edges table)
   */
  private addEdgePattern(pattern: TriplePattern, alias: string): void {
    this.tables.push(`edges AS ${alias}`);

    // Subject (source)
    if (pattern.subject.type === "variable") {
      this.handleVariable(pattern.subject.value, `${alias}.source`);
    } else {
      const subjectValue = this.resolveUri(pattern.subject.value);
      this.conditions.push(`${alias}.source = ?`);
      this.params.push(subjectValue);
    }

    // Predicate (edge type)
    if (pattern.predicate.type === "variable") {
      this.handleVariable(pattern.predicate.value, `${alias}.type`);
    } else {
      const predicateValue = this.resolvePredicate(pattern.predicate.value);
      this.conditions.push(`${alias}.type = ?`);
      this.params.push(predicateValue);
    }

    // Object (target)
    if (pattern.object.type === "variable") {
      this.handleVariable(pattern.object.value, `${alias}.target`);
    } else if (pattern.object.type === "uri") {
      const objectValue = this.resolveUri(pattern.object.value);
      this.conditions.push(`${alias}.target = ?`);
      this.params.push(objectValue);
    } else {
      // Literal object - would need to join with nodes for label matching
      // For now, we just match against target
      this.conditions.push(`${alias}.target = ?`);
      this.params.push(pattern.object.value);
    }
  }

  /**
   * Add a filter to the query
   */
  addFilter(filter: FilterExpression): void {
    if (filter.type === "comparison" && filter.variable) {
      const column = this.variableMapping.get(filter.variable);
      if (column) {
        const operator = filter.operator || "=";
        this.conditions.push(`${column} ${operator} ?`);
        this.params.push(filter.value || "");
      }
    } else if (filter.type === "existence" && filter.pattern) {
      // Handle FILTER (NOT) EXISTS by adding subquery
      const subBuilder = new SqlBuilder(this.db);
      for (const p of filter.pattern) {
        subBuilder.addPattern(p);
      }

      // Inherit variable mappings for correlated subquery
      for (const [v, c] of this.variableMapping.entries()) {
        subBuilder.setVariableMapping(v, c);
      }

      const { sql: subSql, params: subParams } = subBuilder.buildExists();

      if (filter.negated) {
        this.conditions.push(`NOT EXISTS (${subSql})`);
      } else {
        this.conditions.push(`EXISTS (${subSql})`);
      }
      this.params.push(...subParams);
    }
  }

  /**
   * Internal method to set variable mapping (used for correlated subqueries)
   */
  public setVariableMapping(varName: string, columnName: string): void {
    this.variableMapping.set(varName, columnName);
  }

  /**
   * Helper to handle variable terms consistently
   */
  private handleVariable(varName: string, column: string): void {
    if (this.variableMapping.has(varName)) {
      this.conditions.push(`${column} = ${this.variableMapping.get(varName)}`);
    } else {
      this.variableMapping.set(varName, column);
    }
    this.conditions.push(`${column} IS NOT NULL`);
  }

  /**
   * Build an EXISTS query (SELECT 1 ...)
   */
  buildExists(): { sql: string; params: (string | number)[] } {
    if (this.tables.length === 0) {
      return { sql: "SELECT 1 WHERE 0", params: [] };
    }

    const whereClause =
      this.conditions.length > 0 ? this.conditions.join(" AND ") : "1=1";

    const sql = `
      SELECT 1
      FROM ${this.tables.join(", ")}
      WHERE ${whereClause}
      LIMIT 1
    `;

    return { sql, params: this.params };
  }

  /**
   * Build the final SQL query
   */
  build(): { sql: string; params: (string | number)[] } {
    // Build SELECT clause from variable mappings
    let selectColumns = Array.from(this.variableMapping.entries()).map(
      ([varName, column]) => `${column} AS "${varName}"`,
    );

    // Handle edge case: no tables or columns
    if (this.tables.length === 0) {
      // Return a minimal valid query that returns nothing
      return {
        sql: "SELECT NULL AS _empty WHERE 1=0",
        params: [],
      };
    }

    // If no columns are selected (e.g. constant pattern), select a constant
    if (selectColumns.length === 0) {
      selectColumns = ["1 AS _constant"];
    }

    // Handle edge case: no conditions
    const whereClause =
      this.conditions.length > 0 ? this.conditions.join(" AND ") : "1=1";

    let sql = `
      SELECT DISTINCT ${selectColumns.join(", ")}
      FROM ${this.tables.join(", ")}
      WHERE ${whereClause}
    `;

    // Add ORDER BY
    if (this.orderBy && this.orderBy.length > 0) {
      const orderByParts = this.orderBy
        .map((o) => {
          const col = this.variableMapping.get(o.variable);
          return col ? `${col} ${o.direction}` : null;
        })
        .filter((part) => part !== null);

      if (orderByParts.length > 0) {
        sql += ` ORDER BY ${orderByParts.join(", ")}`;
      }
    }

    // Add LIMIT and OFFSET
    if (this.limit !== undefined) {
      sql += ` LIMIT ${this.limit}`;
      if (this.offset !== undefined) {
        sql += ` OFFSET ${this.offset}`;
      }
    }

    return { sql, params: this.params };
  }

  /**
   * Get the variable to column mapping
   */
  getVariableMapping(): Map<string, string> {
    return this.variableMapping;
  }

  /**
   * Simplify a URI to its most basic form (prefixed or local name)
   */
  private simplifyUri(uri: string): string {
    if (!uri) return "";

    // Handle full URIs by converting to prefixed form if possible
    if (uri.startsWith("http://ctx.ai/ontology/")) {
      return `ctx:${uri.replace("http://ctx.ai/ontology/", "")}`;
    }
    if (uri.startsWith("http://www.w3.org/1999/02/22-rdf-syntax-ns#")) {
      const local = uri.replace(
        "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        "",
      );
      return local === "type" ? "rdf:type" : `rdf:${local}`;
    }
    if (uri.startsWith("http://www.w3.org/2000/01/rdf-schema#")) {
      const local = uri.replace("http://www.w3.org/2000/01/rdf-schema#", "");
      return local === "label" ? "rdfs:label" : `rdfs:${local}`;
    }

    return uri;
  }

  /**
   * Resolve a URI to a database ID
   */
  private resolveUri(uri: string): string {
    const simplified = this.simplifyUri(uri);
    if (simplified.startsWith("ctx:")) {
      return simplified
        .replace("ctx:resource/", "")
        .replace("ctx:heuristic/", "")
        .replace("ctx:directive/", "")
        .replace("ctx:issue/", "")
        .replace("ctx:document/", "")
        .replace("ctx:", "");
    }
    return simplified;
  }

  /**
   * Resolve a predicate URI to an edge type
   */
  private resolvePredicate(predicate: string): string {
    const simplified = this.simplifyUri(predicate);
    if (
      simplified === "a" ||
      simplified === "rdf:type" ||
      simplified === "type"
    ) {
      return "type";
    }

    // Special case for rdfs:label which should be treated as a node attribute
    // but if it's used in addEdgePattern, it might be a mistake or specific edge
    if (simplified === "rdfs:label" || simplified === "label") {
      return "TITLE";
    }

    // If it's a ctx: predicate, try to find the original SQL type
    if (simplified.startsWith("ctx:")) {
      const localName = simplified.replace("ctx:", "");

      // Look for the localName in the reverse map (RDF -> SQL)
      // Since we don't have a reverse map, we can check if it's one of the known mappings
      for (const [sqlType, rdfPred] of Object.entries(EDGE_TYPE_TO_PREDICATE)) {
        if (
          rdfPred === simplified ||
          rdfPred.replace("ctx:", "") === localName
        ) {
          return sqlType;
        }
      }

      // If not found in mapping, assume it's the uppercase version of the local name
      return localName.toUpperCase();
    }

    return normalizePredicate(simplified).replace("ctx:", "").toUpperCase();
  }

  /**
   * Resolve a class URI to a node type
   */
  private resolveClass(classUri: string): string {
    const simplified = this.simplifyUri(classUri);
    const classMap: Record<string, string> = {
      "ctx:Heuristic": "heuristic",
      "ctx:Directive": "directive",
      "ctx:Concept": "concept",
      "ctx:Protocol": "protocol",
      "ctx:Document": "document",
      "ctx:SubstrateIssue": "issue",
      "ctx:Resource": "resource",
    };

    return (
      classMap[simplified] ||
      classMap[`ctx:${simplified}`] ||
      simplified.replace("ctx:", "").toLowerCase()
    );
  }
}

export default SparqlConnector;
