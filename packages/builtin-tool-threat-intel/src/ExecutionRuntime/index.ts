import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  FileHashes,
  IndicatorType,
  QueryFileHashArgs,
  QueryFileHashState,
  QueryIndicatorArgs,
  QueryIndicatorState,
  ThreatIntelRecord,
} from '../types';

export interface ThreatIntelServiceResult {
  content: string;
  hashes?: FileHashes;
  records?: ThreatIntelRecord[];
  success: boolean;
  type?: IndicatorType;
}

export interface ThreatIntelService {
  queryFileHash: (args: QueryFileHashArgs) => Promise<ThreatIntelServiceResult>;
  queryIndicator: (args: QueryIndicatorArgs) => Promise<ThreatIntelServiceResult>;
}

export class ThreatIntelExecutionRuntime {
  private service: ThreatIntelService;

  constructor(service: ThreatIntelService) {
    this.service = service;
  }

  async queryFileHash(args: QueryFileHashArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryFileHash(args);

      if (!result.success) {
        return { content: result.content, success: false };
      }

      const records = result.records ?? [];
      const state: QueryFileHashState = {
        fileId: args.fileId,
        fileName: args.fileName,
        hashes: result.hashes!,
        records,
        total: records.length,
      };

      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `文件哈希查询失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async queryIndicator(args: QueryIndicatorArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIndicator(args);

      if (!result.success) {
        return { content: result.content, success: false };
      }

      const records = result.records ?? [];
      const state: QueryIndicatorState = {
        indicator: args.indicator,
        records,
        total: records.length,
        type: result.type ?? 'unknown',
      };

      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `查询失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }
}
