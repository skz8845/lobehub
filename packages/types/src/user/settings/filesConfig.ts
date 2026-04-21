export interface FilesConfigItem {
  dimensions?: number;
  model: string;
  provider: string;
}
export interface FilesConfig {
  candidatePoolSize?: number;
  embeddingModel: FilesConfigItem;
  minSimilarity?: number;
  queryMode: string;
  rerankerModel: FilesConfigItem;
  rerankTopK?: number;
}
