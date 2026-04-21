import {
  type AWSBedrockKeyVault,
  type AzureOpenAIKeyVault,
  type CloudflareKeyVault,
  type ComfyUIKeyVault,
  type OpenAICompatibleKeyVault,
  type VertexAIKeyVault,
} from '@lobechat/types';
import { clientApiKeyManager } from '@lobechat/utils/client';
import { ModelProvider } from 'model-bank';

import { SSO_APP_TOKEN_KEY, SSO_USER_TOKEN_KEY } from '@/libs/sso';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';

import { resolveRuntimeProvider } from './chat/helper';

export const getProviderAuthPayload = (
  provider: string,
  keyVaults: OpenAICompatibleKeyVault &
    AzureOpenAIKeyVault &
    AWSBedrockKeyVault &
    CloudflareKeyVault &
    ComfyUIKeyVault &
    VertexAIKeyVault,
) => {
  switch (provider) {
    case ModelProvider.Bedrock: {
      const { accessKeyId, region, secretAccessKey, sessionToken } = keyVaults;

      const awsSecretAccessKey = secretAccessKey;
      const awsAccessKeyId = accessKeyId;

      const apiKey = (awsSecretAccessKey || '') + (awsAccessKeyId || '');

      return {
        accessKeyId,
        accessKeySecret: awsSecretAccessKey,
        apiKey,
        /** @deprecated */
        awsAccessKeyId,
        /** @deprecated */
        awsRegion: region,
        /** @deprecated */
        awsSecretAccessKey,
        /** @deprecated */
        awsSessionToken: sessionToken,
        region,
        sessionToken,
      };
    }

    case ModelProvider.Azure: {
      return {
        apiKey: clientApiKeyManager.pick(keyVaults.apiKey),

        apiVersion: keyVaults.apiVersion,
        /** @deprecated */
        azureApiVersion: keyVaults.apiVersion,
        baseURL: keyVaults.baseURL || keyVaults.endpoint,
      };
    }

    case ModelProvider.Ollama: {
      const apiKey = keyVaults?.apiKey || process.env.OLLAMA_API_KEY;
      return { baseURL: keyVaults?.baseURL, apiKey };
    }

    case ModelProvider.Cloudflare: {
      return {
        apiKey: clientApiKeyManager.pick(keyVaults?.apiKey),

        baseURLOrAccountID: keyVaults?.baseURLOrAccountID,
        /** @deprecated */
        cloudflareBaseURLOrAccountID: keyVaults?.baseURLOrAccountID,
      };
    }

    case ModelProvider.ComfyUI: {
      return {
        apiKey: keyVaults?.apiKey,
        authType: keyVaults?.authType,
        baseURL: keyVaults?.baseURL,
        customHeaders: keyVaults?.customHeaders,
        password: keyVaults?.password,
        username: keyVaults?.username,
      };
    }

    case ModelProvider.VertexAI: {
      // Vertex AI uses JSON credentials, should not split by comma
      return {
        apiKey: keyVaults?.apiKey,
        baseURL: keyVaults?.baseURL,
        vertexAIRegion: keyVaults?.region,
      };
    }

    default: {
      return { apiKey: clientApiKeyManager.pick(keyVaults?.apiKey), baseURL: keyVaults?.baseURL };
    }
  }
};

/**
 * Get SSO tokens from cookie (priority) or localStorage
 */
const getSSOTokensFromStorage = (): { userToken?: string; appToken?: string } => {
  if (typeof window === 'undefined') return {};

  // First try to get from cookie
  const cookies = document.cookie.split(';');
  const userTokenCookie = cookies.find((c) => c.trim().startsWith(`${SSO_USER_TOKEN_KEY}=`));
  const appTokenCookie = cookies.find((c) => c.trim().startsWith(`${SSO_APP_TOKEN_KEY}=`));

  if (userTokenCookie && appTokenCookie) {
    const userToken = decodeURIComponent(userTokenCookie.split('=')[1]);
    const appToken = decodeURIComponent(appTokenCookie.split('=')[1]);
    if (userToken && appToken) {
      return { appToken, userToken };
    }
  }

  // Fallback to localStorage
  const userToken = localStorage.getItem(SSO_USER_TOKEN_KEY);
  const appToken = localStorage.getItem(SSO_APP_TOKEN_KEY);

  if (!userToken || !appToken) return {};

  return { appToken, userToken };
};

interface AuthParams {
  headers?: HeadersInit;
  provider?: string;
}

export const createPayloadWithKeyVaults = (provider: string) => {
  const keyVaults =
    aiProviderSelectors.providerKeyVaults(provider)(useAiInfraStore.getState()) || {};

  const runtimeProvider = resolveRuntimeProvider(provider);

  return {
    ...getProviderAuthPayload(runtimeProvider, keyVaults as any),
    runtimeProvider,
  };
};

export const createHeaderWithAuth = async (params?: AuthParams): Promise<HeadersInit> => {
  // Get SSO tokens from localStorage and add to headers
  const ssoTokens = getSSOTokensFromStorage();
  const ssoHeaders: HeadersInit = {};
  if (ssoTokens.userToken) {
    ssoHeaders['RZZX-USERTOKEN'] = ssoTokens.userToken;
  }
  if (ssoTokens.appToken) {
    ssoHeaders['RZZX-APPTOKEN'] = ssoTokens.appToken;
  }

  return { ...params?.headers, ...ssoHeaders };
};
