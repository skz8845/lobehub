import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  GetAbnormalDeviceStatsArgs,
  GetAbnormalDeviceStatsState,
  GetAttackTopIPsArgs,
  GetAttackTopIPsState,
  GetEventRiskStatsArgs,
  GetEventRiskStatsState,
  GetEventTypeStatsArgs,
  GetEventTypeStatsState,
  GetSecurityOverviewArgs,
  GetSecurityOverviewState,
  QuerySecurityEventsArgs,
  QuerySecurityEventsState,
  QueryVulnerabilitiesArgs,
  QueryVulnerabilitiesState,
} from '../types';

export interface SaAnalyzerServiceResult {
  content: string;
  data?: any;
  success: boolean;
}

export interface SaAnalyzerService {
  getAbnormalDeviceStats: (args: GetAbnormalDeviceStatsArgs) => Promise<SaAnalyzerServiceResult>;
  getAttackTopIPs: (args: GetAttackTopIPsArgs) => Promise<SaAnalyzerServiceResult>;
  getEventRiskStats: (args: GetEventRiskStatsArgs) => Promise<SaAnalyzerServiceResult>;
  getEventTypeStats: (args: GetEventTypeStatsArgs) => Promise<SaAnalyzerServiceResult>;
  getSecurityOverview: (args: GetSecurityOverviewArgs) => Promise<SaAnalyzerServiceResult>;
  querySecurityEvents: (args: QuerySecurityEventsArgs) => Promise<SaAnalyzerServiceResult>;
  queryVulnerabilities: (args: QueryVulnerabilitiesArgs) => Promise<SaAnalyzerServiceResult>;
}

export class SaAnalyzerExecutionRuntime {
  private service: SaAnalyzerService;

  constructor(service: SaAnalyzerService) {
    this.service = service;
  }

  async querySecurityEvents(args: QuerySecurityEventsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.querySecurityEvents(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QuerySecurityEventsState = {
        current: result.data?.current,
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询安全事件失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryVulnerabilities(args: QueryVulnerabilitiesArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryVulnerabilities(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryVulnerabilitiesState = {
        current: result.data?.current,
        records,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询脆弱性失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async getSecurityOverview(args: GetSecurityOverviewArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.getSecurityOverview(args);
      if (!result.success) return { content: result.content, success: false };
      const state: GetSecurityOverviewState = { items: result.data ?? [] };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `获取安全概览失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async getAbnormalDeviceStats(
    args: GetAbnormalDeviceStatsArgs,
  ): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.getAbnormalDeviceStats(args);
      if (!result.success) return { content: result.content, success: false };
      const state: GetAbnormalDeviceStatsState = { stats: result.data ?? {} };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `获取异常设备统计失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async getAttackTopIPs(args: GetAttackTopIPsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.getAttackTopIPs(args);
      if (!result.success) return { content: result.content, success: false };
      const state: GetAttackTopIPsState = { direction: args.direction, items: result.data ?? [] };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `获取攻击Top IP失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async getEventTypeStats(args: GetEventTypeStatsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.getEventTypeStats(args);
      if (!result.success) return { content: result.content, success: false };
      const state: GetEventTypeStatsState = { items: result.data ?? [] };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `获取事件类型统计失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async getEventRiskStats(args: GetEventRiskStatsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.getEventRiskStats(args);
      if (!result.success) return { content: result.content, success: false };
      const state: GetEventRiskStatsState = { items: result.data ?? [] };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `获取风险级别统计失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }
}
