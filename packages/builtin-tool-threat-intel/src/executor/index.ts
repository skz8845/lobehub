import type { BuiltinToolContext, BuiltinToolResult } from '@lobechat/types';
import { BaseExecutor } from '@lobechat/types';

import { lambdaClient } from '@/libs/trpc/client';

import {
  type QueryFileHashArgs,
  type QueryFileHashState,
  type QueryIndicatorArgs,
  type QueryIndicatorState,
  ThreatIntelApiName,
  ThreatIntelIdentifier,
} from '../types';

class ThreatIntelExecutor extends BaseExecutor<typeof ThreatIntelApiName> {
  readonly identifier = ThreatIntelIdentifier;
  protected readonly apiEnum = ThreatIntelApiName;

  queryFileHash = async (
    params: QueryFileHashArgs,
    _ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    try {
      const result = await lambdaClient.threatIntel.queryFileHash.mutate(params, _ctx);

      if (!result.success) return result as BuiltinToolResult;

      const records = (result as any).records ?? [];
      const state: QueryFileHashState = {
        fileId: params.fileId,
        fileName: params.fileName,
        hashes: (result as any).hashes,
        records,
        total: records.length,
      };

      return { ...result, state };
    } catch (e) {
      return {
        content: `文件哈希查询失败: ${(e as Error).message}`,
        error: { body: e, message: (e as Error).message, type: 'PluginServerError' },
        success: false,
      };
    }
  };

  queryIndicator = async (
    params: QueryIndicatorArgs,
    _ctx: BuiltinToolContext,
  ): Promise<BuiltinToolResult> => {
    try {
      // Filter out 'unknown' type as it's not accepted by the API
      const apiParams = {
        ...params,
        type: params.type === 'unknown' ? undefined : params.type,
      };
      const result = await lambdaClient.threatIntel.queryIndicator.mutate(apiParams, _ctx);

      if (!result.success) return result as BuiltinToolResult;

      const records = (result as any).records ?? [];
      const state: QueryIndicatorState = {
        indicator: params.indicator,
        records,
        total: records.length,
        type: (result as any).type ?? 'unknown',
      };

      return { ...result, state };
    } catch (e) {
      return {
        content: `查询失败: ${(e as Error).message}`,
        error: { body: e, message: (e as Error).message, type: 'PluginServerError' },
        success: false,
      };
    }
  };
}

export const threatIntelExecutor = new ThreatIntelExecutor();
