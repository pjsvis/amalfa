export interface IngestionArtifact {
  id: string;
  type: "playbook" | "debrief";
  order_index: number;
  payload: {
    title: string;
    content: string;
    domain: string;
    layer: string;
    metadata?: Record<string, unknown>;
  };
}
