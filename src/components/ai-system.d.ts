/**
 * AI SYSTEM CONTEXT & DESIGN CONTRACT
 * -----------------------------------
 * You are building a server-side rendered (SSR) application using Bun + Hono + JSX.
 * * CORE ARCHITECTURE RULES:
 * 1. STATELESS: Do not use React hooks (useState, useEffect).
 * 2. ISOLATION: Use the provided components. Do not invent new structural CSS.
 * 3. LAYOUT: Prefer Flexbox (Flow) over CSS Grid. Grid causes "voids" in dynamic layouts.
 * 4. SIZING: Use 'ch' units for text width to ensure readability on all screens.
 * 5. HYBRID: Interactive elements (Graph, Search) are client-side "Islands".
 */

// ==========================================
// 1. PRIMITIVE TYPES & CONSTANTS
// ==========================================

/**
 * Character-based width constants.
 * - 'narrow': ~45ch. Optimal for scanning lists, stats, and short text.
 * - 'standard': ~65ch. The "Golden Ratio" for long-form reading (Markdown).
 * - 'wide': ~120ch. For data tables, graphs, and complex dashboards.
 * - 'full': 100%. Use sparingly.
 */
export type ReadingWidth = "narrow" | "standard" | "wide" | "full";

/**
 * System status indicators.
 * - 'idle': Gray/Muted (Sleeping).
 * - 'active': Green/Pulsing (Working).
 * - 'warning': Yellow/Orange (Degraded).
 * - 'error': Red/Bold (Failed).
 */
export type SystemStatus = "idle" | "active" | "warning" | "error";

// ==========================================
// 2. FLOW LAYOUTS (The Anti-Grid System)
// ==========================================

/**
 * The primary page shell.
 * Enforces vertical rhythm and centers content horizontally.
 */
export interface PageWrapperProps {
  children: JSX.Element | JSX.Element[];
  title?: string;
}

/**
 * A fluid container for collections (Cards, Stats, Pipelines).
 * RULES:
 * - Uses `flex-wrap: wrap` to prevent layout breakage.
 * - Items naturally flow left-to-right.
 * - NEVER use CSS Grid on the children of this container.
 */
export interface FlowContainerProps {
  children: JSX.Element[];
  /** * spacing between items.
   * 'tight' = gap-2, 'loose' = gap-6
   */
  gap?: "tight" | "normal" | "loose";
}

/**
 * A constrained column that prevents text from stretching too wide.
 * ALWAYS use this to wrap text content or single-column layouts.
 */
export interface ReadingColumnProps {
  children: JSX.Element | JSX.Element[];
  /** Defaults to 'standard' (65ch) for documents */
  width?: ReadingWidth;
  /** Adds vertical padding. Defaults to true. */
  padded?: boolean;
}

// ==========================================
// 3. ISOLATED CONTENT (The "Doc" Pattern)
// ==========================================

/**
 * Renders raw HTML from Markdown sources.
 * * CRITICAL IMPLEMENTATION DETAIL:
 * This component wraps content in a div with `id="doc-{docId}"`.
 * Our CSS uses `[id^="doc-"]` selectors to apply typography styles
 * without bleeding into the global scope.
 */
export interface DocViewerProps {
  /** The pre-rendered HTML string */
  contentHtml: string;
  /** Unique ID suffix (e.g. "01", "readme") */
  docId: string;
  /** Optional metadata header (author, date, tags) */
  meta?: {
    title: string;
    date: string;
    tags?: string[];
  };
}

// ==========================================
// 4. DATA VISUALIZATION & MONITORING
// ==========================================

/**
 * A row in a status monitoring list.
 * Designed to be stacked inside a ReadingColumn (width="narrow").
 */
export interface PipelineRowProps {
  /** The human-readable name of the pipeline */
  name: string;
  /** The current operational state */
  status: SystemStatus;
  /** e.g. "5 mins ago", "Live" */
  lastUpdated: string;
  /** Key metric to display on the right (e.g. "500 items") */
  metric?: string | number;
}

/**
 * A client-side "Island" for rendering Sigma.js graphs.
 * Renders an empty container that the client script hydrates.
 * * NOTE: This component is an isolated "Portal". Styles inside
 * do not affect the outside page.
 */
export interface GraphVizContainerProps {
  /** The API endpoint to fetch the graph JSON data */
  dataUrl: string;
  /** Height of the graph viewport. Defaults to '600px' */
  height?: string;
}

/**
 * A simple stat card for the FlowContainer.
 * Fixed width (e.g., w-64) but flexible height.
 */
export interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
}

// ==========================================
// 5. INTERACTION ISLANDS
// ==========================================

/**
 * A search input that triggers the Amalfa Search API.
 * Uses native <dialog> or standard form submission.
 */
export interface SearchInputProps {
  placeholder?: string;
  actionUrl?: string;
  autoFocus?: boolean;
}
