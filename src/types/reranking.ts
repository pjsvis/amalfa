/**
 * Reranking configuration types and utilities
 */

export type RerankingMode = "none" | "bge-m3" | "sonar" | "hybrid";

export interface RerankingConfig {
  enabled: boolean;
  mode: RerankingMode;
  bge: {
    topK: number;
    threshold: number;
  };
  sonar: {
    topK: number;
  };
}

export const DEFAULT_RERANKING_CONFIG: RerankingConfig = {
  enabled: false,
  mode: "none",
  bge: {
    topK: 15,
    threshold: 0.25,
  },
  sonar: {
    topK: 5,
  },
};
