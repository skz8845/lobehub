import type { BuiltinServerRuntimeOutput } from '@lobechat/types';

import type {
  AnalyzeAttackBehaviorArgs,
  AnalyzeAttackBehaviorState,
  AttributeIncidentArgs,
  AttributeIncidentState,
  BuildAttackerProfileArgs,
  BuildAttackerProfileState,
  QueryAttackedTargetsArgs,
  QueryAttackedTargetsState,
  QueryAttackerEventsArgs,
  QueryAttackerEventsState,
  QueryIndicatorIntelArgs,
  QueryIndicatorIntelState,
} from '../types';

export interface IncidentAnalyzerServiceResult {
  content: string;
  data?: any;
  success: boolean;
}

export interface IncidentAnalyzerService {
  analyzeAttackBehavior: (
    args: AnalyzeAttackBehaviorArgs,
  ) => Promise<IncidentAnalyzerServiceResult>;
  attributeIncident: (args: AttributeIncidentArgs) => Promise<IncidentAnalyzerServiceResult>;
  buildAttackerProfile: (args: BuildAttackerProfileArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryAttackedTargets: (args: QueryAttackedTargetsArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryAttackerEvents: (args: QueryAttackerEventsArgs) => Promise<IncidentAnalyzerServiceResult>;
  queryIndicatorIntel: (args: QueryIndicatorIntelArgs) => Promise<IncidentAnalyzerServiceResult>;
}

export class IncidentAnalyzerExecutionRuntime {
  private service: IncidentAnalyzerService;

  constructor(service: IncidentAnalyzerService) {
    this.service = service;
  }

  async queryAttackerEvents(args: QueryAttackerEventsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryAttackerEvents(args);
      if (!result.success) return { content: result.content, success: false };
      const records = result.data?.records ?? [];
      const state: QueryAttackerEventsState = {
        current: result.data?.current,
        records,
        srcIp: args.srcIp,
        total: result.data?.total ?? records.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return {
        content: `查询攻击者历史事件失败: ${(e as Error).message}`,
        error: e,
        success: false,
      };
    }
  }

  async analyzeAttackBehavior(
    args: AnalyzeAttackBehaviorArgs,
  ): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.analyzeAttackBehavior(args);
      if (!result.success) return { content: result.content, success: false };
      const state: AnalyzeAttackBehaviorState = {
        profile: result.data ?? {},
        srcIp: args.srcIp,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `分析攻击行为失败: ${(e as Error).message}`, error: e, success: false };
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

  async buildAttackerProfile(args: BuildAttackerProfileArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.buildAttackerProfile(args);
      if (!result.success) return { content: result.content, success: false };
      const state: BuildAttackerProfileState = {
        profile: result.data ?? {},
        srcIp: args.srcIp,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `构建攻击者画像失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async queryAttackedTargets(args: QueryAttackedTargetsArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.queryAttackedTargets(args);
      if (!result.success) return { content: result.content, success: false };
      const items = result.data?.items ?? [];
      const state: QueryAttackedTargetsState = {
        items,
        srcIp: args.srcIp,
        total: result.data?.total ?? items.length,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `查询被攻击目标失败: ${(e as Error).message}`, error: e, success: false };
    }
  }

  async attributeIncident(args: AttributeIncidentArgs): Promise<BuiltinServerRuntimeOutput> {
    try {
      const result = await this.service.attributeIncident(args);
      if (!result.success) return { content: result.content, success: false };
      const state: AttributeIncidentState = {
        attribution: result.data ?? {},
        srcIp: args.srcIp,
      };
      return { content: result.content, state, success: true };
    } catch (e) {
      return { content: `归因分析失败: ${(e as Error).message}`, error: e, success: false };
    }
  }
}
