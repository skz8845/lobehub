import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  QueryAssetByIpArgs,
  QueryAssetByIpState,
  QueryEventDetailArgs,
  QueryEventDetailState,
  QueryIndicatorIntelArgs,
  QueryIndicatorIntelState,
  QueryIpEventsArgs,
  QueryIpEventsState,
  QueryIpVulnerabilitiesArgs,
  QueryIpVulnerabilitiesState,
} from '../types';

export interface IncidentAnalyzerServiceResult {
  content: string;
  data?: any;
  success: boolean;
}

export interface IncidentAnalyzerService {
  queryAssetByIp: (args: QueryAssetByIpArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryEventDetail: (args: QueryEventDetailArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIndicatorIntel: (args: QueryIndicatorIntelArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIpEvents: (args: QueryIpEventsArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIpVulnerabilities: (
    args: QueryIpVulnerabilitiesArgs,
  ) => Promise<IncidentAnalyzerServiceResult>;
}

export class IncidentAnalyzerExecutionRuntime {
  private service: IncidentAnalyzerService;

  constructor(service: IncidentAnalyzerService) {
    this.service = service;
  }

  async queryEventDetail(args: QueryEventDetailArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryEventDetail(args);
      if (!result.success) return { content: result.content, success: false };
      const state: QueryEventDetailState = {
        event: result.data ?? null,
        eventId: args.eventId,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询事件详情失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryIpEvents(args: QueryIpEventsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIpEvents(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryIpEventsState = {
        current: result.data?.current,
        ip: args.srcIp,
        ipRole: args.ipRole ?? 'src',
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `查询 IP 关联事件失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async queryAssetByIp(args: QueryAssetByIpArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryAssetByIp(args);
      if (!result.success) return { content: result.content, success: false };
      const state: QueryAssetByIpState = {
        assets: result.data ?? [],
        ip: args.ip,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询资产信息失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryIpVulnerabilities(
    args: QueryIpVulnerabilitiesArgs,
  ): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIpVulnerabilities(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryIpVulnerabilitiesState = {
        ip: args.ip,
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询脆弱性失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryIndicatorIntel(args: QueryIndicatorIntelArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryIndicatorIntel(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryIndicatorIntelState = {
        indicator: args.indicator,
        records,
        total: records.length,
        type: result.data?.type ?? 'unknown',
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询威胁情报失败: ${(e as Error).message}`, error: e, success: false };
    }
  }
}
