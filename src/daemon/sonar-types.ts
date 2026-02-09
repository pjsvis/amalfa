/**
 * Common types and interfaces for Sonar Agent
 */

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  startedAt: Date;
}

export interface SonarTask {
  type:
    | "synthesis"
    | "timeline"
    | "enhance_batch"
    | "garden"
    | "research"
    | "chat";
  minSize?: number;
  limit?: number;
  autoApply?: boolean;
  notify?: boolean;
  query?: string;
  model?: string;
  sessionId?: string;
  message?: string;
}

export interface RequestOptions {
  temperature?: number;
  num_predict?: number;
  stream?: boolean;
  format?: "json";
  model?: string;
}

/**
 * API Request Types
 */
export interface ChatRequest {
  sessionId: string;
  message: string;
  model?: string;
}

export interface MetadataEnhanceRequest {
  docId: string;
}

export interface SearchAnalyzeRequest {
  query: string;
}

export interface SearchRerankRequest {
  results: Array<{ id: string; content: string; score: number }>;
  query: string;
  intent?: string;
}

export interface SearchContextRequest {
  result: { id: string; content: string };
  query: string;
}
