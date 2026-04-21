import { DEFAULT_FILES_CONFIG } from '@/const/settings/knowledge';
import { type SystemEmbeddingConfig } from '@/types/knowledgeBase';
import { type FilesConfig } from '@/types/user/settings/filesConfig';

const protectedKeys = Object.keys({
  candidate_pool_size: null,
  embedding_dimensions: null,
  embedding_model: null,
  min_similarity: null,
  query_mode: null,
  rerank_top_k: null,
  reranker_model: null,
});

export const parseFilesConfig = (envString: string = ''): SystemEmbeddingConfig => {
  if (!envString) return DEFAULT_FILES_CONFIG;
  const config: FilesConfig = {} as any;

  // Handle full-width commas and extra spaces
  const envValue = envString.replaceAll('，', ',').trim();

  const pairs = envValue.split(',');

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map((s) => s.trim());

    if (key && value) {
      const [provider, ...modelParts] = value.split('/');
      const model = modelParts.join('/');

      if (protectedKeys.includes(key)) {
        switch (key) {
          case 'embedding_model': {
            if (!provider || !model) {
              throw new Error(
                'Invalid environment variable format.  expected of the form embedding_model=provider/model',
              );
            }
            config.embeddingModel = { model: model.trim(), provider: provider.trim() };
            break;
          }
          case 'reranker_model': {
            if (!provider || !model) {
              throw new Error(
                'Invalid environment variable format.  expected of the form reranker_model=provider/model',
              );
            }
            config.rerankerModel = { model: model.trim(), provider: provider.trim() };
            break;
          }
          case 'query_mode': {
            config.queryMode = value;
            break;
          }
          case 'embedding_dimensions': {
            const dims = Number(value);
            if (!Number.isInteger(dims) || dims <= 0) {
              throw new Error(
                'Invalid environment variable format. embedding_dimensions must be a positive integer',
              );
            }
            config.embeddingModel = { ...config.embeddingModel, dimensions: dims } as any;
            break;
          }
          case 'min_similarity': {
            const val = Number(value);
            if (Number.isNaN(val) || val < 0 || val > 1) {
              throw new Error(
                'Invalid environment variable format. min_similarity must be a number between 0 and 1',
              );
            }
            config.minSimilarity = val;
            break;
          }
          case 'rerank_top_k': {
            const topK = Number(value);
            if (!Number.isInteger(topK) || topK <= 0) {
              throw new Error(
                'Invalid environment variable format. rerank_top_k must be a positive integer',
              );
            }
            config.rerankTopK = topK;
            break;
          }
          case 'candidate_pool_size': {
            const pool = Number(value);
            if (!Number.isInteger(pool) || pool <= 0) {
              throw new Error(
                'Invalid environment variable format. candidate_pool_size must be a positive integer',
              );
            }
            config.candidatePoolSize = pool;
            break;
          }
          default: {
            throw new Error(
              'Invalid environment variable format. expected one of embedding_model, reranker_model, query_mode, embedding_dimensions, min_similarity, rerank_top_k, candidate_pool_size',
            );
          }
        }
      }
    } else {
      throw new Error('Invalid environment variable format.');
    }
  }
  return config;
};
