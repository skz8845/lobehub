import type { ChatModelCard } from '@lobechat/types';
import { ModelProvider } from 'model-bank';

import type { OpenAICompatibleFactoryOptions } from '../../core/openaiCompatibleFactory';
import { createOpenAICompatibleRuntime } from '../../core/openaiCompatibleFactory';
import { resolveParameters } from '../../core/parameterResolver';
import type { RerankResult } from '../../types';

export interface CohereModelCard {
  context_length: number;
  features: string[] | null;
  name: string;
  supports_vision: boolean;
}

export const params = {
  baseURL: 'https://api.cohere.ai/compatibility/v1',
  chatCompletion: {
    // https://docs.cohere.com/v2/docs/compatibility-api#unsupported-parameters
    excludeUsage: true,
    handlePayload: (payload) => {
      const { frequency_penalty, presence_penalty, top_p, ...rest } = payload;

      // Resolve parameters with range constraints
      const resolvedParams = resolveParameters(
        { frequency_penalty, presence_penalty, top_p },
        {
          frequencyPenaltyRange: { max: 1, min: 0 },
          normalizeTemperature: false,
          presencePenaltyRange: { max: 1, min: 0 },
          topPRange: { max: 1, min: 0 },
        },
      );

      return {
        ...rest,
        ...resolvedParams,
      } as any;
    },
    noUserId: true,
  },
  debug: {
    chatCompletion: () => process.env.DEBUG_COHERE_CHAT_COMPLETION === '1',
  },
  models: async ({ client }) => {
    const { LOBE_DEFAULT_MODEL_LIST } = await import('model-bank');

    client.baseURL = 'https://api.cohere.com/v1';

    const modelsPage = (await client.models.list()) as any;
    const modelList: CohereModelCard[] = modelsPage.body.models;

    return modelList
      .map((model) => {
        const knownModel = LOBE_DEFAULT_MODEL_LIST.find(
          (m) => model.name.toLowerCase() === m.id.toLowerCase(),
        );

        return {
          contextWindowTokens: model.context_length,
          displayName: knownModel?.displayName ?? undefined,
          enabled: knownModel?.enabled || false,
          functionCall:
            (model.features && model.features.includes('tools')) ||
            knownModel?.abilities?.functionCall ||
            false,
          id: model.name,
          vision: model.supports_vision || knownModel?.abilities?.vision || false,
        };
      })
      .filter(Boolean) as ChatModelCard[];
  },
  provider: ModelProvider.Cohere,
  rerank: async ({ apiKey, payload }) => {
    const response = await fetch('https://api.cohere.ai/v2/rerank', {
      body: JSON.stringify({
        documents: payload.documents,
        model: payload.model,
        query: payload.query,
        return_documents: false,
        top_n: payload.topN,
      }),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Cohere rerank failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    return (data.results as any[]).map(
      (r): RerankResult => ({ index: r.index, relevanceScore: r.relevance_score }),
    );
  },
} satisfies OpenAICompatibleFactoryOptions;

export const LobeCohereAI = createOpenAICompatibleRuntime(params);
