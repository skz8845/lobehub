export interface RerankPayload {
  documents: string[];
  model: string;
  query: string;
  topN?: number;
}

export interface RerankResult {
  index: number;
  relevanceScore: number;
}

export interface RerankOptions {
  signal?: AbortSignal;
  user?: string;
}
