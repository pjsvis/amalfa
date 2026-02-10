import { getLogger } from "@src/utils/Logger";

export type PipelineStage =
  | "Discovery"
  | "Sync"
  | "Embedding"
  | "Weaving"
  | "Enrichment";
export type PipelineStatus = "idle" | "active" | "warning" | "error";

export interface StageMetrics {
  status: PipelineStatus;
  metric: string;
  lastUpdated: string;
}

class PipelineTelemetry {
  private log = getLogger("Telemetry");
  private stages: Record<PipelineStage, StageMetrics> = {
    Discovery: { status: "idle", metric: "0 files", lastUpdated: "-" },
    Sync: { status: "idle", metric: "0 nodes", lastUpdated: "-" },
    Embedding: { status: "idle", metric: "0 vectors", lastUpdated: "-" },
    Weaving: { status: "idle", metric: "0 edges", lastUpdated: "-" },
    Enrichment: { status: "idle", metric: "0 records", lastUpdated: "-" },
  };

  public update(stage: PipelineStage, status: PipelineStatus, metric: string) {
    this.stages[stage] = {
      status,
      metric,
      lastUpdated: new Date().toLocaleTimeString(),
    };
    this.log.debug({ stage, status, metric }, "Pipeline updated");
  }

  public getStats() {
    return this.stages;
  }
}

export const telemetry = new PipelineTelemetry();
